<a name="testing-2.4.0"></a>
# [testing-2.4.0](https://github.com/ditsmod/ditsmod/releases/tag/testing-2.4.0) (2023-08-28)

### Features and Breaking changes

- Migration to ESM.

<a name="testing-2.3.0"></a>
## [testing-2.3.0](https://github.com/ditsmod/ditsmod/releases/tag/testing-2.3.0) (2023-08-22)

### Breaking chanages

- Renamed `setInitLogLevel()` method to `setLogLevel()`.
- Removed `setProvidersPerApp()` method.

### Features

- The `setLogLevel()` method now sets the logging level both for application initialization and after.

<a name="testing-2.2.0"></a>
## [testing-2.2.0](https://github.com/ditsmod/ditsmod/releases/tag/testing-2.2.0) (2023-08-20)

### Breaking chanages

- Now, when creating an instance of `TestApplication`, in the constructor the second parameter is the options for the server. Before there was `listen`.

<a name="testing-2.1.0"></a>
## [testing-2.1.0](https://github.com/ditsmod/ditsmod/releases/tag/testing-2.1.0) (2023-08-18)

### Features

- Intoduced `TestProvider`. This type of providers that can containe `providers` properties (for more info, see [Testing](https://ditsmod.github.io/en/developer-guides/testing)).

<a name="testing-2.0.0"></a>
## testing-2.0.0 (2023-08-14)

### Breaking chanages

- `TestApplication#overrideProviders()` accept only normalized providers.
- rename `setLogLevelForInit()` to `setLogLevel()`.

### Features

- Added `TestApplication#setProvidersPerApp()`.

<a name="testing-2.0.0-beta.5"></a>
## testing-2.0.0-beta.5 (2023-08-11)

### Migration

- migration to core-2.41.0.

<a name="testing-2.0.0-beta.4"></a>
## testing-2.0.0-beta.4 (2023-08-10)

### Breaking chanages

- Simplifying `TestApplication` API: added `getServer()` method.

<a name="testing-2.0.0-beta.3"></a>
## testing-2.0.0-beta.3 (2023-08-10)

### Breaking chanages

- Simplifying `TestApplication` API. The AppModule is now passed to the `TestApplication` constructor.

<a name="testing-2.0.0-beta.1"></a>
## testing-2.0.0-beta.1 (2023-08-10)

### Features

- Added the ability to override any provider for end-to-end tests;
- Added ability to force logLevel for end-to-end tests.
