---
sidebar_position: 7
---

# Extensions

## The purpose of Ditsmod extension

The extension does its work before creating HTTP request handlers, and it can dynamically add [providers][9]. To modify or extend the behavior of the application, an extension typically uses metadata attached to certain decorators. Extensions can be initialized asynchronously, and can depend on each other.

For example, the [@ditsmod/body-parser][5] module has an extension that dynamically adds an HTTP interceptor for parsing the request body to any route that has the appropriate method (POST, PATCH, PUT). It does this once before creating HTTP request handlers, so there is no need to test the need for such parsing for each request.

Another example. The [@ditsmod/openapi][6] module allows you to create OpenAPI documentation using the new `@oasRoute` decorator. Without the extension working, Ditsmod will ignore the metadata from this new decorator.

## What is "Ditsmod extension"

In Ditsmod, **extension** is a class that implements the `Extension` interface:

```ts
interface Extension<T> {
  init(isLastExtensionCall: boolean): Promise<T>;
}
```

Each extension needs to be registered, this will be mentioned later, and now let's assume that such registration has taken place, the application is running, and then the following process goes on:

1. metadata is collected from all decorators (`@rootModule`, `@featureModule`, `@controller`, `@route`...);
2. this metadata is then passed to DI with token `MetadataPerMod1`, so - every extension can get this metadata in the constructor;
3. the work on the extensions starts per module:
    - in each module, the extensions created within this module or imported into this module are collected;
    - each of these extensions gets metadata, also collected in this module, and the `init()` methods of given extensions are called.
4. HTTP request handlers are created;
5. the application starts working in the usual mode, processing HTTP requests.

The `init()` method of a given extension can be called as many times as it is written in the body of other extensions that depend on the operation of that extension, +1. This feature must be taken into account to avoid unnecessary initialization:

```ts {9-11}
import { injectable } from '@ditsmod/core';
import { Extension } from '@ditsmod/core';

@injectable()
export class MyExtension implements Extension<void> {
  private data: any;

  async init() {
    if (this.data) {
      return this.data;
    }

    // ...
    // Do something good
    // ...

    this.data = result;
    return this.data;
  }
}
```

You can see a simple example in the folder [09-one-extension][1].

## Extensions groups

Each extension should belong to one or more groups. Under the hood of Ditsmod, extension groups are essentially groups of [multi-providers][7] that typically work on the same metadata and also return other metadata that share the same basic interface.

The concept of **extension groups** has been introduced so that:

1. a set of extensions can work on the same metadata, and the order of work within that set is not important;
2. it was possible to customize the order of work between different sets of extensions.

In other words, to form a single group of extensions, the order of operation of each extension is not important. On the other hand, if the order of operation between different extensions is important, you should consider splitting these extensions into different groups.

For example, in `@ditsmod/router` there is a group `ROUTES_EXTENSIONS` which by default includes a single extension that processes metadata collected from the `@route()` decorator. If an application requires OpenAPI documentation, you can import the `@ditsmod/openapi` module, which also has an extension registered in the `ROUTES_EXTENSIONS` group, but this extension works with the `@oasRoute()` decorator. In this case, two extensions will already be registered in the `ROUTES_EXTENSIONS` group, each of which will prepare data for establishing the router's routes. These extensions are grouped together because they configure routes and their `init()` methods return data with the same basic interface.

Having a single base data interface returned by each extension in a given group is an important requirement because other extensions may expect data from that group and will rely on that base interface. Of course, the base interface can be expanded if necessary, but not narrowed.

In our example, after all the extensions from the `ROUTES_EXTENSIONS` group have worked, their data is collected in one array and passed to the `PRE_ROUTER_EXTENSIONS` group. Even if you later register more new extensions in the `ROUTES_EXTENSIONS` group, the `PRE_ROUTER_EXTENSIONS` group will still be started after absolutely all extensions from the `ROUTES_EXTENSIONS` group, including your new extensions, have been worked out.

This feature is very handy because it sometimes allows you to integrate external Ditsmod modules (for example, from npmjs.com) into your application without any customization, just by importing them into the desired module. Thanks to extension groups, the imported extensions will be executed in the correct order, even if they are imported from different external modules.

This is how the extension from `@ditsmod/body-parser` works, for example. You simply import `BodyParserModule`, and its extensions will already be run in the correct order, which is written in this module. In this case, its extension will run after the `ROUTES_EXTENSIONS` group, but before the `PRE_ROUTER_EXTENSIONS` group. And note that `BodyParserModule` has no idea which extensions will work in these groups, it only cares about

1. the data interface that the extensions in the `ROUTES_EXTENSIONS` group will return;
2. the startup order, so that the routes are not installed before this module works (i.e. the `PRE_ROUTER_EXTENSIONS` group works after it, not before).

This means that the `BodyParserModule` will take into account the routes set with the `@route()` or `@oasRoute()` decorators, or any other decorators from this group, since they are processed by the extensions that run before it in the `ROUTES_EXTENSIONS` group.

## Extension registration

[Register the extension][4] in an existing extension group, or create a new group, even if it has a single extension. You will need to create a new DI token for the new group.

### Creating a new group token

The extension group token must be an instance of the `InjectionToken` class.

For example, to create a token for the group `MY_EXTENSIONS`, you need to do the following:

```ts
import { InjectionToken } from '@ditsmod/core';
import { Extension } from '@ditsmod/core';

export const MY_EXTENSIONS = new InjectionToken<Extension<void>[]>('MY_EXTENSIONS');
```

As you can see, each extension group must specify that DI will return an array of extension instances: `Extension<void>[]`. This must be done, the only difference may be in the generic `Extension<T>[]`.

### Registering an extension in a group

Objects of the following type can be transferred to the `extensions` array, which is in the module's metadata:

```ts
export class ExtensionOptions {
  extension: ExtensionType;
  groupToken: InjectionToken<Extension<any>[]>;
  /**
   * The token of the group before which this extension will be called.
   */
  nextToken?: InjectionToken<Extension<any>[]>;
  /**
   * Indicates whether this extension needs to be exported.
   */
  exported?: boolean;
}
```

The `nextToken` property is used when you want your extension group to run before another extension group:

```ts
import { featureModule, ROUTES_EXTENSIONS } from '@ditsmod/core';

import { MY_EXTENSIONS, MyExtension } from './my.extension.js';

@featureModule({
  extensions: [
    { extension: MyExtension, groupToken: MY_EXTENSIONS, nextToken: ROUTES_EXTENSIONS, exported: true }
  ],
})
export class SomeModule {}
```

That is, the token of the group `MY_EXTENSIONS`, to which your extension belongs, is transferred to the `groupToken` property. The token of the `ROUTES_EXTENSIONS` group, before which the `MY_EXTENSIONS` group should be started, is passed to the `nextToken` property. The `exported` property indicates whether this extension should be exported from the current module.

If it doesn't matter which group of extensions your extension will work in front of, you can simplify registration:

```ts
import { featureModule } from '@ditsmod/core';

import { MY_EXTENSIONS, MyExtension } from './my.extension.js';

@featureModule({
  extensions: [
    { extension: MyExtension, groupToken: MY_EXTENSIONS, exported: true }
  ],
})
export class SomeModule {}
```

## Using ExtensionsManager

If a certain extension has a dependency on another extension, it is recommended to specify that dependency indirectly through the extension group. To do this, you need `ExtensionsManager`, which initializes extensions groups, throws errors about cyclic dependencies between extensions, and shows the entire chain of extensions that caused the loop. Additionally, `ExtensionsManager` allows you to collect extensions initialization results from the entire application, not just from a single module.

Suppose `MyExtension` has to wait for the initialization of the `OTHER_EXTENSIONS` group to complete. To do this, you must specify the dependence on `ExtensionsManager` in the constructor, and in `init()` call `init()` of this service:

```ts {17}
import { injectable } from '@ditsmod/core';
import { Extension, ExtensionsManager } from '@ditsmod/core';

import { OTHER_EXTENSIONS } from './other.extensions.js';

@injectable()
export class MyExtension implements Extension<void> {
  private inited: boolean;

  constructor(private extensionsManager: ExtensionsManager) {}

  async init() {
    if (this.inited) {
      return;
    }

    const result = await this.extensionsManager.init(OTHER_EXTENSIONS);
    // Do something here.
    this.inited = true;
  }
}
```

`ExtensionsManager` will sequentially cause the initialization of all extensions from the specified group, and the result of their work will return as an array. If extensions return arrays, they will automatically merge into a single resulting array. This behavior can be changed if the second argument in `init()` pass `false`:

```ts
await this.extensionsManager.init(OTHER_EXTENSIONS, false);
```

It is important to remember that running `init()` a particular extension processes data only in the context of the current module. For example, if `MyExtension` is imported into three different modules, Ditsmod will sequentially process these three modules with three different `MyExtension` instances. This means that one extension instance will only be able to collect data from one module.

In case you need to accumulate the results of a certain extension from all modules, you need to do the following:

```ts {17-20}
import { injectable } from '@ditsmod/core';
import { Extension, ExtensionsManager } from '@ditsmod/core';

import { OTHER_EXTENSIONS } from './other.extensions.js';

@injectable()
export class MyExtension implements Extension<void | false> {
  private inited: boolean;

  constructor(private extensionsManager: ExtensionsManager) {}

  async init() {
    if (this.inited) {
      return;
    }

    const result = await this.extensionsManager.init(OTHER_EXTENSIONS, true, MyExtension);
    if (!result) {
      return false;
    }

    // Do something here.
    this.inited = true;
  }
}
```

That is, when you need `MyExtension` to receive data from the `OTHER_EXTENSIONS` group from the entire application, you need to pass `MyExtension` as the third argument here:

```ts
const result = await this.extensionsManager.init(OTHER_EXTENSIONS, true, MyExtension);
```

This expression will return `false` until the last time the group `OTHER_EXTENSIONS` is called. For example, if the group `OTHER_EXTENSIONS` works in three different modules, then this expression in the first two modules will return `false`, and in the third - the value that this group of extensions should return.

## Dynamic addition of providers

Each extension can specify a dependency on the `ROUTES_EXTENSIONS` group to dynamically add providers at the level of:

- module,
- route,
- request.

You can see how it is done in [BodyParserExtension][3]:

```ts
@injectable()
export class BodyParserExtension implements Extension<void> {
  private inited: boolean;

  constructor(protected extensionManager: ExtensionsManager, protected injectorPerApp: InjectorPerApp) {}

  async init() {
    if (this.inited) {
      return;
    }

    // Getting the metadata collected using the ROUTES_EXTENSIONS group
    const aMetadataPerMod2 = await this.extensionManager.init(ROUTES_EXTENSIONS);

    aMetadataPerMod2.forEach((metadataPerMod2) => {
      // First, extracting the metadata of a module
      const { aControllersMetadata2, providersPerMod } = metadataPerMod2;

      // Then, extracting the metadata of a controller
      aControllersMetadata2.forEach(({ providersPerRou, providersPerReq }) => {
        // Merging the providers from a module and a controller
        const mergedProvidersPerRou = [...metadataPerMod2.providersPerRou, ...providersPerRou];
        const mergedProvidersPerReq = [...metadataPerMod2.providersPerReq, ...providersPerReq];

        // Creating a hierarchy of injectors.
        const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(providersPerMod);
        const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedProvidersPerRou);
        const injectorPerReq = injectorPerRou.resolveAndCreateChild(mergedProvidersPerReq);

        // Extracting the metadata for a route,
        // and based on it, we either add an interceptor to injectorPerReq, or not.
        const routeMeta = injectorPerRou.get(RouteMeta) as RouteMeta;
        const bodyParserConfig = injectorPerReq.resolveAndInstantiate(BodyParserConfig) as BodyParserConfig;
        if (bodyParserConfig.acceptMethods.includes(routeMeta.httpMethod)) {
          providersPerReq.push({ token: HTTP_INTERCEPTORS, useClass: BodyParserInterceptor, multi: true });
        }
      });
    });

    this.inited = true;
  }
}
```

Of course, such dynamic addition of providers is possible only before creating HTTP request handlers. As you can see, in this example, a [hierarchy of injectors][8] is created to obtain the correct data with the `RouteMeta` token.

[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/09-one-extension
[2]: #creating-an-extension-class
[3]: https://github.com/ditsmod/ditsmod/blob/0c4660a77/packages/body-parser/src/body-parser.extension.ts#L27-L40
[4]: #registering-an-extension-in-a-group
[5]: /native-modules/body-parser
[6]: /native-modules/openapi
[7]: /components-of-ditsmod-app/dependency-injection#multi-providers
[8]: /components-of-ditsmod-app/dependency-injection#hierarchy-of-injectors
[9]: /components-of-ditsmod-app/dependency-injection#providers
