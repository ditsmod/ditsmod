<a name="core-2.51.2"></a>
# [core-2.51.2](https://github.com/ditsmod/ditsmod/releases/tag/core-2.51.2) (2024-02-10)

| Commit | Type | Description |
| -- | -- | -- |
| [820b3e6d39](https://github.com/ditsmod/ditsmod/commit/820b3e6d39238b17bdf5d48857956ad7a221c5c7) | fix | Fixed passing request context to singleton interceptors. |

<a name="core-2.51.1"></a>
## [core-2.51.1](https://github.com/ditsmod/ditsmod/releases/tag/core-2.51.1) (2023-10-08)

### Bug fix

- Fixed typo in `SingletonRequestContext` property.

<a name="core-2.51.0"></a>
## [core-2.51.0](https://github.com/ditsmod/ditsmod/releases/tag/core-2.51.0) (2023-10-07)

### Features

- Introduced `@guard()` decorator.

<a name="core-2.50.1"></a>
## [core-2.50.1](https://github.com/ditsmod/ditsmod/releases/tag/core-2.50.1) (2023-10-03)

### Bug fix

- Added support for sigleton HTTP interceptors.

<a name="core-2.50.0"></a>
## [core-2.50.0](https://github.com/ditsmod/ditsmod/releases/tag/core-2.50.0) (2023-09-30)

### Features

- Introduced `RequestContext` for HTTP interceptors:

  ```ts
  interface HttpInterceptor {
    intercept(next: HttpHandler, ctx: RequestContext): Promise<any>;
  }
  ```
- Introduced `@controller({ isSingleton: true })` options. You can now specify that your controller is a singleton. In this case, the controller receives a `RequestContext`, but an injector is not created for it on every request. Routes in such a controller are very fast.

<a name="core-2.49.0"></a>
## [core-2.49.0](https://github.com/ditsmod/ditsmod/releases/tag/core-2.49.0) (2023-09-15)

### Features

- Added a check to determine if the imported module is external. This change applies to exporting providers and extensions from the root module. Previously, these extensions and providers were added to all modules without exception, including external modules (which are usually placed in the `node_modules` folder). And it was unnecessary, because external modules do not need "global" providers and extensions. Therefore, it is no longer available in this release.

- Added `bufferLogs` option:

  ```ts
  import { Application } from '@ditsmod/core';
  import { AppModule } from './app/app.module.js';

  const app = await new Application().bootstrap(AppModule, { bufferLogs: false });
  app.server.listen(3000, '0.0.0.0');
  ```
  If `{ bufferLogs: true }`, all messages are buffered during application initialization and flushed afterwards. This can be useful if you want all messages to be recorded by the final logger, which is configured after the application is fully initialized.

  Default - `true`.

- Reduced `Logger` interface requirements. Now the logger you can use to substitute the default `ConsoleLogger` should have only three methods:

  ```ts
  log(level: InputLogLevel, ...args: any[]);

  setLevel(value: OutputLogLevel);

  getLevel(): OutputLogLevel;
  ```

- Now `res.nodeRes` is public property, so you can use this native Node.js response object.

### Bug fixes

- When appending modules, their `providersPerApp` was ignored. In this release, they are taken into account.
- Fixed `cleanErrorTrace()`.

<a name="core-2.48.0"></a>
## [core-2.48.0](https://github.com/ditsmod/ditsmod/releases/tag/core-2.48.0) (2023-09-07)

### Features

- Added `Injector#pull()` method.
  If the nearest provider with the given `token` is in the parent injector, then this method pulls that provider into the current injector. After that, it works the same as `injector.get()`. If the nearest provider with the given `token` is in the current injector, then this method behaves exactly like `injector.get()`. This method is primarily useful because it allows you, in the context of the current injector, to rebuild instances of providers that depend on a particular configuration that may be different in the current and parent injectors:

  ```ts
  import { injectable, Injector } from '@ditsmod/core';

  class Config {
    one: any;
    two: any;
  }

  @injectable()
  class Service {
    constructor(public config: Config) {}
  }

  const parent = Injector.resolveAndCreate([Service, { token: Config, useValue: { one: 1, two: 2 } }]);
  const child = parent.resolveAndCreateChild([{ token: Config, useValue: { one: 11, two: 22 } }]);
  child.get(Service).config; // returns from parent injector: { one: 1, two: 2 }
  child.pull(Service).config; // pulls Service in current injector: { one: 11, two: 22 }
  child.get(Service).config; // now, in current injector, works cache: { one: 11, two: 22 }
  ```

- Added `isClassFactoryProvider()` type guard.
- In `Providers` helper, added support for `FunctionFactoryProvider`.

<a name="core-2.47.0"></a>
## [core-2.47.0](https://github.com/ditsmod/ditsmod/releases/tag/core-2.47.0) (2023-08-28)

### Features and Breaking changes

- Migration to ESM.
