<a name="core-2.25.0"></a>
# [core-2.25.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.25.0) (2022-10-15)

### BREAKING CHANGES

- Removed `serverName` from `RootModuleMetadata`.
- Removed body parser options.

### Features

- Added `exports` property to `ModuleWithParams`.

<a name="core-2.24.0"></a>
## [core-2.24.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.24.0) (2022-10-13)

### BREAKING CHANGES

- Refactoring `Request` and `Response`: removed unused properties.

<a name="core-2.23.0"></a>
## [core-2.23.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.23.0) (2022-10-12)

### Features

- Added `DefaultHttpFrontend`, `DefaultHttpBackend`, `HttpBackend` and `HttpFrontend` to export from index.ts.

<a name="core-2.22.0"></a>
# [core-2.22.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.22.0) (2022-10-07)

### BREAKING CHANGES

- Removed `httpMethod` and `path` from `RouteMeta`.

<a name="core-2.21.0"></a>
## [core-2.21.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.21.0) (2022-09-30)

### Features

- added ability passing `methodName` for `RouteMeta` as symbol.
- added getModule() util to export.
- introduce `injectorKey`. A key for the injector that you can use within the controller instance (e.g. `(this as any)[injectorKey]`) to get the injector per request. It is used to obtain an injector without accessing the controller's constructor (e.g. when dynamically adding controller methods).

<a name="core-2.20.1"></a>
## [core-2.20.1](https://github.com/ts-stack/ditsmod/releases/tag/core-2.20.1) (2022-09-30)

### Bug fix

- [fixed](https://github.com/ditsmod/ditsmod/commit/e20e2fb9fc) Providers TypeScript definitions.

<a name="core-2.20.0"></a>
## [core-2.20.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.20.0) (2022-09-29)

### BREAKING CHANGES

- removed `providers.useAnyValue()`.

<a name="core-2.19.0"></a>
## [core-2.19.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.19.0) (2022-09-25)

### Features

- added generic to `providers.useValue()`.
- added `args1` and `args2` to `ErrorOpts`.

### Inprovements

- refactoring `DefaultControllerErrorHandler`.
- removed print all providers in `PreRouterExtension`.

<a name="core-2.18.0"></a>
## [core-2.18.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.18.0) (2022-09-21)

### Features

- moved part logic from `ImportResolver` to `logMediator.throwNoProviderDuringResolveImports()`.
- added `logMediator.showProvidersInLogs()` to `ImportsResolver`.

### Bug fix

- fixed `logMediator.renderLogs()`.

<a name="core-2.17.0"></a>
## [core-2.17.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.17.0) (2022-09-20)

### BREAKING CHANGES

- Removed `InjectorPerApp` class.

### Features

- Now extensions can dynamically add providers per the application.

### Bug fix

- Fixed passing parameter for `extension.init(isLastExtensionCall?: boolean)`.

<a name="core-2.16.0"></a>
## [core-2.16.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.16.0) (2022-09-19)

### Features

- intoduced `PerAppService` and ability for extension to extends `providersPerApp`.

<a name="core-2.15.1"></a>
## [core-2.15.1](https://github.com/ts-stack/ditsmod/releases/tag/core-2.15.1) (2022-09-18)

### Features

- removed `ExtensionsMetaPerApp` from defaultProvidersPerApp.

<a name="core-2.15.0"></a>
## [core-2.15.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.15.0) (2022-09-18)

### Features

- Added `ExtensionsMetaPerApp` provider.

<a name="core-2.14.2"></a>
## [core-2.14.2](https://github.com/ts-stack/ditsmod/releases/tag/core-2.14.2) (2022-09-07)

### Bug fix

- Fixed `logMediator.applyLogFilter()`.

<a name="core-2.14.1"></a>
## [core-2.14.1](https://github.com/ts-stack/ditsmod/releases/tag/core-2.14.1) (2022-09-07)

### Bug fix

- Added `CustomError` and `ErrorOpts` to imports from `index.ts`.

<a name="core-2.14.0"></a>
## [core-2.14.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.14.0) (2022-09-07)

### Features

- Added `CustomError` class. Now you can use it like this:

```ts
import { Status } from '@ditsmod/core';

const msg1 = 'frontend %s message';
const msg2 = 'backend %s message';
const cause = new Error();
const err = new CustomError({ msg1, msg2, level: 'warn', status: Status.CONFLICT }, cause);
```

- Refactoring `DefaultControllerErrorHandler` with `CustomError`, so you can specify log level and status for `CustomError`.

<a name="core-2.13.3"></a>
## [core-2.13.3](https://github.com/ts-stack/ditsmod/releases/tag/core-2.13.3) (2022-09-02)

### Bug fix

- Fixed `loggerConfig.transformMsgIfFilterApplied()`.

<a name="core-2.13.1"></a>
## [core-2.13.1](https://github.com/ts-stack/ditsmod/releases/tag/core-2.13.1) (2022-09-02)

### Bug fix

- Make `allowRaisedLogs` optional for `LoggerConfig`.

<a name="core-2.13.0"></a>
## [core-2.13.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.13.0) (2022-09-02)

### Features

- Automatic addition of module name to log message for `LogMediator` if the filter is applied.
- Added `allowRaisedLogs: boolean` options to `LoggerConfig`. If `LogMediator` is used to throw an error, this option allows you to raise the log level. For example, if you set the log level to `info` and the router throws an error about duplicates in routes paths, allowRaisedLog allows you to filter and show relevant logs, even if they have log level `debug`. Default - true.

### Bug fix

- Fixed `importsResolver.resolveProvidersForExtensions()`.

<a name="core-2.12.0"></a>
## [core-2.12.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.12.0) (2022-08-31)

### BREAKING CHANGES

- Replaced `ExtensionItem1` and `ExtensionItem1`, by `ExtensionOptions`. Now:

```ts
// Old way
Module({
  // ...
  extensions: [
    [MY_GROUP_EXTENSIONS, MyExtension, true]
  ],
})
export class SomeModule {}

// New way
Module({
  // ...
  extensions: [
    { extension: MyExtension, groupToken: MY_GROUP_EXTENSIONS, exported: true }
  ],
})
export class SomeModule {}
```

<a name="core-2.11.0"></a>
## [core-2.11.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.11.0) (2022-08-27)

### BREAKING CHANGES

- Renamed `ModConfig` to `ModuleExtract`.
- Removed `moduleName` property from `LogMediator`.

### Features

- Added `new Providers().useLogMediator()` method to reduce the amount of code when passing providers to DI:

```ts
Module({
  // ...
  providersPerMod: [
    ...new Providers()
      .useLogMediator(MyLogMediator)
  ],
})
export class SomeModule {}
```

<a name="core-2.10.0"></a>
## [core-2.10.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.10.0) (2022-08-27)

### Features

- Added `new Providers().useLogConfig()` method to reduce the amount of code when passing providers to DI:

```ts
Module({
  // ...
  providersPerMod: [
    ...new Providers()
      .useLogConfig({ level: 'debug' }, { tags: ['route', 'i18n'] })
  ],
})
export class SomeModule {}
```

<a name="core-2.9.0"></a>
## [core-2.9.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.9.0) (2022-08-27)

### Features

- Added `new Providers().use()` method to adding plugins:

```ts
class Plugin1 extends Providers {
  method1() {
    // ...
    return this;
  }
}

class Plugin2 extends Providers {
  method2() {
    // ...
    return this;
  }
}

Module({
  // ...
  providersPerMod: [
    ...new Providers()
      .use(Plugin1)
      .use(Plugin2)
      .method1()
      .method2()
      .useValue(LoggerConfig, new LoggerConfig('trace'))
      .useClass(SomeService, ExtendedService)
  ],
})
export class SomeModule {}
```

<a name="core-2.8.0"></a>
## [core-2.8.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.8.0) (2022-08-26)

### BREAKING CHANGES

- Removed moduleName options from `MsgLogFilter` because moduleName adds automatically to log filter.

### Features

- Added `logMediator.detectedDifferentLogFilters()` to warn about detected different log filters.

<a name="core-2.7.1"></a>
## [core-2.7.1](https://github.com/ts-stack/ditsmod/releases/tag/core-2.7.1) (2022-08-26)

### Bug fix

- Set log level to default if logger.getLevel() not yet implemented.

<a name="core-2.7.0"></a>
## [core-2.7.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.7.0) (2022-08-26)

### BREAKING CHANGES

- Now your logger must provide `getLog()` method.
- Removed the need for a `Logger` token as the first argument for `providers.useLogger()` method.
- Introduced `MsgLogFilter` instead `LogFilter` for `logMediator.setLog()`.

### Bug fix

- Fixed `LogMediator` and `LogFilter` on module level.

<a name="core-2.6.0"></a>
## [core-2.6.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.6.0) (2022-08-26)

### Features

- added `Providers` class which has utilites to adding providers to DI in more type safe way. You can use this as follow:

```ts
@Module({
  // ...
  providersPerMod: [
    ...new Providers()
      .useLogConfig({ level: 'trace' })
      .useClass(SomeService, ExtendedService)
  ],
})
export class SomeModule {}
```

### BREAKING CHANGES

- Removed `providerUseValue()` (use `...new Providers().useValue()` instead).

<a name="core-2.5.0"></a>
## [core-2.5.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.5.0) (2022-08-25)

### BREAKING CHANGES

- Renamed `FilterConfig` to `LogFilter`.
- Removed `LogMediatorConfig` (use `LogFilter` instead).

### Features

- added `providerUseValue()` utilite to adding providers with `useValue` in more type safe way.

<a name="core-2.4.1"></a>
## [core-2.4.1](https://github.com/ts-stack/ditsmod/releases/tag/core-2.4.1) (2022-08-25)

### Bug fix

- Fixed ImportsResolver [cfba1d89790](https://github.com/ditsmod/ditsmod/commit/cfba1d89790). Now ImportsResolver takes into account which of deps is optional

<a name="core-2.4.0"></a>
## [core-2.4.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.4.0) (2022-08-24)

### Bug fix

- fixed `LogMediator` level for buferred logs
- fixed `logMediator.filterLogs()`

### Features

- refactoring `appInitializer.handleExtensions()`. Now LogMediator gets from DI on module level.

<a name="core-2.3.0"></a>
## [core-2.3.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.3.0) (2022-08-13)

### Features

- Added getter `req.requestId`.

<a name="core-2.2.3"></a>
## [core-2.2.3](https://github.com/ts-stack/ditsmod/releases/tag/core-2.2.3) (2022-08-08)

### Bug fix

- Fixed `extensionsManager.init()`.

<a name="core-2.2.2"></a>
## [core-2.2.2](https://github.com/ts-stack/ditsmod/releases/tag/core-2.2.2) (2022-08-06)

### BREAKING CHANGES

- Renamed `LogLevels` to `LogLevel`.

<a name="core-2.2.1"></a>
## [core-2.2.1](https://github.com/ts-stack/ditsmod/releases/tag/core-2.2.1) (2022-08-06)

### Bug fix

- Fixed `appInitializer.handleExtensions()` and `logMediator.setLog()`.

<a name="core-2.2.0"></a>
## [core-2.2.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.2.0) (2022-08-05)

### Features

- Log levels for a module.

<a name="core-2.1.0"></a>
## [core-2.1.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.1.0) (2022-07-31)

### Features

- Added call for a module constructor.

### BREAKING CHANGES

- Renamed `DefaultLogger` to `ConsoleLogger`.
- Removed `LoggerMethod`.

<a name="core-2.0.0"></a>
## [core-2.0.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.0.0) (2022-07-18)

### BREAKING CHANGES

- Migration to Ditsmod v2.

<a name="core-1.0.0"></a>
## [core-1.0.0](https://github.com/ts-stack/ditsmod/releases/tag/core-1.0.0) (2021-05-23)

### BREAKING CHANGES

- removed BodyParser type [24569d1](https://github.com/ditsmod/ditsmod/commit/24569d1).
- moved guards calls to HttpFrontend [29b6db3](https://github.com/ditsmod/ditsmod/commit/29b6db3).

### Features

- allow any multi-providers for extensions [62e170a](https://github.com/ditsmod/ditsmod/commit/62e170a).

### Improvements

- set strict mode for tsconfig [861c4a3](https://github.com/ditsmod/ditsmod/commit/861c4a3).

<a name="core-beta.21"></a>
## [core-beta.21](https://github.com/ts-stack/ditsmod/releases/tag/core-beta.21) (2021-05-10)

### BREAKING CHANGES

- removed `parseBody` feature from core [3a77bb](https://github.com/ditsmod/ditsmod/commit/3a77bb).

<a name="core-beta.20"></a>
## [core-beta.20](https://github.com/ts-stack/ditsmod/releases/tag/core-beta.20) (2021-05-09)

### BREAKING CHANGES

- renamed `additionalMeta` to `extensionsMeta` [cf1999](https://github.com/ditsmod/ditsmod/commit/cf1999).

### Features

- allow `ModuleWithParams` to have `extensionsMeta` [3bf166](https://github.com/ditsmod/ditsmod/commit/3bf166).

<a name="core-beta.19"></a>
## [core-beta.19](https://github.com/ts-stack/ditsmod/releases/tag/core-beta.19) (2021-05-07)

### BREAKING CHANGES

- introduce additionalInfo for ModuleMetadata [f19750c](https://github.com/ditsmod/ditsmod/commit/f19750c).

### Features

- added `instantiateProvidersPerReq()` during init an app [0a0be76](https://github.com/ditsmod/ditsmod/commit/0a0be76).

<a name="core-beta.18"></a>
## [core-beta.18](https://github.com/ts-stack/ditsmod/releases/tag/core-beta.18) (2021-05-07)

### BREAKING CHANGES

- set `pathParams` and `pathParamsArr` default values [f72b08c](https://github.com/ditsmod/ditsmod/commit/f72b08c).

### Bug fix

- moved request error handler to `PreRouter` [1b3100](https://github.com/ditsmod/ditsmod/commit/1b3100).

<a name="core-beta.17"></a>
## [core-beta.17](https://github.com/ts-stack/ditsmod/releases/tag/core-beta.17) (2021-05-03)

### BREAKING CHANGES

- renamed `VOID_EXTENSIONS` to `PRE_ROUTER_EXTENSIONS` [31736f5](https://github.com/ditsmod/ditsmod/commit/31736f5).

### Features

- introduce `BEFORE` extensions hook [1b3100](https://github.com/ditsmod/ditsmod/commit/1b3100).

<a name="core-beta.16"></a>
## [core-beta.16](https://github.com/ts-stack/ditsmod/releases/tag/core-beta.16) (2021-04-27)

### Features

- delegated getPath() from `PreRouter` to `RoutesExtension` [7cbbae](https://github.com/ditsmod/ditsmod/commit/7cbbae).

<a name="core-beta.14"></a>
## [core-beta.14](https://github.com/ts-stack/ditsmod/releases/tag/core-beta.14) (2021-04-20)

### Features

- added `Log` class as proxy for logger [8dd134](https://github.com/ditsmod/ditsmod/commit/8dd134).

<a name="core-beta.13"></a>
## [core-beta.13](https://github.com/ts-stack/ditsmod/releases/tag/core-beta.13) (2021-04-19)

### Features

- Added ModConfig to `providersPerMod` [5335dd](https://github.com/ditsmod/ditsmod/commit/5335dd).

<a name="core-beta.12"></a>
## [core-beta.12](https://github.com/ts-stack/ditsmod/releases/tag/core-beta.12) (2021-04-18)

### Features

- Allow `ModuleWithParams` for exports [447359](https://github.com/ditsmod/ditsmod/commit/447359).

<a name="beta.11"></a>
## [beta.11](https://github.com/ts-stack/ditsmod/releases/tag/beta.11) (2021-04-16)

### Features

- Export more type for `edk` (Extension Development Kit).

<a name="beta.10"></a>
## [beta.10](https://github.com/ts-stack/ditsmod/releases/tag/beta.10) (2021-04-07)

### Features

- Freeze module metadata (see [a510a55](https://github.com/ditsmod/ditsmod/commit/a510a55)).

<a name="beta.9"></a>
## [beta.9](https://github.com/ts-stack/ditsmod/releases/tag/beta.9) (2021-04-06)

### Bug fix

- Fixed `mapExtensionsToInjectors()` (see [b032737](https://github.com/ditsmod/ditsmod/commit/b032737)).

<a name="beta.8"></a>
## [beta.8](https://github.com/ts-stack/ditsmod/releases/tag/beta.8) (2021-04-06)

### Bug fix

- Fixed `mapExtensionsToInjectors()` (see [ef4f2036](https://github.com/ditsmod/ditsmod/commit/ef4f2036)).

<a name="beta.7"></a>
## [beta.7](https://github.com/ts-stack/ditsmod/releases/tag/beta.7) (2021-04-05)

### Bug fix

- Fixed instantiate extensions (see [53ca4357](https://github.com/ditsmod/ditsmod/commit/53ca4357)).

<a name="beta.6"></a>
## [beta.6](https://github.com/ts-stack/ditsmod/releases/tag/beta.6) (2021-04-05)

### Features

- Added `ExtensionsManager`.

<a name="beta.5"></a>
## [beta.5](https://github.com/ts-stack/ditsmod/releases/tag/beta.5) (2021-04-05)

### Features

- Added extensions (see [examples](./examples)).

<a name="beta.4"></a>
## [beta.4](https://github.com/ts-stack/ditsmod/releases/tag/beta.4) (2021-03-21)

### Features

- Added HTTP interceptors.
