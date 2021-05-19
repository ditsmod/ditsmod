---
sidebar_position: 0
---

# Modules

## Non-root Ditsmod module

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

In general, an object with the following properties can be passed to the `Module` decorator:

```ts
import { Module } from '@ditsmod/core';

@Module({
  imports: [], // Import modules
  controllers: [],
  providersPerApp: [], // Application-level providers
  providersPerMod: [], // Module-level providers
  providersPerRou: [], // Route-level providers
  providersPerReq: [], // Request-level providers
  exports: [], // Export modules and providers from the current module
  extensions: []
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

It can contain information for both the HTTP server and the module itself. In general, an object
with the following properties can be passed to the `RootModule` decorator:

```ts
import * as http from 'http';
import { RootModule } from '@ditsmod/core';

@RootModule({
  // Data for the HTTP server
  httpModule: http,
  listenOptions: { host: 'localhost', port: 8080 },
  serverName: 'Node.js',
  serverOptions: {},

  // Data for the module, plus - a prefix that will be added to all routes
  prefixPerApp: 'api',
  imports: [],
  controllers: [],
  providersPerApp: [],
  providersPerMod: [],
  providersPerRou: [],
  providersPerReq: [],
  exports: [],
  extensions: []
})
export class AppModule {}
```

## Routes prefixes

If a non-root module is imported with a prefix, this prefix will be added to all routes within this
module:

```ts
import { Module } from '@ditsmod/core';

import { FirstModule } from './first.module';
import { SecondModule } from './second.module';

@Module({
  imports: [
    { prefix: 'some-prefix', module: FirstModule }
    { prefix: 'other-prefix/:pathParam', module: SecondModule }
  ]
})
export class ThridModule {}
```

Here, the entry `:pathParam` means not just text, but a parameter - a variable part in the URL
before the query parameters.

If you specify `prefixPerApp` in the root module, this prefix will be added to all routes in the
whole application:

```ts
import { RootModule } from '@ditsmod/core';

import { SomeModule } from './some.module';

@RootModule({
  prefixPerApp: 'api',
  imports: [SomeModule]
})
export class AppModule {}
```

Controllers are required to be able to handle certain URL routes.

