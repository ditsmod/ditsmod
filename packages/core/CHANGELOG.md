<a name="core-2.54.0"></a>
# [core-2.54.0](https://github.com/ditsmod/ditsmod/releases/tag/core-2.54.0) (2024-08-06)

| Commit | Type | Description |
| -- | -- | -- |
| [7e2a5195f2](https://github.com/ditsmod/ditsmod/commit/7e2a5195f245d7) | refactor | Hide logs from external modules, by default. |
| [83542addf2](https://github.com/ditsmod/ditsmod/commit/83542addf21412) | refactor | Now the name of the module where the logs were recorded is added to all logs. |
| [41d6c2eeb2](https://github.com/ditsmod/ditsmod/commit/41d6c2eeb2fe24) | refactor | Allow collisions in host modules. |
| [7823a7aa93](https://github.com/ditsmod/ditsmod/commit/7823a7aa93e3e1) | refactor | Introduced `DecoratorAndValue#declaredInDir` property. |
| [2f1d6c6f0c](https://github.com/ditsmod/ditsmod/commit/2f1d6c6f0ccd6c) | refactor | Introduced `ExtensionObj#exportedOnly`. |
| [c3910acae2](https://github.com/ditsmod/ditsmod/commit/c3910acae2989a) | refactor | Fixed `AppInitializer#logExtensionsStatistic()`, now counter works as expected. |

<a name="core-2.53.2"></a>
## [core-2.53.2](https://github.com/ditsmod/ditsmod/releases/tag/core-2.53.2) (2024-08-04)

| Commit | Type | Description |
| -- | -- | -- |
| [a9d97687f9](https://github.com/ditsmod/ditsmod/commit/a9d97687f989a6209c6eededbad48b872a4463e9) | fix | fixed `getCallerDir()`. |

<a name="core-2.53.1"></a>
## [core-2.53.1](https://github.com/ditsmod/ditsmod/releases/tag/core-2.53.1) (2024-07-22)

| Commit | Type | Description |
| -- | -- | -- |
| [7643ee3f2a](https://github.com/ditsmod/ditsmod/commit/7643ee3f2a) | fix | fixed `DefaultSingletonHttpErrorHandler`. |

<a name="core-2.53.0"></a>
## [core-2.53.0](https://github.com/ditsmod/ditsmod/releases/tag/core-2.53.0) (2024-07-22)

**Breaking Changes**

- renamed `createServerAndListen()` to `createServerAndBindToListening()` [faeb38a784](https://github.com/ditsmod/ditsmod/commit/faeb38a784fc96c8fc45ab4dce7f22d8c8e23961).


| Commit | Type | Description |
| -- | -- | -- |
| [f6c97987ce](https://github.com/ditsmod/ditsmod/commit/f6c97987cec16) | refactor | refactoring sending unknow an error in `DefaultHttpErrorHandler`. |
| [e3b4c8f48b](https://github.com/ditsmod/ditsmod/commit/e3b4c8f48b3d5) | refactor | refactoring `RegistryOfInjector`. |

<a name="core-2.52.0"></a>
## [core-2.52.0](https://github.com/ditsmod/ditsmod/releases/tag/core-2.52.0) (2024-04-02)

**Breaking Changes**

- renamed `SingletonHttpFrontend` to `DefaultSingletonHttpFrontend` [34c1f18eb4](https://github.com/ditsmod/ditsmod/commit/34c1f18eb4fa9b5a959ec34f7c8497a52cfc5afc).
- renamed `SingletonChainMaker` to `DefaultSingletonChainMaker` [6f6bdd4c64](https://github.com/ditsmod/ditsmod/commit/6f6bdd4c6493ee88c0d8d7f0c9bf81cd4dcdc75d).
- renamed `SingletonHttpErrorHandler` to `DefaultSingletonHttpErrorHandler` [d3be41e942](https://github.com/ditsmod/ditsmod/commit/d3be41e942905ced21304dad2910ee2682405aa8).


| Commit | Type | Description |
| -- | -- | -- |
| [5af42900c4](https://github.com/ditsmod/ditsmod/commit/5af42900c4b4dfa1e9a4e7a3918e390608211b38) | feat | added `Res#setHeaders`. |
| [16141c9cfd](https://github.com/ditsmod/ditsmod/commit/16141c9cfd82ec82f043bc34a613256a95f521f3) | feat | added ability pass headers to `Res#send()`. |
| [b2c9fdd160](https://github.com/ditsmod/ditsmod/commit/b2c9fdd160c522102898cc135016013a8c5c9d92) | feat | extended `RequestContext`. |
| [951e096b2d](https://github.com/ditsmod/ditsmod/commit/951e096b2d503bb0c287e13bd2552ed943d9c97a) | feat | added `HttpHeaders` interface. |
| [9e1f71972c](https://github.com/ditsmod/ditsmod/commit/9e1f71972ce28c92592fd30b2b4d1adb471252d8) | feat | added `RequestContext` to `defaultProvidersPerApp`. |
| [5f0fe6e030](https://github.com/ditsmod/ditsmod/commit/5f0fe6e0302b8c3d9fc010581429d24f66ea329c) | fix | fixed import `makeClassDecorator` for `GuardMetadata`. |
| [e52d41f3ff](https://github.com/ditsmod/ditsmod/commit/e52d41f3ffae0db5d9f0c6e59ac487b36117bebb) | fix | fixed type for `A_PATH_PARAMS`. |
| [a0149e582b](https://github.com/ditsmod/ditsmod/commit/a0149e582b32bbc16c2d317fdd9bed8797418e53) | refactor | refactoring `Logger` and `ConsoleLogger`. |
| [fd63181078](https://github.com/ditsmod/ditsmod/commit/fd631810781141c2a09f3e17130f6924c9374e68) | refactor | refactoring `ConsoleLogger`. |
| [9189d9644d](https://github.com/ditsmod/ditsmod/commit/9189d9644de6cd37affb26d19b757b5889512a7a) | refactor | change default log level for `ErrorOpts`. |
| [66f468f783](https://github.com/ditsmod/ditsmod/commit/66f468f783dbe4003b728d888c0a7910d1d39700) | refactor | apply new methods for `RequestContext`. |

<a name="core-2.51.2"></a>
## [core-2.51.2](https://github.com/ditsmod/ditsmod/releases/tag/core-2.51.2) (2024-02-10)

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
