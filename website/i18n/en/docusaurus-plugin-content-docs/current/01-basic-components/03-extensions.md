---
sidebar_position: 3
---

# Extensions

## The purpose of Ditsmod extension {#the-purpose-of-ditsmod-extension}

Extensions start working when Ditsmod has collected static metadata from class-level decorators and exported/imported modules and providers exactly as specified in the collected static metadata of the module. Typically, an extension does its work before the HTTP request handlers are created. To modify or extend the application's functionality, an extension uses static metadata that is attached to specific decorators. On the other hand, an extension can also dynamically add metadata of the same type as the static metadata. Extensions can initialize asynchronously, and can depend on each other.

Figuratively speaking, a module + extension resemble a "cloud provider" that supplies only the infrastructure. That is, extensions operate strictly during the application initialization stage and do not participate directly in request processing. They merely create the conditions for components like controllers, services, guards, and interceptors, which handle requests after the preparatory stage is complete.

The task of most extensions is to act like a pipeline, taking a multidimensional array of configuration data (metadata) as input and producing another (or augmented) multidimensional array as output. This final array is ultimately interpreted by the target extension, e.g. to create routes and their handlers. However, extensions do not necessarily need to work with configuration or setting up HTTP request handlers; they can also initialize database connections, collect metrics for monitoring, expose variables to the [REPL][100] session, or perform other tasks.

In most cases, multidimensional arrays of configuration data reflect the structure of the application:

1. they are divided into modules;
2. each module contains controllers or providers;
3. each controller has one or more routes.

A simple and practical example of how extensions work can be found in the [@ditsmod/body-parser][101] module, where an extension dynamically adds an HTTP interceptor for parsing the request body to each route that has the corresponding method (POST, PATCH, PUT). It does this once before the HTTP request handlers are created, so there is no need to check whether parsing is required on every request.

Another example. The [@ditsmod/rest][6] module allows setting routes using a custom `@route` decorator. Without the extension running, Ditsmod will ignore the metadata from this decorator. The extension from this module takes the configuration array mentioned above, finds metadata from the `@route` decorator there, and interprets it by adding other metadata that will be used by the target extension to set up routes.

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

Each of these methods acts as a hook that Ditsmod invokes automatically. In the documentation, you may occasionally encounter phrases like "the value returned by the extension"; in such cases, this refers to the value returned by the `stage1()` method of that extension. You can find a ready simple example in the [00-standalone-application][103] folder.

The implementation of this interface can be done, for example, as follows:

```ts
import { injectable, Extension, Logger } from '@ditsmod/core';

@injectable()
export class SimpleExtension implements Extension<void> {
  constructor(private logger: Logger) {}

  async stage1() {
    // ...
    this.logger.log('info', 'some message');
  }
}
```

As you can see, extensions can declare dependencies on services whose providers may be defined at the module or application level. Note that the injector accessible via the extension constructor is initialized before any extensions execute; therefore, providers from other extensions are not passed to it.

During `stage1()`, any extension can [dynamically add providers][7] to any [hierarchy level][8]. Only after `stage1()` has finished running in all extensions across all modules, the final injectors are created - one at the application level and one per module. The module-level injector is passed as an argument to `stage2(injectorPerMod)`. At this stage, providers can still be added dynamically, but only at levels lower than the module. This must be done by the target extensions for which those providers are intended, and they are also responsible for creating the corresponding final injectors.

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
import { restModule, RestRouteExtension } from '@ditsmod/rest';
import { SimpleExtension } from './simple-extension.js';

@restModule({
  extensions: [
    {
      extension: SimpleExtension,
      beforeExtensions: [RestRouteExtension],
      afterExtensions: [],
      export: true,
    },
  ],
})
export class SomeModule {}
```

That is, the extension class that you declare and register in the current module is passed to the `extension` property. The corresponding extension classes are passed to the `beforeExtensions` or `afterExtensions` properties if you need the registered extension to run before or after the specified extensions. Optionally, you can use the `export` or `exportOnly` property to indicate whether this extension should work in an external module that will import this module. Additionally, the `exportOnly` property also indicates that this extension should not be executed in the so-called host module (i.e., the module where this extension is declared).

You can also override an external extension that is imported into the current module:

```ts
extensions: [
  { extension: MyExtension, overrideExtension: ExternalExtension }
],
```

In this case, `ExternalExtension` is imported into the current module, where you override it with `MyExtension`.

## Extension groups {#group-of-extensions}

Any extension can belong to one or more groups. The concept of an **extension group** is analogous to the concept of a group of [interceptors][10]. Recall that a group of interceptors performs a specific type of work: it augments the handling of an HTTP request for a particular route in a controller. Similarly, each group of extensions is a separate type of work over certain metadata. As a rule, extensions in a given group return metadata that share the same base interface. Essentially, extension groups allow you to abstract away from specific extensions, making only the type of work performed within these groups important.

For example, in `@ditsmod/rest` there is `RestRouteExtension`, which processes metadata collected from the `@route()` decorator. If an application needs OpenAPI documentation, you can additionally connect the `@ditsmod/openapi` module, where `OpenapiRouteExtension` is registered and works with the `@oasRoute()` decorator. In the metadata of the `@ditsmod/openapi` module, it is specified that `OpenapiRouteExtension` should be used in the same group as `RestRouteExtension`:

```ts
extensions: [
  { extension: OpenapiRouteExtension, groups: [RestRouteExtension], export: true },
  // ...
],
```

As you can see, groups are formed thanks to the `groups` property in the module metadata. These two extensions are collected into one group because both of them configure routes, and their `stage1()` methods return data with the same base interface. Now, if both of these extensions are imported into the same module, all consumers that request data from `RestRouteExtension` will also receive the results from `OpenapiRouteExtension`, which returns data with an extended interface.

A shared base interface of the data returned by each extension in a given group is an important condition, since other extensions may expect data from this group, and they will rely specifically on this base interface. Of course, the base interface can be extended if needed, but not narrowed.

In addition, the execution order of individual extension groups and the dependencies between them are also important. In our example, after the group containing `RestRouteExtension` and `OpenapiRouteExtension` has finished executing, their data is collected into a single array and passed to `DispatcherExtension`. Even if you later register more new extensions in this group, `DispatcherExtension` will still execute only after absolutely all extensions in this group have finished executing, including your newly added extensions. This behavior is dictated by the instructions recorded during the declaration of `RestRouteExtension`:

```ts
extensions: [
  { extension: RestRouteExtension, beforeExtensions: [DispatcherExtension], exportOnly: true },
  // ...
],
```

As you can see, nothing is said here about `OpenapiRouteExtension`, and even when `OpenapiRouteExtension` was declared, it also did not specify that `OpenapiRouteExtension` must run before `DispatcherExtension`. It is enough that `groups: [RestRouteExtension]` was specified during the declaration of `OpenapiRouteExtension`, and this automatically places `OpenapiRouteExtension` in the queue after `RestRouteExtension`, but before `DispatcherExtension`.

This feature is very convenient, as it sometimes allows you to integrate external Ditsmod modules (for example, from npmjs.com) into your application without any configuration, simply by importing them into the required module. Imported extensions that belong to certain groups will be executed in the correct order, even if they are imported from different external modules.

Note that the `groups` property specifies extension classes that act as tokens for individual groups:

```ts
extensions: [
  { extension: Extension3, groups: [Extension1, Extension2], export: true },
  // ...
],
```

Based on this configuration, two separate groups of extensions will be created:

- First group: `Extension1`, `Extension3`.
- Second group: `Extension2`, `Extension3`.

If in the current module other extensions also specify these same group tokens in `groups`, these groups will be extended:

```ts
extensions: [
  { extension: Extension4, groups: [Extension1, Extension2], export: true },
  // ...
],
```

Now these groups will contain the following elements:

- First group: `Extension1`, `Extension3`, `Extension4`.
- Second group: `Extension2`, `Extension3`, `Extension4`.

And it does not matter whether `Extension4` is declared in the current module or imported from another module.

## Using ExtensionManager {#using-extensionmanager}

If a certain extension has a dependency on another extension, it is recommended to specify such a dependency using `ExtensionManager`. It initializes extensions following the appropriate sequence specified in the configs of these extensions, caches the results of `extension.stage1()` methods, caches the results of extension groups, throws errors about cyclic dependencies between extensions, and shows the entire chain of extensions that led to the cycle. In addition, `ExtensionManager` allows you to collect initialization results of extensions from the entire application, not just from a single module.

Suppose `Extension2` expects the results of the `stage1()` method from `Extension1`, so a dependency on `ExtensionManager` is specified in the constructor, and `this.extensionManager.stage1()` is called inside `extension2.stage1()`:

```ts {9}
import { injectable, Extension, ExtensionManager } from '@ditsmod/core';
import { Extension1 } from './extension1.js';

@injectable()
export class Extension2 implements Extension<void> {
  constructor(private extensionManager: ExtensionManager) {}

  async stage1() {
    const extensionGroupMeta = await this.extensionManager.stage1(Extension1);

    extensionGroupMeta.groupData.forEach((stage1Meta) => {
      const someData = stage1Meta;
      // Do something here.
      // ...
    });
  }
}
```

Note that `extensionGroupMeta.groupData` will always contain an array of results, regardless of whether `Extension1` belongs to an extension group in the current module or not. Here `extensionGroupMeta` has the following interface:

```ts
interface ExtensionGroupMeta<T = any> {
  delay: boolean;
  countdown: number;
  groupDataPerApp: AppExtensionGroupMeta<T>[];
  moduleName: string,
  groupDebugMeta: ExtensionDebugMeta<T>[],
  groupData: T[],
}

interface ExtensionDebugMeta<T = any> {
  extension: Extension<T>,
  payload: T,
  delay: boolean,
  countdown: number,
}
```

If `extensionGroupMeta.delay === true` — this means that the `groupDataPerApp` property contains data not yet from all modules where this extension (`Extension1`) is imported. The `countdown` property indicates in how many modules this extension still needs to be processed so that the `groupDataPerApp` property contains data from all modules. That is, the `delay` and `countdown` properties relate only to the `groupDataPerApp` property.

The `groupData` property contains an array that aggregates data from the current module provided by one or more extensions. The `groupDebugMeta` property contains more detailed information about the extensions that produced the data in `groupData`. Elements in the `groupData` array correspond to elements in the `groupDebugMeta` array by index, i.e.:

```ts
groupData[0] === groupDebugMeta[0]?.payload; // true
```

It is important to remember that a separate instance of a given extension is created for each module. For example, if `Extension2` is imported into three different modules, Ditsmod will process these three modules sequentially with three different instances of `Extension2`. In addition, if `Extension2` needs aggregated data, for example, from `Extension1` from four modules, but `Extension2` itself is imported only into three modules, this means that from one module `Extension2` may not receive the required data.

In this case, you need to pass `this` as the second argument to `extensionManager.stage1`:

```ts {9}
import { injectable, Extension, ExtensionManager } from '@ditsmod/core';
import { Extension1 } from './extension1.js';

@injectable()
export class Extension2 implements Extension<void> {
  constructor(private extensionManager: ExtensionManager) {}

  async stage1() {
    const extensionGroupMeta = await this.extensionManager.stage1(Extension1, this);
    if (extensionGroupMeta.delay) {
      return;
    }

    extensionGroupMeta.groupDataPerApp.forEach((totalStage1Meta) => {
      totalStage1Meta.groupData.forEach((routeExtensionMeta) => {
        // Do something here.
        // ...
      });
    });
  }
}
```

That is, when you need `Extension2` to receive data from `Extension1` from the entire application, you need to pass `this` as the second argument for the `extensionManager.stage1` method:

```ts
const extensionGroupMeta = await this.extensionManager.stage1(Extension1, this);
```

In this case, it is guaranteed that the instance of `Extension2` will receive data from all modules where `Extension1` is imported. Even if `Extension1` and `Extension2` are imported into separate modules (i.e., they are not present in a shared module), `extension2.stage1` will still ultimately receive data from `extension1.stage1` across all modules.

### Extension Group Tokens {#extension-group-tokens}

Let's return to the [previous code example][2] where two separate extension groups are declared, when we pass the classes of two extensions into the `groups` property:

```ts
extensions: [
  { extension: Extension3, groups: [Extension1, Extension2], export: true },
  // ...
],
```

And, as already mentioned, based on this configuration, two separate groups are created:

- First group: `Extension1`, `Extension3`.
- Second group: `Extension2`, `Extension3`.

Now that you are familiar with `ExtensionManager`, it is important to emphasize that the lookup of extension groups is performed by tokens — by the extension classes that we previously specified in the `groups` property:

```ts
await this.extensionManager.stage1(Extension1); // Data from Extension1 and Extension3 is returned
await this.extensionManager.stage1(Extension2); // Data from Extension2 and Extension3 is returned
await this.extensionManager.stage1(Extension3); // Only data from Extension3 is returned
```

That is, here `Extension1` and `Extension2` effectively act as tokens (or identifiers) of the groups.

## Dynamic addition of providers {#dynamic-addition-of-providers}

If you are using `@ditsmod/rest`, any extension can declare a dependency on the `RestRouteExtension` to dynamically add providers at any level. This extension uses metadata with the `ResolvedModuleMetadata` interface and returns metadata with the `RouteExtensionMeta` interface.

You can see how it is done in [BodyParserExtension][102]:

```ts {14,32,39}
import { Extension, ExtensionManager, Injector, injectable, inject, PROVIDERS_PER_APP } from '@ditsmod/core';
import { HTTP_INTERCEPTORS, RestRouteExtension } from '@ditsmod/rest';
// ...

@injectable()
export class BodyParserExtension implements Extension<void> {
  constructor(
    protected extensionManager: ExtensionManager,
   @inject(PROVIDERS_PER_APP) protected providersPerApp: Provider[],
  ) {}

  async stage1() {
    const extensionGroupMeta = await this.extensionManager.stage1(RestRouteExtension);
    extensionGroupMeta.groupData.forEach((routeExtensionMeta) => {
      const { aControllerMetadata } = routeExtensionMeta;
      const { providersPerMod } = routeExtensionMeta.normalizedModuleMeta;
      aControllerMetadata.forEach(({ providersPerRou, providersPerReq, httpMethods, scope }) => {
        // Merging the providers from a module and a controller
        const mergedProvidersPerRou = [...routeExtensionMeta.meta.providersPerRou, ...providersPerRou];
        const mergedProvidersPerReq = [...routeExtensionMeta.meta.providersPerReq, ...providersPerReq];

        // Creating a hierarchy of injectors.
        const injectorPerApp = Injector.resolveAndCreate(this.providersPerApp, 'App');
        const injectorPerMod = injectorPerApp.resolveAndCreateChild(providersPerMod);
        const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedProvidersPerRou);
        httpMethods.forEach((method) => {
          if (scope == 'route') {
            let bodyParserConfig = injectorPerRou.get(BodyParserConfig, {}) as BodyParserConfig;
            bodyParserConfig = { ...new BodyParserConfig(), ...bodyParserConfig }; // Merge with default.
            if (bodyParserConfig.acceptMethods!.includes(method)) {
              providersPerRou.push({ token: HTTP_INTERCEPTORS, useClass: RouteScopedBodyParserInterceptor, multi: true });
            }
          } else {
            const injectorPerReq = injectorPerRou.resolveAndCreateChild(mergedProvidersPerReq);
            let bodyParserConfig = injectorPerReq.get(BodyParserConfig, {}) as BodyParserConfig;
            bodyParserConfig = { ...new BodyParserConfig(), ...bodyParserConfig }; // Merge with default.
            if (bodyParserConfig.acceptMethods!.includes(method)) {
              providersPerReq.push({ token: HTTP_INTERCEPTORS, useClass: BodyParserInterceptor, multi: true });
            }
          }
        });
      });
    });
  }
}
```

In this case, an HTTP interceptor is added to the controller's metadata within the `providersPerReq` or `providersPerRou` array (depending on the controller's operating mode). Note that the [injector hierarchy][8] created here is used solely to resolve the value for the `BodyParserConfig` token, which determines whether the interceptor needs to be added. Afterward, these injectors are not passed anywhere else, meaning they are cleared from memory.

The actual injectors containing providers collected from all extensions will be created later—in `DispatcherExtension`. This is precisely why the `BodyParserModule` metadata specifies that `BodyParserExtension` must run after `RestRouteExtension` but before `DispatcherExtension`:

```ts {7-8}
import { RestRouteExtension, DispatcherExtension } from '@ditsmod/rest';

// ... Here BodyParserModule is declared
extensions: [
  {
    extension: BodyParserExtension,
    afterExtensions: [RestRouteExtension],
    beforeExtensions: [DispatcherExtension],
    exportOnly: true,
  },
],
// ...
```

### Transferring prepared resources and state (ValueProvider) {#transferring-prepared-resources-and-state}

If an extension asynchronously initializes an external resource (such as a database connection, Redis client, or configured SDK), this resource can be passed into the application's long-lived injector using a `ValueProvider`.

Since the extension's own injector is temporary, the prepared resource instance is pushed into the appropriate provider hierarchy array (`providersPerApp`, `providersPerMod`, `providersPerRou`, or `providersPerReq`) via the `useValue` property during `stage1()` execution:

```ts
import { injectable, inject, Extension, PROVIDERS_PER_APP, Provider } from '@ditsmod/core';
import { createDbConnection, DbClient } from './db-connection.js';

@injectable()
export class DbExtension implements Extension<void> {
  constructor(
    @inject(PROVIDERS_PER_APP) protected providersPerApp: Provider[],
  ) {}

  async stage1() {
    const dbClient = await createDbConnection();
    this.providersPerApp.push({ token: DbClient, useValue: dbClient });
  }
}
```

After this, any service or controller in the application can inject `DbClient` via standard Dependency Injection.

[2]: #group-of-extensions
[4]: /basic-components/dependency-injection/#injector-and-providers
[6]: /rest-application/native-modules/openapi
[7]: #dynamic-addition-of-providers
[8]: /basic-components/dependency-injection#hierarchy-of-injectors-in-the-ditsmod-application
[10]: /rest-application/http-interceptors/
[11]: /basic-components/dependency-injection/#provider

[100]: https://nodejs.org/api/repl.html
[101]: https://github.com/ditsmod/ditsmod/tree/main/examples/06-body-parser
[102]: https://github.com/ditsmod/ditsmod/blob/3.0.0-next.15/packages/body-parser/src/body-parser.extension.ts#L46
[103]: https://github.com/ditsmod/ditsmod/tree/main/examples/00-standalone-application
