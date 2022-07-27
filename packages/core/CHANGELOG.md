<a name="core-2.1.0"></a>
# [core-2.1.0](https://github.com/ts-stack/ditsmod/releases/tag/core-2.1.0) (2022-07-27)

### BREAKING CHANGES

- Renamed `DefaultLogger` to `ConsoleLogger`.

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
