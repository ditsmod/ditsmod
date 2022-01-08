---
sidebar_position: 0
---

# Modules

## Ditsmod module

Generally speaking, the module should have a set of classes with a narrow specialization.
A well-designed module does not have to be a "universal combine".

For example, a security module has a narrow specialization - access security and application
management security. Here should not be declared classes which translating messages into
different languages, sending mail, writing logs, etc.

When a particular module is tied to a specific URL, it's also good practice, and it can also be
considered as a "narrow specialization". For example, one module can process all HTTP requests to
`/api/users`, another module can process `/api/posts`.

The TypeScript class becomes a Ditsmod module with `Module` decorator:

```ts
import { Module } from '@ditsmod/core';

@Module()
export class SomeModule {}
```

It is recommended that module files end with `*.module.ts` and that their class names end with `*Module`.

Ditsmod uses several decorators. But why decorators? Because they allow to scan classes. Thanks to decorators, you can programmatically recognize:
- what conventional role is assigned to a certain class (role of module, controller, service, etc.);
- whether the class has a constructor and what parameters it has;
- whether the class has methods and what parameters they have;
- whether there are other properties of the class;
- other metadata is transferred to the decorator.

Decorators allow you to declaratively describe the structure of the application, and therefore you can easily view the connections of some modules with others.

In general, an object with the following properties can be passed to the `Module` decorator:

```ts
import { Module } from '@ditsmod/core';

@Module({
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

## Ditsmod root module

Other modules are imported into the root module, it is the only one for the whole application, and
its class is recommended to be called `AppModule`. The TypeScript class becomes the root module of
Ditsmod with `RootModule` decorator:

```ts
import { RootModule } from '@ditsmod/core';

@RootModule()
export class AppModule {}
```

It can contain metadata for both the HTTP server and the module itself. In general, an object
with the following properties can be passed to the `RootModule` decorator:

```ts
import * as http from 'http';
import { RootModule } from '@ditsmod/core';

@RootModule({
  // Metadata for the HTTP server
  httpModule: http,
  listenOptions: { host: 'localhost', port: 3000 },
  serverName: 'Node.js',
  serverOptions: {},

  // Metadata for the module, plus - a prefix that will be added to all routes
  prefixPerApp: 'api',
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
