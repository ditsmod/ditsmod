---
sidebar_position: 7
---

# Extensions

## The purpose of Ditsmod extension

Typically, an extension does its work before the HTTP request handlers are created. To modify or extend the application's functionality, an extension uses static metadata that is attached to specific decorators. On the other hand, an extension can also dynamically add metadata of the same type as the static metadata. Extensions can initialize asynchronously, and can depend on each other.

The task of most extensions is to act like a pipeline, taking a multidimensional array of configuration data (metadata) as input and producing another (or augmented) multidimensional array as output. This final array is ultimately interpreted by the target extension, e.g. to create routes and their handlers. However, extensions do not necessarily need to work with configuration or setting up HTTP request handlers; they can also write logs, collect metrics for monitoring, or perform other tasks.

In most cases, these multidimensional arrays reflect the structure of the application:

1. they are divided into modules;
2. each module contains controllers or providers;
3. each controller has one or more routes.

For example, in the [@ditsmod/body-parser][5] module, there is an extension that dynamically adds an HTTP interceptor to parse the request body for each route that has the appropriate method (POST, PATCH, PUT). It does this once before the HTTP request handlers are created, so there is no need to check the need for parsing on every request.

Another example. The [@ditsmod/openapi][6] module allows you to create OpenAPI documentation using the new `@oasRoute` decorator. Without the extension working, Ditsmod will ignore the metadata from this new decorator. The extension from this module receives the aforementioned configuration array, finds the metadata from the `@oasRoute` decorator, and interprets this metadata by adding other metadata that will be used by another extension to set up routes.

## What is "Ditsmod extension"

In Ditsmod, **extension** is a class that implements the `Extension` interface:

```ts
interface Extension<T> {
  init(isLastModule: boolean): Promise<T>;
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
class ExtensionOptions {
  extension: ExtensionType;
  /**
   * Extension group token.
   */
  token: InjectionToken<Extension<any>[]>;
  /**
   * The token of the group before which this extension will be called.
   */
  nextToken?: InjectionToken<Extension<any>[]>;
  /**
   * Indicates whether this extension needs to be exported.
   */
  exported?: boolean;
  /**
   * Indicates whether this extension needs to be exported without working in host module.
   */
  exportedOnly?: boolean;
}
```

The `nextToken` property is used when you want your extension group to run before another extension group:

```ts
import { featureModule, ROUTES_EXTENSIONS } from '@ditsmod/core';
import { MyExtension, MY_EXTENSIONS } from './my.extension.js';

@featureModule({
  extensions: [
    { extension: MyExtension, token: MY_EXTENSIONS, nextToken: ROUTES_EXTENSIONS, exported: true }
  ],
})
export class SomeModule {}
```

That is, the token of the group `MY_EXTENSIONS`, to which your extension belongs, is transferred to the `token` property. The token of the `ROUTES_EXTENSIONS` group, before which the `MY_EXTENSIONS` group should be started, is passed to the `nextToken` property. Optionally, you can use the `exported` or `exportedOnly` property to specify whether this extension should function in an external module that imports this module. Additionally, the `exportedOnly` property indicates that this extension should not be executed in the so-called host module (i.e., the module where this extension is declared).

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

    const totalInitMeta = await this.extensionsManager.init(OTHER_EXTENSIONS);

    totalInitMeta.groupInitMeta.forEach((initMeta) => {
      const someData = initMeta.payload;
      // Do something here.
      // ...
    });

    this.inited = true;
  }
}
```

The `ExtensionsManager` will sequentially initialize all extensions from a given group and return the result in an object that follows this interface:

```ts
interface TotalInitMeta<T = any> {
  delay: boolean;
  countdown = 0;
  totalInitMetaPerApp: TotalInitMetaPerApp<T>[];
  groupInitMeta: ExtensionInitMeta<T>[],
  moduleName: string;
}
```

If the `delay` property is `true`, it means that the `totalInitMetaPerApp` property does not yet contain data from all modules where this extension group (`OTHER_EXTENSIONS`) is imported. The `countdown` property indicates how many modules are left for this extension group to process before `totalInitMetaPerApp` will contain data from all modules. Thus, the `delay` and `countdown` properties only apply to `totalInitMetaPerApp`.

The `groupInitMeta` property holds an array of data collected from the current module by different extensions of this group. Each element of the `groupInitMeta` array follows this interface:

```ts
interface ExtensionInitMeta<T = any> {
  /**
   * Instance of an extension.
   */
  extension: Extension<T>;
  /**
   * Value that `extension` returns from its `init` method.
   */
  payload: T;
  delay: boolean;
  countdown: number;
}
```

The `extension` property contains the instance of the extension, and the `payload` property holds the data returned by the extension's `init()` method.

If `delay == true` and `countdown > 0`, it indicates that this extension has not yet finished its work in other modules where it was imported. In this case, the `delay` and `countdown` properties refer specifically to the extension, not the group of extensions (in this case, the `OTHER_EXTENSIONS` group).

It's important to note that a separate instance of each extension is created for each module. For example, if `MyExtension` is imported into three different modules, Ditsmod will process these three modules sequentially with three different instances of `MyExtension`. Additionally, if `MyExtension` requires data from, say, the `OTHER_EXTENSIONS` group, which spans four modules, but `MyExtension` is only imported into three modules, it may not receive all the necessary data from one of the modules.

In this case, you need to pass `true` as the second argument to the `extensionsManager.init` method:

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

    const totalInitMeta = await this.extensionsManager.init(OTHER_EXTENSIONS, true);
    if (totalInitMeta.delay) {
      return;
    }

    totalInitMeta.totalInitMetaPerApp.forEach((totaInitMeta) => {
      totaInitMeta.groupInitMeta.forEach((initMeta) => {
        const someData = initMeta.payload;
        // Do something here.
        // ...
      });
    });

    this.inited = true;
  }
}
```

Thus, when you need `MyExtension` to receive data from the `OTHER_EXTENSIONS` group throughout the application, you need to pass `true` as the second argument to the `init` method:

```ts
const totalInitMeta = await this.extensionsManager.init(OTHER_EXTENSIONS, true);
```

In this case, it is guaranteed that the `MyExtension` instance will receive data from all modules where `OTHER_EXTENSIONS` is imported. Even if `MyExtension` is imported into a module without any extensions from the `OTHER_EXTENSIONS` group, but these extensions exist in other modules, the `init` method of this extension will still be called after all extensions are initialized, ensuring that `MyExtension` receives data from `OTHER_EXTENSIONS` across all modules.

## Dynamic addition of providers

Any extension can specify a dependency on the `ROUTES_EXTENSIONS` group to dynamically add providers at any level. Extensions from this group use metadata with `MetadataPerMod1` interface and return metadata with `MetadataPerMod2` interface.

You can see how it is done in [BodyParserExtension][3]:

```ts {15,31,38}
@injectable()
export class BodyParserExtension implements Extension<void> {
  private inited: boolean;

  constructor(
    protected extensionManager: ExtensionsManager,
    protected perAppService: PerAppService,
  ) {}

  async init() {
    if (this.inited) {
      return;
    }

    const totalInitMeta = await this.extensionManager.init(ROUTES_EXTENSIONS);
    totalInitMeta.groupInitMeta.forEach((initMeta) => {
      const { aControllersMetadata2, providersPerMod } = initMeta.payload;
      aControllersMetadata2.forEach(({ providersPerRou, providersPerReq, httpMethod, isSingleton }) => {
        // Merging the providers from a module and a controller
        const mergedProvidersPerRou = [...initMeta.payload.providersPerRou, ...providersPerRou];
        const mergedProvidersPerReq = [...initMeta.payload.providersPerReq, ...providersPerReq];

        // Creating a hierarchy of injectors.
        const injectorPerApp = this.perAppService.injector;
        const injectorPerMod = injectorPerApp.resolveAndCreateChild(providersPerMod);
        const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedProvidersPerRou);
        if (isSingleton) {
          let bodyParserConfig = injectorPerRou.get(BodyParserConfig, undefined, {}) as BodyParserConfig;
          bodyParserConfig = { ...new BodyParserConfig(), ...bodyParserConfig }; // Merge with default.
          if (bodyParserConfig.acceptMethods!.includes(httpMethod)) {
            providersPerRou.push({ token: HTTP_INTERCEPTORS, useClass: SingletonBodyParserInterceptor, multi: true });
          }
        } else {
          const injectorPerReq = injectorPerRou.resolveAndCreateChild(mergedProvidersPerReq);
          let bodyParserConfig = injectorPerReq.get(BodyParserConfig, undefined, {}) as BodyParserConfig;
          bodyParserConfig = { ...new BodyParserConfig(), ...bodyParserConfig }; // Merge with default.
          if (bodyParserConfig.acceptMethods!.includes(httpMethod)) {
            providersPerReq.push({ token: HTTP_INTERCEPTORS, useClass: BodyParserInterceptor, multi: true });
          }
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
[3]: https://github.com/ditsmod/ditsmod/blob/body-parser-2.17.0/packages/body-parser/src/body-parser.extension.ts#L54
[4]: #registering-an-extension-in-a-group
[5]: /native-modules/body-parser
[6]: /native-modules/openapi
[7]: /components-of-ditsmod-app/dependency-injection#multi-providers
[8]: /components-of-ditsmod-app/dependency-injection#hierarchy-of-injectors
[9]: /components-of-ditsmod-app/dependency-injection#providers
[10]: /components-of-ditsmod-app/http-interceptors/
