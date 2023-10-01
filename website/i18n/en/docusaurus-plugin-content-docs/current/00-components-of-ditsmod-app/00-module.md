---
sidebar_position: 0
---

# Modules

One of the main elements of the Ditsmod architecture are its modules. But what exactly is good about modular architecture? - It allows you to isolate in one module **several code files** that may have different roles, but **common specialization**. A module can be compared to an orchestra, in which there are different instruments, but they all create music together. On the other hand, the need to isolate different modules arises due to the fact that they may have different specializations and because of this - may interfere with each other. Continuing the analogy with people, if you put police and musicians, or brokers and translators in the same office, they will most likely interfere with each other. That is why **narrow specialization** is important for a module.

However, modules can also have different types. Two types are most often used:

- **service** - this type includes modules that provide certain services: a database module, a security module, a module for recording logs, a module for translating messages into different languages, etc.; such modules are rarely pinned to specific URLs.
- **routed** - modules that serve a certain part of the URL should be assigned to this type: for example, one module can process all HTTP requests at the address `/api/users`, another module - at the address `/api/posts` .

Modules can contain:
- controllers that accept HTTP requests and send HTTP responses;
- services where the business logic of the application is described;
- other classes, interfaces, helpers, data types intended for the operation of the current module.

## Non-root module

The TypeScript class becomes a Ditsmod module with `featureModule` decorator:

```ts
import { featureModule } from '@ditsmod/core';

@featureModule()
export class SomeModule {}
```

It is recommended that module files end with `*.module.ts` and that their class names end with `*Module`.

In general, an object with the following properties can be passed to the `featureModule` decorator:

```ts
import { featureModule } from '@ditsmod/core';

@featureModule({
  appends: [], // Appended modules (these are only needed to inherit the path prefix from the current module)
  imports: [], // Import modules
  controllers: [], // Binding controllers to the module
  providersPerApp: [], // Application-level providers
  providersPerMod: [], // Module-level providers
  providersPerRou: [], // Route-level providers
  providersPerReq: [], // Request-level providers
  exports: [], // Export modules and providers from the current module
  extensions: [],
  extensionsMeta: {}, // Data for extensions
  resolvedCollisionsPerMod: [], // Collision resolution of imported classes at the module level
  resolvedCollisionsPerRou: [], //                                    ...at the route level
  resolvedCollisionsPerReq: [], //                                    ...at the request level
  id: '', // Can be used to dynamically add or remove modules
})
export class SomeModule {}
```

## The root module

Other modules are imported into the root module, it is the only one for the whole application, and its class is recommended to be called `AppModule`. The TypeScript class becomes the root module of Ditsmod with `rootModule` decorator:

```ts
import { rootModule } from '@ditsmod/core';

@rootModule()
export class AppModule {}
```

It can contain exactly the same metadata as non-root modules.

[1]: https://www.npmjs.com/package/reflect-metadata
