---
sidebar_position: 3
---

# Extensions

## The purpose of Ditsmod extension {#the-purpose-of-ditsmod-extension}

Typically, an extension does its work before the HTTP request handlers are created. To modify or extend the application's functionality, an extension uses static metadata that is attached to specific decorators. On the other hand, an extension can also dynamically add metadata of the same type as the static metadata. Extensions can initialize asynchronously, and can depend on each other.

The task of most extensions is to act like a pipeline, taking a multidimensional array of configuration data (metadata) as input and producing another (or augmented) multidimensional array as output. This final array is ultimately interpreted by the target extension, e.g. to create routes and their handlers. However, extensions do not necessarily need to work with configuration or setting up HTTP request handlers; they can also initialize database connections, write logs, collect metrics for monitoring, or perform other tasks.

In most cases, multidimensional arrays of configuration data reflect the structure of the application:

1. they are divided into modules;
2. each module contains controllers or providers;
3. each controller has one or more routes.

For example, in the [@ditsmod/body-parser][5] module, there is an extension that dynamically adds an HTTP interceptor to parse the request body for each route that has the appropriate method (POST, PATCH, PUT). It does this once before the HTTP request handlers are created, so there is no need to check the need for parsing on every request.

Another example. The [@ditsmod/openapi][6] module allows you to create OpenAPI documentation using the new `@oasRoute` decorator. Without the extension working, Ditsmod will ignore the metadata from this new decorator. The extension from this module receives the aforementioned configuration array, finds the metadata from the `@oasRoute` decorator, and interprets this metadata by adding other metadata that will be used by the target extension to set up routes.

## What is "Ditsmod extension" {#what-is-ditsmod-extension}

In Ditsmod, **extension** is a class that implements the `Extension` interface:

```ts
interface Extension<T> {
  /**
   * This method is called at the stage when providers are dynamically added.
   *
   * @param isLastModule Indicates whether this call is made in the last
   * module where this extension is imported or not.
   */
  stage1?(isLastModule: boolean): Promise<T>;
  /**
   * This method is called after the `stage1()` method has executed for all modules
   * in the application and this method takes a module-level injector as an argument.
   */
  stage2?(injectorPerMod: Injector): Promise<void>;
  /**
   * This method is called after the `stage2()` method has executed for all modules
   * in the application. There is no strict role for this method.
   */
  stage3?(): Promise<void>;
}
```

Each extension needs to be registered, this will be mentioned later, and now let's assume that such registration has taken place, and then the following process goes on:

1. metadata is collected from all decorators (`@rootModule`, `@featureModule`, `@controller`, `@route`...);
2. this metadata is then passed to DI with token `MetadataPerMod2`, so - every extension can get this metadata in the constructor;
3. the extensions start working per module:
    - in each module, the extensions created within this module or imported into this module are collected;
    - each of these extensions gets metadata, also collected in this module, and the `stage1`, `stage2`, `stage3` methods of given extensions are called.
4. HTTP request handlers are created;
5. the application starts working in the usual mode, processing HTTP requests.

You can see a simple example in the folder [00-standalone-application][1].

## Extension registration {#extension-registration}

Extensions are passed in the module metadata, in the `extensions` property. Depending on the architectural style you choose, decorators such as `featureModule`, `restModule`, `trpcModule`, etc. can be used for this:

```ts {5}
import { restModule } from '@ditsmod/rest';
import { SimpleExtension } from './simple-extension.js';

@restModule({
  extensions: [SimpleExtension]
})
export class AppModule {}
```

This is the simplest way to register an extension, which is suitable only for cases where it is sufficient for the extension to work in the module where it is declared and registered. For more complex configurations, you can pass an object with the following type:

```ts
class ExtensionConfig {
  extension: ExtensionClass;
  /**
   * The array of extension classes before which this extension will be called.
   */
  beforeExtensions?: ExtensionClass[];
  /**
   * The array of extension classes after which this extension will be called.
   */
  afterExtensions?: ExtensionClass[];
  /**
   * Each element in this array will form a separate group of extensions together with the current extension.
   * When one of the extensions from this array is passed to `ExtensionManager.stage1()`,
   * it will return the result of the `Extension.stage1()` method from each extension in the formed group.
   */
  groups?: ExtensionClass[];
  overrideExtension?: ExtensionClass;
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

For example:

```ts {6-11}
import { restModule, RouteExtension } from '@ditsmod/rest';
import { SimpleExtension } from './simple-extension.js';

@restModule({
  extensions: [
    {
      extension: SimpleExtension,
      beforeExtensions: [RouteExtension],
      afterExtensions: [],
      export: true,
    },
  ],
})
export class SomeModule {}
```

That is, the extension class that you declare and register in the current module is passed to the `extension` property. The corresponding extension classes are passed to the `beforeExtensions` or `afterExtensions` properties if you need the registered extension to run before or after the specified extensions. Optionally, you can use the `export` or `exportOnly` property to indicate whether this extension should work in an external module that will import this module. Additionally, the `exportOnly` property also indicates that this extension should not be executed in the so-called host module (i.e., the module where this extension is declared).

## Groups of extensions {#group-of-extensions}

Any extension can belong to one or more groups. The concept of an **extension group** is analogous to the concept of a group of [interceptors][10]. Recall that a group of interceptors performs a specific type of work: it augments the handling of an HTTP request for a particular route in a controller. Similarly, each group of extensions is a separate type of work over certain metadata. As a rule, extensions in a given group return metadata that share the same base interface. Essentially, extension groups allow you to abstract away from specific extensions, making only the type of work performed within these groups important.

For example, in `@ditsmod/rest` there is `RouteExtension`, which processes metadata collected from the `@route()` decorator. If an application needs OpenAPI documentation, you can additionally connect the `@ditsmod/openapi` module, where `OpenapiRouteExtension` is registered and works with the `@oasRoute()` decorator. In the metadata of the `@ditsmod/openapi` module, it is specified that `OpenapiRouteExtension` should be used in the same group as `RouteExtension`:

```ts
extensions: [
  { extension: OpenapiRouteExtension, groups: [RouteExtension], export: true },
  // ...
],
```

As you can see, groups are formed thanks to the `groups` property in the module metadata. These two extensions are collected into one group because both of them configure routes, and their `stage1()` methods return data with the same base interface. Now, if both of these extensions are imported into the same module, all consumers that request data from `RouteExtension` will also receive the results from `OpenapiRouteExtension`, which returns data with an extended interface.

A shared base interface of the data returned by each extension in a given group is an important condition, since other extensions may expect data from this group, and they will rely specifically on this base interface. Of course, the base interface can be extended if needed, but not narrowed.

In addition, the order of execution of individual groups of extensions and the dependencies between them are also important. In our example, after the group with `RouteExtension` and `OpenapiExtension` has completed, their data is collected into a single array and passed to `PreRouterExtension`. Even if you later register more new extensions in the group with `RouteExtension`, `PreRouterExtension` will still be executed only after absolutely all extensions in the group with `RouteExtension` have completed, including your new extensions.

This feature is very convenient, as it sometimes allows you to integrate external Ditsmod modules (for example, from npmjs.com) into your application without any configuration, simply by importing them into the required module. Imported extensions that belong to certain groups will be executed in the correct order, even if they are imported from different external modules.

Note that the `groups` property specifies extension classes that act as tokens for individual groups:

```ts
extensions: [
  { extension: Extension3, groups: [Extension1, Extension2], export: true },
  // ...
],
```

Based on this configuration, two separate groups of extensions will be created:

1. `Extension1`, `Extension3`;
2. `Extension2`, `Extension3`.

If in the current module other extensions also specify these same "header" elements in `groups`, these groups will be extended:

```ts
extensions: [
  { extension: Extension4, groups: [Extension1, Extension2], export: true },
  // ...
],
```

And it does not matter whether `Extension4` is declared in the current module or imported from another module. Now these groups will contain the following elements:

1. `Extension1`, `Extension3`, `Extension4`;
2. `Extension2`, `Extension3`, `Extension4`.

## Using ExtensionManager {#using-extensionmanager}

If a certain extension has a dependency on another extension, it is recommended to specify such a dependency using `ExtensionManager`. It initializes extensions following the appropriate sequence specified in the configs of these extensions, caches the results of `extension.stage1()` methods, caches the results of extension groups, throws errors about cyclic dependencies between extensions, and shows the entire chain of extensions that led to the cycle. In addition, `ExtensionManager` allows you to collect initialization results of extensions from the entire application, not just from a single module.

Suppose `Extension2` expects the results of the `stage1()` method from `Extension1`, so a dependency on `ExtensionManager` is specified in the constructor, and `this.extensionManager.stage1()` is called inside `extension2.stage1()`:

```ts {11}
import { injectable } from '@ditsmod/core';
import { Extension, ExtensionManager } from '@ditsmod/core';

import { Extension1 } from './extension1.js';

@injectable()
export class Extension2 implements Extension<void> {
  constructor(private extensionManager: ExtensionManager) {}

  async stage1() {
    const stage1ExtensionMeta = await this.extensionManager.stage1(Extension1);

    stage1ExtensionMeta.groupData.forEach((stage1Meta) => {
      const someData = stage1Meta;
      // Do something here.
      // ...
    });
  }
}
```

Note that `stage1ExtensionMeta.groupData` will always contain an array of results, regardless of whether `Extension1` belongs to an extension group in the current module or not. Here `stage1ExtensionMeta` has the following interface:

```ts
interface Stage1ExtensionMeta<T = any> {
  delay: boolean;
  countdown: number;
  groupDataPerApp: Stage1ExtensionMetaPerApp<T>[];
  moduleName: string,
  groupDebugMeta: Stage1DebugMeta<T>[],
  groupData: T[],
}

interface Stage1DebugMeta<T = any> {
  extension: Extension<T>,
  payload: T,
  delay: boolean,
  countdown: number,
}
```

If `stage1ExtensionMeta.delay === true` — this means that the `groupDataPerApp` property contains data not yet from all modules where this extension (`Extension1`) is imported. The `countdown` property indicates in how many modules this extension still needs to be processed so that the `groupDataPerApp` property contains data from all modules. That is, the `delay` and `countdown` properties relate only to the `groupDataPerApp` property.

The `groupData` property contains an array where data from the current module is collected from one or more extensions.

It is important to remember that a separate instance of a given extension is created for each module. For example, if `Extension2` is imported into three different modules, Ditsmod will process these three modules sequentially with three different instances of `Extension2`. In addition, if `Extension2` needs aggregated data, for example, from `Extension1` from four modules, but `Extension2` itself is imported only into three modules, this means that from one module `Extension2` may not receive the required data.

In this case, you need to pass `this` as the second argument to `extensionManager.stage1`:

```ts {11}
import { injectable } from '@ditsmod/core';
import { Extension, ExtensionManager } from '@ditsmod/core';

import { Extension1 } from './extension1.js';

@injectable()
export class Extension2 implements Extension<void> {
  constructor(private extensionManager: ExtensionManager) {}

  async stage1() {
    const stage1ExtensionMeta = await this.extensionManager.stage1(Extension1, this);
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

That is, when you need `Extension2` to receive data from `Extension1` from the entire application, you need to pass `this` as the second argument for the `extensionManager.stage1` method:

```ts
const stage1ExtensionMeta = await this.extensionManager.stage1(Extension1, this);
```

In this case, it is guaranteed that the instance of `Extension2` will receive data from all modules where `Extension1` is imported. Even if `Extension1` and `Extension2` are imported into separate modules (i.e., they are not present in a shared module), `extension2.stage1` will still ultimately receive data from `extension1.stage1` across all modules.

### Extension Group Tokens {#extension-group-tokens}

Let's return to the previous code example where two separate extension groups are declared, when we pass the classes of two extensions into the `groups` property:

```ts
extensions: [
  { extension: Extension3, groups: [Extension1, Extension2], export: true },
  // ...
],
```

And, as already mentioned, based on this configuration, two separate groups are created:

1. `Extension1`, `Extension3`;
2. `Extension2`, `Extension3`.

Now that you are familiar with `ExtensionManager`, it is important to emphasize that the lookup of extension groups is performed specifically by the extension classes that we previously specified in the `groups` property:

```ts
await this.extensionManager.stage1(Extension1); // Data from Extension1 and Extension3 is returned
await this.extensionManager.stage1(Extension2); // Data from Extension2 and Extension3 is returned
await this.extensionManager.stage1(Extension3); // Only data from Extension3 is returned
```

That is, here `Extension1` and `Extension2` effectively act as tokens (or identifiers) of the groups.

## Dynamic addition of providers {#dynamic-addition-of-providers}

Any extension can declare a dependency on a group of extensions where `RouteExtension` is the header, in order to dynamically add providers at any level. Extensions from this group use metadata with the `MetadataPerMod2` interface and return metadata with the `MetadataPerMod3` interface.

You can see how it is done in [BodyParserExtension][3]:

```ts {9,25,32}
@injectable()
export class BodyParserExtension implements Extension<void> {
  constructor(
    protected extensionManager: ExtensionManager,
    protected perAppService: PerAppService,
  ) {}

  async stage1() {
    const stage1ExtensionMeta = await this.extensionManager.stage1(RouteExtension);
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

[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/00-standalone-application
[3]: https://github.com/ditsmod/ditsmod/blob/body-parser-2.17.0/packages/body-parser/src/body-parser.extension.ts#L54
[5]: /rest-application/native-modules/body-parser
[6]: /rest-application/native-modules/openapi
[8]: /basic-components/dependency-injection#hierarchy-and-encapsulation-of-injectors
[10]: /rest-application/http-interceptors/
