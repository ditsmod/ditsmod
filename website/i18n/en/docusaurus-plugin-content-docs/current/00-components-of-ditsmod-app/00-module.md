---
sidebar_position: 0
---

# Modules

## Ditsmod module

Since Ditsmod is designed for good modularity, one of the main elements of its architecture is module. But what exactly is good about modular architecture? - It allows you to isolate in one module **several code files** that may have different roles, but **common specialization**. A module can be compared to an orchestra, in which there are different instruments, but they all create music together. On the other hand, the need to isolate different modules arises due to the fact that they may have different specializations and because of this - may interfere with each other. Continuing the analogy with people, if you put police and musicians, or brokers and translators in the same office, they will most likely interfere with each other. That is why **narrow specialization** is important for a module.

However, modules can also have different types. Two types are most often used:

- **service** - this type includes modules that provide certain services: a database module, a security module, a module for recording logs, a module for translating messages into different languages, etc.; such modules are rarely pinned to specific URLs.
- **routed** - modules that serve a certain part of the URL should be assigned to this type: for example, one module can process all HTTP requests at the address `/api/users`, another module - at the address `/api/posts` .

Modules can contain:
- controllers that accepts HTTP requests and sends HTTP responses;
- services where the business logic of the application is described;
- other classes, interfaces, helpers, data types intended for the operation of the current module.

The TypeScript class becomes a Ditsmod module with `featureModule` decorator:

```ts
import { featureModule } from '@ditsmod/core';

@featureModule()
export class SomeModule {}
```

It is recommended that module files end with `*.module.ts` and that their class names end with `*featureModule`.

Ditsmod uses several decorators. But why decorators? Because they allow you to conveniently attach metadata to classes. Thanks to decorators (in combination with the [reflect-metadata][1] library), it is possible to programmatically recognize:
- what conventional role is assigned to a certain class (role of module, controller, service, etc.);
- whether the class has a constructor and what parameters it has;
- whether the class has methods and what parameters they have;
- whether there are other properties of the class;
- other metadata is transferred to the decorator.

:::tip Conventions class roles
The class roles mentioned here - module, controller, service - are conventions (or declarative), since they have meaning only in the context of Ditsmod applications, and TypeScript itself does not have such concepts as "class role".
:::

Decorators allow you to declaratively describe the structure of the application, and therefore you can easily see what belongs to the module, as well as the connections of some modules with others.

In general, an object with the following properties can be passed to the `featureModule` decorator:

```ts
import { featureModule } from '@ditsmod/core';

@featureModule({
  appends: [], // Appended modules (these are only needed to inherit the path prefix from the current module)
  imports: [], // Import modules
  controllers: [], // Binding controllers to the module
  providersPerApp: [], // Application-level providers
  providersPerMod: [], // featureModule-level providers
  providersPerRou: [], // route-level providers
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

## Ditsmod root module

Other modules are imported into the root module, it is the only one for the whole application, and its class is recommended to be called `AppModule`. The TypeScript class becomes the root module of Ditsmod with `rootModule` decorator:

```ts
import { rootModule } from '@ditsmod/core';

@rootModule()
export class AppModule {}
```

It can contain metadata for both the HTTP server and the module itself. In general, an object with the following properties can be passed to the `rootModule` decorator:

```ts
import * as http from 'http';
import { rootModule } from '@ditsmod/core';

@rootModule({
  // Metadata for the HTTP server
  httpModule: http,
  listenOptions: { host: 'localhost', port: 3000 },
  serverOptions: {},

  // Metadata for the module, plus - path - a prefix that will be added to all routes
  path: 'api',
  appends: [],
  imports: [],
  controllers: [],
  providersPerApp: [],
  providersPerMod: [],
  providersPerRou: [],
  providersPerReq: [],
  exports: [],
  extensions: [],
  extensionsMeta: {},
  resolvedCollisionsPerApp: [],
  resolvedCollisionsPerMod: [],
  resolvedCollisionsPerRou: [],
  resolvedCollisionsPerReq: [],
})
export class AppModule {}
```

[1]: https://www.npmjs.com/package/reflect-metadata
