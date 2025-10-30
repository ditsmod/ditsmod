---
sidebar_position: 1
---

# Modules

One of the main elements of the Ditsmod architecture are its modules. But what exactly is good about modular architecture? - Modularity allows you to compose different autonomous elements and assemble them into a scalable application. Thanks to the autonomy of the modules, large projects are easier to develop, test, deploy and maintain.

Such architecture allows you to isolate in one module **several code files** that may have different roles, but **common specialization**. A module can be compared to an orchestra, in which there are different instruments, but they all create music together. On the other hand, the need to isolate different modules arises due to the fact that they may have different specializations and because of this - may interfere with each other. Continuing the analogy with people, if you put police and musicians, or brokers and translators in the same office, they will most likely interfere with each other. That is why **narrow specialization** is important for a module.

Modules are the largest building blocks of an application, and their metadata declares such module components as:
- controllers that accept HTTP requests and send HTTP responses;
- services where the business logic of the application is described;
- interceptors and guards that allow you to automate the processing of HTTP requests according to typical patterns;
- decorators and extensions that allow you to add new rules and behaviors to the application;
- other classes, interfaces, helpers, data types intended for the operation of the current module.

There are two types of modules:

1. Root module.
2. Feature module.

## Root module {#root-module}

Other modules are linked to the root module, which is the only one for the entire application, and its class is recommended to be named `AppModule`. A TypeScript class becomes a Ditsmod root module thanks to one of the decorators such as `rootModule`, `restRootModule`, `trpcRootModule`, etc., depending on the module you are using. For example, if you are using REST, the root module is declared as follows:

```ts
import { restRootModule } from '@ditsmod/rest';

@restRootModule()
export class AppModule {}
```

In general, an object with the following properties can be passed to the `restRootModule` decorator:

```ts
import { restRootModule } from '@ditsmod/rest';

@restRootModule({
  imports: [], // Imported modules
  appends: [], // Appending modules that have controllers
  providersPerApp: [], // Providers at the application level
  providersPerMod: [], //         ...at the module level
  providersPerRou: [], //         ...at the route level
  providersPerReq: [], //         ...at the HTTP request level
  exports: [], // Exported modules and providers from the current module
  extensions: [], // Extensions
  extensionsMeta: {}, // Data for extensions
  resolvedCollisionsPerApp: [], // Resolution of imported class collisions at the application level
  resolvedCollisionsPerMod: [], //                                   ...at the module level
  resolvedCollisionsPerRou: [], //                                   ...at the route level
  resolvedCollisionsPerReq: [], //                                   ...at the HTTP request level
  controllers: [], // List of controllers in the current module
})
export class AppModule {}
```

## Feature module {#feature-module}

A TypeScript class becomes a Ditsmod feature module thanks to one of the following decorators: `featureModule`, `restModule`, `trpcModule`, etc., depending on the module you are using. For example, if you are using REST, the root module is declared as follows:

```ts
import { restModule } from '@ditsmod/rest';

@restModule()
export class SomeModule {}
```

It is recommended that module files end with `*.module.ts` and that their class names end with `*Module`.

It can contain exactly the same metadata as root modules, except for the `resolvedCollisionsPerApp` property. In addition to being declared directly in the application, feature module can also be published on npmjs.com.
## Transfer of providers to the DI registry {#transfer-of-providers-to-the-di-registry}

For a single dependency, one or more [providers][2] must be passed to the DI registry. Usually providers are passed to the DI registry via module metadata, although sometimes they are passed via controller metadata or even directly to [injectors][2]. In the following example `SomeService` is passed into the `providersPerMod` array:

```ts {9}
import { restModule } from '@ditsmod/rest';

import { SomeService } from './some.service.js';
import { SomeController } from './some.controller.js';

@restModule({
  controllers: [SomeController],
  providersPerMod: [
    SomeService
  ],
})
export class SomeModule {}
```

After such a transfer, consumers of providers can use `SomeService` within `SomeModule`. And now let's additionally pass another provider with the same token, but this time in the controller metadata:

```ts {8}
import { controller } from '@ditsmod/rest';

import { SomeService } from './some.service.js';
import { OtherService } from './other.service.js';

@controller({
  providersPerReq: [
    { token: SomeService, useClass: OtherService }
  ]
})
export class SomeController {
  constructor(private someService: SomeService) {}
  // ...
}
```

Pay attention to the highlighted line. Thus we tell DI: "If this controller has a dependency on the provider with the token `SomeService`, it should be substituted with an instance of the class `OtherService`". This substitution will apply only to this controller. All other controllers in `SomeModule` will receive instances of `SomeService` for the `SomeService` token.

You can perform a similar substitution at the application or module level. This can sometimes be useful, for example when you want to have default configuration values at the application level but custom values for that configuration at a specific module level. In that case, first pass the default configuration in the root module:

```ts {6}
import { rootModule } from '@ditsmod/core';
import { ConfigService } from './config.service.js';

@rootModule({
  providersPerApp: [
    ConfigService
  ],
})
export class AppModule {}
```

And then in some module substitute `ConfigService` with an arbitrary value:

```ts {6}
import { restModule } from '@ditsmod/rest';
import { ConfigService } from './config.service.js';

@restModule({
  providersPerMod: [
    { token: ConfigService, useValue: { propery1: 'some value' } }
  ],
})
export class SomeModule {}
```

## Re-adding providers {#re-adding-providers}

Different providers with the same token can be added many times in module or controller metadata, but DI will choose the provider that was added last (exceptions to this rule apply only for multi-providers):

```ts
import { restModule } from '@ditsmod/rest';

@restModule({
  providersPerMod: [
    { token: 'token1', useValue: 'value1' },
    { token: 'token1', useValue: 'value2' },
    { token: 'token1', useValue: 'value3' },
  ],
})
export class SomeModule {}
```

In this case, within `SomeModule` the `token1` will return `value3` at the module, route or request level.

Additionally, different providers with the same token can be provided at multiple different hierarchy levels simultaneously, but DI will always choose the nearest injector (i.e., if a provider value is requested at the request level, the injector at the request level will be inspected first, and only if the required provider is not found there will DI ascend to parent injectors):

```ts
import { restModule } from '@ditsmod/rest';

@restModule({
  providersPerMod: [{ token: 'token1', useValue: 'value1' }],
  providersPerRou: [{ token: 'token1', useValue: 'value2' }],
  providersPerReq: [{ token: 'token1', useValue: 'value3' }],
})
export class SomeModule {}
```

In this case, within `SomeModule` for `token1` the value `value3` will be returned at the request level, `value2` at the route level, and `value1` at the module level.

Also, if you import a provider from an external module and you have a provider with the same token in your current module, the local provider will have higher priority provided they were passed at the same hierarchy level.

[1]: https://www.npmjs.com/package/reflect-metadata
[2]: /components-of-ditsmod-app/dependency-injection/#injector-and-providers
