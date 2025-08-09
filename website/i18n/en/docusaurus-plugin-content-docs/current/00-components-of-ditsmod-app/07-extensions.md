---
sidebar_position: 7
---

# Extensions

## The purpose of Ditsmod extension

Typically, an extension does its work before the HTTP request handlers are created. To modify or extend the application's functionality, an extension uses static metadata that is attached to specific decorators. On the other hand, an extension can also dynamically add metadata of the same type as the static metadata. Extensions can initialize asynchronously, and can depend on each other.

The task of most extensions is to act like a pipeline, taking a multidimensional array of configuration data (metadata) as input and producing another (or augmented) multidimensional array as output. This final array is ultimately interpreted by the target extension, e.g. to create routes and their handlers. However, extensions do not necessarily need to work with configuration or setting up HTTP request handlers; they can also write logs, collect metrics for monitoring, or perform other tasks.

In most cases, multidimensional arrays of configuration data reflect the structure of the application:

1. they are divided into modules;
2. each module contains controllers or providers;
3. each controller has one or more routes.

For example, in the [@ditsmod/body-parser][5] module, there is an extension that dynamically adds an HTTP interceptor to parse the request body for each route that has the appropriate method (POST, PATCH, PUT). It does this once before the HTTP request handlers are created, so there is no need to check the need for parsing on every request.

Another example. The [@ditsmod/openapi][6] module allows you to create OpenAPI documentation using the new `@oasRoute` decorator. Without the extension working, Ditsmod will ignore the metadata from this new decorator. The extension from this module receives the aforementioned configuration array, finds the metadata from the `@oasRoute` decorator, and interprets this metadata by adding other metadata that will be used by another extension to set up routes.

## What is "Ditsmod extension"

In Ditsmod, **extension** is a class that implements the `Extension` interface:

```ts
interface Extension<T> {
  stage1(isLastModule: boolean): Promise<T>;
}
```

Each extension needs to be registered, this will be mentioned later, and now let's assume that such registration has taken place, and then the following process goes on:

1. metadata is collected from all decorators (`@rootModule`, `@featureModule`, `@controller`, `@route`...);
2. this metadata is then passed to DI with token `MetadataPerMod2`, so - every extension can get this metadata in the constructor;
3. the extensions start working per module:
    - in each module, the extensions created within this module or imported into this module are collected;
    - each of these extensions gets metadata, also collected in this module, and the `stage1()` methods of given extensions are called.
4. HTTP request handlers are created;
5. the application starts working in the usual mode, processing HTTP requests.

You can see a simple example in the folder [09-one-extension][1].

## Group of extensions

Any extension must be a member of one or more groups. The concept of a **group of extensions** is similar to the concept of a group of [interceptors][10]. Note that group of interceptors performs a specific type of work: augmenting the processing of an HTTP request for a particular route. Similarly, each group of extensions represents a distinct type of work on specific metadata. As a rule, extensions in a particular group return metadata that has the same basic interface. Essentially, a group of extensions allows abstraction from specific extensions; instead, it makes only the type of work performed within this group important.

For example, in `@ditsmod/rest` there is a group `ROUTES_EXTENSIONS` which by default includes a single extension that processes metadata collected from the `@route()` decorator. If an application requires OpenAPI documentation, you can import the `@ditsmod/openapi` module, which also has an extension registered in the `ROUTES_EXTENSIONS` group, but this extension works with the `@oasRoute()` decorator. In this case, two extensions will already be registered in the `ROUTES_EXTENSIONS` group, each of which will prepare data for establishing the router's routes. These extensions are grouped together because they configure routes and their `stage1()` methods return data with the same basic interface.

Having a common base data interface returned by each extension in a given group is an important requirement because other extensions may expect data from that group and will rely on that base interface. Of course, the base interface can be expanded if necessary, but not narrowed.

In addition to a common basic interface, the sequence in which group of extensions is launched and the dependency between them is also important. In our example, after all the extensions from the `ROUTES_EXTENSIONS` group have worked, their data is collected in one array and passed to the `PRE_ROUTER_EXTENSIONS` group. Even if you later register more new extensions in the `ROUTES_EXTENSIONS` group, the `PRE_ROUTER_EXTENSIONS` group will still be started after absolutely all extensions from the `ROUTES_EXTENSIONS` group, including your new extensions, have been worked out.

This feature is very handy because it sometimes allows you to integrate external Ditsmod modules (for example, from npmjs.com) into your application without any customization, just by importing them into the desired module. Thanks to group of extensions, the imported extensions will be executed in the correct order, even if they are imported from different external modules.

This is how the extension from `@ditsmod/body-parser` works, for example. You simply import `BodyParserModule`, and its extensions will already be run in the correct order, which is written in this module. In this case, its extension will run after the `ROUTES_EXTENSIONS` group, but before the `PRE_ROUTER_EXTENSIONS` group. And note that `BodyParserModule` has no idea which extensions will work in these groups, it only cares about

1. the data interface that the extensions in the `ROUTES_EXTENSIONS` group will return;
2. the startup order, so that the routes are not set before this module works (i.e. the `PRE_ROUTER_EXTENSIONS` group works after it, not before).

This means that the `BodyParserModule` will take into account the routes set with the `@route()` or `@oasRoute()` decorators, or any other decorators from this group, since they are processed by the extensions that run before it in the `ROUTES_EXTENSIONS` group.

## Extension registration

[Register the extension][4] in an existing extension group, or create a new group, even if it has a single extension. You will need to create a new DI token for the new group.

### Creating a new group token

The extension group token must be an instance of the `InjectionToken` class.

For example, to create a token for `MY_EXTENSIONS` group, you need to do the following:

```ts
import { InjectionToken, Extension } from '@ditsmod/core';

export const MY_EXTENSIONS = new InjectionToken<Extension<void>[]>('MY_EXTENSIONS');
```

As you can see, each extension group must specify that DI will return an array of extension instances: `Extension<void>[]`. This must be done, the only difference may be in the generic `Extension<T>[]`.

### Registering an extension in a group

Objects of the following type can be transferred to the `extensions` array, which is in the module's metadata:

```ts
class ExtensionConfig {
  extension: ExtensionClass;
  /**
   * The token of the group after which this extension will be called.
   */
  afterExtensions?: ExtensionClass[]>;
  /**
   * The token of the group before which this extension will be called.
   */
  beforeExtensions?: ExtensionClass[]>;
  /**
   * Indicates whether this extension needs to be exported.
   */
  export?: boolean;
  /**
   * Indicates whether this extension needs to be exported without working in host module.
   */
  exportOnly?: boolean;
}
```

The `beforeExtensions` property is used when you want your extension group to run before another extension group:

```ts
import { featureModule, ROUTES_EXTENSIONS } from '@ditsmod/core';
import { MyExtension, MY_EXTENSIONS } from './my.extension.js';

@featureModule({
  extensions: [
    { extension: MyExtension, group: MY_EXTENSIONS, beforeExtensions: [ROUTES_EXTENSIONS], export: true }
  ],
})
export class SomeModule {}
```

That is, the token of the group `MY_EXTENSIONS`, to which your extension belongs, is transferred to the `token` property. The token of the `ROUTES_EXTENSIONS` group, before which the `MY_EXTENSIONS` group should be started, is passed to the `beforeExtensions` property. Optionally, you can use the `exported` or `exportOnly` property to specify whether this extension should function in an external module that imports this module. Additionally, the `exportOnly` property indicates that this extension should not be executed in the so-called host module (i.e., the module where this extension is declared).

## Using ExtensionsManager

If a certain extension has a dependency on another extension, it is recommended to specify that dependency indirectly through the extension group. To do this, you need `ExtensionsManager`, which initializes groups of extensions, throws errors about cyclic dependencies between extensions, and shows the entire chain of extensions that caused the loop. Additionally, `ExtensionsManager` allows you to collect extensions initialization results from the entire application, not just from a single module.

Suppose `MyExtension` has to wait for the initialization of the `OTHER_EXTENSIONS` group to complete. To do this, you must specify the dependence on `ExtensionsManager` in the constructor, and in `stage1()` call `stage1()` of this service:

```ts {11}
import { injectable } from '@ditsmod/core';
import { Extension, ExtensionsManager } from '@ditsmod/core';

import { OTHER_EXTENSIONS } from './other.extensions.js';

@injectable()
export class MyExtension implements Extension<void> {
  constructor(private extensionsManager: ExtensionsManager) {}

  async stage1() {
    const stage1ExtensionMeta = await this.extensionsManager.stage1(OTHER_EXTENSIONS);

    stage1ExtensionMeta.groupData.forEach((stage1Meta) => {
      const someData = stage1Meta;
      // Do something here.
      // ...
    });
  }
}
```

The `ExtensionsManager` will sequentially initialize all extensions from a given group and return the result in an object that follows this interface:

```ts
interface Stage1ExtensionMeta<T = any> {
  delay: boolean;
  countdown = 0;
  groupDataPerApp: Stage1ExtensionMetaPerApp<T>[];
  groupData: T[],
  moduleName: string;
}
```

If the `delay` property is `true`, it means that the `groupDataPerApp` property does not yet contain data from all modules where this extension group (`OTHER_EXTENSIONS`) is imported. The `countdown` property indicates how many modules are left for this extension group to process before `groupDataPerApp` will contain data from all modules. Thus, the `delay` and `countdown` properties only apply to `groupDataPerApp`.

The `groupData` property holds an array of data collected from the current module by different extensions of this group.

It's important to note that a separate instance of each extension is created for each module. For example, if `MyExtension` is imported into three different modules, Ditsmod will process these three modules sequentially with three different instances of `MyExtension`. Additionally, if `MyExtension` requires data from, say, the `OTHER_EXTENSIONS` group, which spans four modules, but `MyExtension` is only imported into three modules, it may not receive all the necessary data from one of the modules.

In this case, you need to pass `true` as the third argument to the `extensionsManager.stage1` method:

```ts {11}
import { injectable } from '@ditsmod/core';
import { Extension, ExtensionsManager } from '@ditsmod/core';

import { OTHER_EXTENSIONS } from './other.extensions.js';

@injectable()
export class MyExtension implements Extension<void> {
  constructor(private extensionsManager: ExtensionsManager) {}

  async stage1() {
    const stage1ExtensionMeta = await this.extensionsManager.stage1(OTHER_EXTENSIONS, this, true);
    if (stage1ExtensionMeta.delay) {
      return;
    }

    stage1ExtensionMeta.groupDataPerApp.forEach((totaStage1Meta) => {
      totaStage1Meta.groupData.forEach((metadataPerMod3) => {
        // Do something here.
        // ...
      });
    });
  }
}
```

Thus, when you need `MyExtension` to receive data from the `OTHER_EXTENSIONS` group throughout the application, you need to pass `true` as the third argument to the `stage1` method:

```ts
const stage1ExtensionMeta = await this.extensionsManager.stage1(OTHER_EXTENSIONS, this, true);
```

In this case, it is guaranteed that the `MyExtension` instance will receive data from all modules where `OTHER_EXTENSIONS` is imported. Even if `MyExtension` is imported into a module without any extensions from the `OTHER_EXTENSIONS` group, but these extensions exist in other modules, the `stage1` method of this extension will still be called after all extensions are initialized, ensuring that `MyExtension` receives data from `OTHER_EXTENSIONS` across all modules.

## Dynamic addition of providers

Any extension can specify a dependency on the `ROUTES_EXTENSIONS` group to dynamically add providers at any level. Extensions from this group use metadata with `MetadataPerMod2` interface and return metadata with `MetadataPerMod3` interface.

You can see how it is done in [BodyParserExtension][3]:

```ts {9,25,32}
@injectable()
export class BodyParserExtension implements Extension<void> {
  constructor(
    protected extensionManager: ExtensionsManager,
    protected perAppService: PerAppService,
  ) {}

  async stage1() {
    const stage1ExtensionMeta = await this.extensionManager.stage1(ROUTES_EXTENSIONS);
    stage1ExtensionMeta.groupData.forEach((metadataPerMod3) => {
      const { aControllerMetadata, providersPerMod } = metadataPerMod3;
      aControllerMetadata.forEach(({ providersPerRou, providersPerReq, httpMethod, singleton }) => {
        // Merging the providers from a module and a controller
        const mergedProvidersPerRou = [...metadataPerMod3.providersPerRou, ...providersPerRou];
        const mergedProvidersPerReq = [...metadataPerMod3.providersPerReq, ...providersPerReq];

        // Creating a hierarchy of injectors.
        const injectorPerApp = this.perAppService.injector;
        const injectorPerMod = injectorPerApp.resolveAndCreateChild(providersPerMod);
        const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedProvidersPerRou);
        if (singleton) {
          let bodyParserConfig = injectorPerRou.get(BodyParserConfig, undefined, {}) as BodyParserConfig;
          bodyParserConfig = { ...new BodyParserConfig(), ...bodyParserConfig }; // Merge with default.
          if (bodyParserConfig.acceptMethods!.includes(httpMethod)) {
            providersPerRou.push({ token: HTTP_INTERCEPTORS, useClass: CtxBodyParserInterceptor, multi: true });
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
[8]: /components-of-ditsmod-app/dependency-injection#hierarchy-and-encapsulation-of-injectors
[9]: /components-of-ditsmod-app/dependency-injection#providers
[10]: /components-of-ditsmod-app/http-interceptors/
