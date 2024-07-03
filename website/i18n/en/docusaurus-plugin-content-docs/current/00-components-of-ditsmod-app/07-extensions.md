---
sidebar_position: 7
---

# Extensions

## The purpose of Ditsmod extension

Typically, an extension does its work before creating HTTP request handlers. To modify or extend the behavior of an application, an extension typically uses static metadata attached to certain decorators. On the other hand, an extension can also dynamically add metadata of the same type as static metadata collected from decorators. Extensions can be initialized asynchronously, and can depend on each other.

Essentially, different extensions work on a multidimensional array of configuration data (metadata). This array reflects the structure of the application:

1. it is divided into modules;
2. each module contains controllers or providers;
3. each controller has one or more routes.

Typically, each extension makes some modifications to this array, like in a pipeline, and eventually, this array is used by the final extension, which creates routes and sets up the appropriate HTTP request handlers. However, extensions don't necessarily have to work on configuration and setting up HTTP request handlers; they can also write logs, collect metrics for monitoring, or perform any other tasks.

For example, the [@ditsmod/body-parser][5] module has an extension that dynamically adds an HTTP interceptor for parsing the request body to any route that has the appropriate method (POST, PATCH, PUT). It does this once before creating HTTP request handlers, so there is no need to test the need for such parsing for each request.

Another example. The [@ditsmod/openapi][6] module allows you to create OpenAPI documentation using the new `@oasRoute` decorator. Without the extension working, Ditsmod will ignore the metadata from this new decorator. The extension from this module receives the aforementioned configuration array, finds the metadata from the `@oasRoute` decorator, and interprets this metadata by adding other metadata that will be used by another extension to set up routes.

## What is "Ditsmod extension"

In Ditsmod, **extension** is a class that implements the `Extension` interface:

```ts
interface Extension<T> {
  init(isLastExtensionCall: boolean): Promise<T>;
}
```

Each extension needs to be registered, this will be mentioned later, and now let's assume that such registration has taken place, and then the following process goes on:

1. metadata is collected from all decorators (`@rootModule`, `@featureModule`, `@controller`, `@route`...);
2. this metadata is then passed to DI with token `MetadataPerMod1`, so - every extension can get this metadata in the constructor;
3. the work on the extensions starts per module:
    - in each module, the extensions created within this module or imported into this module are collected;
    - each of these extensions gets metadata, also collected in this module, and the `init()` methods of given extensions are called.
4. HTTP request handlers are created;
5. the application starts working in the usual mode, processing HTTP requests.

The `init()` method of a given extension can be called as many times as it is written in the body of other extensions that depend on the operation of that extension, +1. This feature must be taken into account to avoid unnecessary initialization:

```ts {8-10}
import { injectable, Extension } from '@ditsmod/core';

@injectable()
export class MyExtension implements Extension<any> {
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

Any extension must be a member of one or more groups. The concept of an **extensions group** is similar to the concept of an [interceptors][10] group. Note that  interceptors group performs a specific type of work: augmenting the processing of an HTTP request for a particular route. Similarly, each extensions group represents a distinct type of work on specific metadata. As a rule, extensions in a particular group return metadata that has the same basic interface. Essentially, extension groups allow abstraction from specific extensions; instead, they make only the type of work performed within these groups important.

For example, in `@ditsmod/routing` there is a group `ROUTES_EXTENSIONS` which by default includes a single extension that processes metadata collected from the `@route()` decorator. If an application requires OpenAPI documentation, you can import the `@ditsmod/openapi` module, which also has an extension registered in the `ROUTES_EXTENSIONS` group, but this extension works with the `@oasRoute()` decorator. In this case, two extensions will already be registered in the `ROUTES_EXTENSIONS` group, each of which will prepare data for establishing the router's routes. These extensions are grouped together because they configure routes and their `init()` methods return data with the same basic interface.

Having a common base data interface returned by each extension in a given group is an important requirement because other extensions may expect data from that group and will rely on that base interface. Of course, the base interface can be expanded if necessary, but not narrowed.

In addition to a common basic interface, the sequence in which extensions groups are launched and the dependency between them is also important. In our example, after all the extensions from the `ROUTES_EXTENSIONS` group have worked, their data is collected in one array and passed to the `PRE_ROUTER_EXTENSIONS` group. Even if you later register more new extensions in the `ROUTES_EXTENSIONS` group, the `PRE_ROUTER_EXTENSIONS` group will still be started after absolutely all extensions from the `ROUTES_EXTENSIONS` group, including your new extensions, have been worked out.

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
import { InjectionToken, Extension } from '@ditsmod/core';

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
import { MyExtension, MY_EXTENSIONS } from './my.extension.js';

@featureModule({
  extensions: [
    { extension: MyExtension, groupToken: MY_EXTENSIONS, nextToken: ROUTES_EXTENSIONS, exported: true }
  ],
})
export class SomeModule {}
```

That is, the token of the group `MY_EXTENSIONS`, to which your extension belongs, is transferred to the `groupToken` property. The token of the `ROUTES_EXTENSIONS` group, before which the `MY_EXTENSIONS` group should be started, is passed to the `nextToken` property. The `exported` property indicates whether this extension is required to work in an external module that will import this module.

If it doesn't matter which group of extensions your extension will work in front of, you can simplify registration:

```ts
import { featureModule } from '@ditsmod/core';
import { MyExtension, MY_EXTENSIONS } from './my.extension.js';

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

Any extension can specify a dependency on the `ROUTES_EXTENSIONS` group to dynamically add providers at any level. Extensions from this group use metadata with `MetadataPerMod1` interface and return metadata with `MetadataPerMod2` interface.

You can see how it is done in [BodyParserExtension][3]:

```ts {12,28}
@injectable()
export class BodyParserExtension implements Extension<void> {
  private inited: boolean;

  constructor(protected extensionManager: ExtensionsManager, protected perAppService: PerAppService) {}

  async init() {
    if (this.inited) {
      return;
    }

    const aMetadataPerMod2 = await this.extensionManager.init(ROUTES_EXTENSIONS);
    aMetadataPerMod2.forEach((metadataPerMod2) => {
      const { aControllersMetadata2, providersPerMod } = metadataPerMod2;
      aControllersMetadata2.forEach(({ providersPerRou, providersPerReq, httpMethod }) => {
        // Merging the providers from a module and a controller
        const mergedProvidersPerRou = [...metadataPerMod2.providersPerRou, ...providersPerRou];
        const mergedProvidersPerReq = [...metadataPerMod2.providersPerReq, ...providersPerReq];

        // Creating a hierarchy of injectors.
        const injectorPerApp = this.perAppService.injector;
        const injectorPerMod = injectorPerApp.resolveAndCreateChild(providersPerMod);
        const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedProvidersPerRou);
        const injectorPerReq = injectorPerRou.resolveAndCreateChild(mergedProvidersPerReq);
        let bodyParserConfig = injectorPerReq.get(BodyParserConfig, undefined, {}) as BodyParserConfig;
        bodyParserConfig = Object.assign({}, new BodyParserConfig(), bodyParserConfig); // Merge with default.
        if (bodyParserConfig.acceptMethods?.includes(httpMethod)) {
          providersPerReq.push({ token: HTTP_INTERCEPTORS, useClass: BodyParserInterceptor, multi: true });
        }
      });
    });

    this.inited = true;
  }
}
```

In this case, the HTTP interceptor is added to the `providersPerReq` array in the controller's metadata. But before that, a [hierarchy of injectors][8] is created in order to get a certain configuration that tells us whether we need to add such an interceptor. If we didn't need to check any condition, we could avoid creating injector hierarchies and just add an interceptor at request level.

Of course, such dynamic addition of providers is possible only before creating HTTP request handlers.

[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/09-one-extension
[3]: https://github.com/ditsmod/ditsmod/blob/body-parser-2.13.1/packages/body-parser/src/body-parser.extension.ts#L54
[4]: #registering-an-extension-in-a-group
[5]: /native-modules/body-parser
[6]: /native-modules/openapi
[7]: /components-of-ditsmod-app/dependency-injection#multi-providers
[8]: /components-of-ditsmod-app/dependency-injection#hierarchy-of-injectors
[9]: /components-of-ditsmod-app/dependency-injection#providers
[10]: /components-of-ditsmod-app/http-interceptors/
