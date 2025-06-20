---
sidebar_position: 0
---

# Modules

One of the main elements of the Ditsmod architecture are its modules. But what exactly is good about modular architecture? - Modularity allows you to compose different autonomous elements and assemble them into a scalable application. Thanks to the autonomy of the modules, large projects are easier to develop, test, deploy and maintain.

Such architecture allows you to isolate in one module **several code files** that may have different roles, but **common specialization**. A module can be compared to an orchestra, in which there are different instruments, but they all create music together. On the other hand, the need to isolate different modules arises due to the fact that they may have different specializations and because of this - may interfere with each other. Continuing the analogy with people, if you put police and musicians, or brokers and translators in the same office, they will most likely interfere with each other. That is why **narrow specialization** is important for a module.

However, modules can also have different types. Two types are most often used:

- **service** - this type includes modules that provide certain services: a database module, a security module, a module for recording logs, a module for translating messages into different languages, etc.; such modules are rarely pinned to specific URLs.
- **routed** - modules that serve a certain part of the URL should be assigned to this type: for example, one module can process all HTTP requests at the address `/api/users`, another module - at the address `/api/posts` .

Modules can contain:
- controllers that accept HTTP requests and send HTTP responses;
- services where the business logic of the application is described;
- interceptors and guards that allow you to automate the processing of HTTP requests according to typical patterns;
- decorators and extensions that allow you to add new rules and behaviors to the application;
- other classes, interfaces, helpers, data types intended for the operation of the current module.

## Root module

Other modules are imported into the root module, it is the only one for the whole application, and its class is recommended to be called `AppModule`. The TypeScript class becomes the root module of Ditsmod with `rootModule` decorator:

```ts
import { rootModule } from '@ditsmod/core';

@rootModule()
export class AppModule {}
```

In general, an object with the following properties can be passed to the `rootModule` decorator:

```ts
import { rootModule } from '@ditsmod/core';

@rootModule({
  imports: [], // Import modules
  providersPerApp: [], // Application-level providers
  providersPerMod: [], // Module-level providers
  exports: [], // Export modules and providers from the current module
  extensions: [],
  extensionsMeta: {}, // Data for extensions
  resolvedCollisionsPerApp: [], // Collision resolution of imported classes at the application level
  resolvedCollisionsPerMod: [], //                                    ...at the route level
  id: '', // Can be used to dynamically add or remove modules
})
export class AppModule {}
```

## Feature module

The TypeScript class becomes a feature Ditsmod module with the `featureModule` decorator:

```ts
import { featureModule } from '@ditsmod/core';

@featureModule()
export class SomeModule {}
```

It is recommended that module files end with `*.module.ts` and that their class names end with `*Module`.

It can contain exactly the same metadata as root modules, except for the `resolvedCollisionsPerApp` property.

[1]: https://www.npmjs.com/package/reflect-metadata
