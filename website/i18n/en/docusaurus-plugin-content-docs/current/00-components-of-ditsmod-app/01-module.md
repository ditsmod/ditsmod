---
sidebar_position: 2
---

# Modules

One of the key elements of the Ditsmod architecture is its modules. But what exactly makes a modular architecture so advantageous? — Modularity allows you to compose various autonomous elements and assemble a scalable application from them. Thanks to the autonomy of modules, large projects are easier to develop, test, deploy, and maintain. Modularity also simplifies the transition to a microservices architecture if, in the future, you decide that your Ditsmod application requires horizontal scaling.

Such architecture allows you to isolate in one module **several code files** that may have different roles, but **common specialization**. A module can be compared to an orchestra, in which there are different instruments, but they all create music together. On the other hand, the need to isolate different modules arises due to the fact that they may have different specializations and because of this - may interfere with each other. Continuing the analogy with people, if you put police and musicians, or brokers and translators in the same office, they will most likely interfere with each other. That is why **narrow specialization** is important for a module.

Modules are the largest building blocks of an application, and their metadata declares the following components of the application:
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
