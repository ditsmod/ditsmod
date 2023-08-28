<a name="openapi-2.20.0-beta.1"></a>
# [openapi-2.20.0-beta.1](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.20.0-beta.1) (2023-08-28)

### Features and Breaking changes

- Migration to ESM.

<a name="openapi-2.19.1"></a>
## [openapi-2.19.1](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.19.1) (2023-08-20)

### Bug fix

- Fixed import `swagger-ui`.

<a name="openapi-2.19.0"></a>
## [openapi-2.19.0](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.19.0) (2023-08-20)

### Migration

- Migrate to core-2.44.0.

<a name="openapi-2.18.0"></a>
## [openapi-2.18.0](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.18.0) (2023-08-11)

### Migration

- Migrate to core-2.41.0.

<a name="openapi-2.16.0"></a>
## [openapi-2.16.0](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.16.0) (2023-01-12)

### BREAKING CHANGES

- Migrate to core-2.35.0.

<a name="openapi-2.15.0"></a>
## [openapi-2.15.0](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.15.0) (2023-01-07)

### BREAKING CHANGES

- Migrate to core-2.33.0.

<a name="openapi-2.14.0"></a>
## [openapi-2.14.0](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.14.0) (2023-01-03)

### BREAKING CHANGES

- Migrate to core-2.32.0.

<a name="openapi-2.13.0"></a>
## [openapi-2.13.0](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.13.0) (2022-12-29)

### BREAKING CHANGES

- Migrate to core-2.31.0.

<a name="openapi-2.12.0"></a>
## [openapi-2.12.0](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.12.0) (2022-12-28)

### BREAKING CHANGES

- Migrate to core-2.30.0.

<a name="openapi-2.11.0"></a>
## [openapi-2.11.0](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.11.0) (2022-12-26)

### BREAKING CHANGES

- Migrate to core-2.29.0.

<a name="openapi-2.10.0"></a>
## [openapi-2.10.0](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.10.0) (2022-12-07)

### BREAKING CHANGES

- Migrate to core-2.28.0.

<a name="openapi-2.9.4"></a>
## [openapi-2.9.4](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.9.4) (2022-10-19)

### Bug fix

- Fixed `Content` utilite.

<a name="openapi-2.9.3"></a>
## [openapi-2.9.3](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.9.3) (2022-10-09)

### Bug fix

- Fix deps for webpack.

<a name="openapi-2.9.2"></a>
## [openapi-2.9.2](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.9.2) (2022-10-08)

### Bug fix

- Fix deps for webpack.

<a name="openapi-2.9.1"></a>
## [openapi-2.9.1](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.9.1) (2022-10-07)

### Bug fix

- Fix deps for webpack.

<a name="openapi-2.9.0"></a>
## [openapi-2.9.0](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.9.0) (2022-10-07)

### Bug fix

- Migration to core-2.22.0.

<a name="openapi-2.8.2"></a>
## [openapi-2.8.2](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.8.2) (2022-09-28)

### Bug fix

- Fixed `Content` helper. If array has defined items, don't rewrite the items.

<a name="openapi-2.8.1"></a>
## [openapi-2.8.1](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.8.1) (2022-09-28)

### Bug fix

- Fixed `Content` helper in case with work an array in an array.

<a name="openapi-2.8.0"></a>
## [openapi-2.8.0](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.8.0) (2022-09-27)

### BREAKING CHANGES

- Changes second parameter for `@Property` decorator.

Before:

```ts
class Model1 {
  @Property({}, Model1)
  property1: Model1[];
}
```

After:

```ts
class Model1 {
  @Property({}, { array: Model1 })
  property1: Model1[];
}
```

### Features

- Added support for `enum` in type model:

```ts
class Model1 {
  @Property({}, { enum: NumberEnum })
  property1: number;
}
```

<a name="openapi-2.7.0"></a>
## [openapi-2.7.0](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.7.0) (2022-09-24)

### BREAKING CHANGES

- Renamed decorator `@Column` to `@Property`.

<a name="openapi-2.6.0"></a>
## [openapi-2.6.0](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.6.0) (2022-09-24)

### Features

- Added `REQUIRED` constant to ability marks required properties inside `requestBody`.
- Improvements `Content` helper to support required properties inside `requestBody`.

<a name="openapi-2.5.0"></a>
## [openapi-2.5.0](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.5.0) (2022-09-17)

### BREAKING CHANGES

- Migration to core-2.17.0

<a name="openapi-2.4.1"></a>
## [openapi-2.4.1](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.4.1) (2022-09-17)

### Bug fix

- make `ExtensionsMetaPerApp` optional for DI.

<a name="openapi-2.4.0"></a>
## [openapi-2.4.0](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.4.0) (2022-09-17)

### Features

- Added `oasOptions.yamlSchemaOptions` and `ExtensionsMetaPerApp`.

<a name="openapi-2.3.0"></a>
## [openapi-2.3.0](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.3.0) (2022-09-15)

### BREAKING CHANGES

- Removed default [path = ''](https://github.com/ditsmod/ditsmod/commit/352978d56) for `OpenapiModule.withParams()`, and now you can give `path` as second argument for `OpenapiModule.withParams()`.

<a name="openapi-2.2.2"></a>
## [openapi-2.2.2](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.2.2) (2022-09-07)

### Bug fix

- Fixed `providersPerMod` for `OpenapiModule`.

<a name="openapi-2.2.1"></a>
## [openapi-2.2.1](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.2.1) (2022-09-02)

### Bug fix

- Fixed `providersPerApp` and `providersPerMod` for `OpenapiModule`.

<a name="openapi-2.2.0"></a>
## [openapi-2.2.0](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.2.0) (2022-09-01)

### Features

- Added `OpenapiLogMediator`.

<a name="openapi-2.1.2"></a>
## [openapi-2.1.2](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.1.2) (2022-08-30)

### Improvements

- Removed useless log messages.

<a name="openapi-2.1.1"></a>
## [openapi-2.1.1](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.1.1) (2022-08-30)

### Improvements

- Removed warns from webpack.

<a name="openapi-2.1.0"></a>
## [openapi-2.1.0](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.1.0) (2022-08-27)

### BREAKING CHANGES

- Migration to Ditsmod v2.11.0.

<a name="openapi-2.0.0-next.0"></a>
## [openapi-2.0.0-next.0](https://github.com/ditsmod/ditsmod/releases/tag/openapi-2.0.0-next.0) (2021-11-20)

### BREAKING CHANGES

- Migration to Ditsmod v2 [223c863d](https://github.com/ditsmod/ditsmod/commit/223c863d).

<a name="openapi-1.1.0"></a>
## [openapi-1.1.0](https://github.com/ditsmod/ditsmod/releases/tag/openapi-1.1.0) (2021-10-29)

### Features

- Added ability for copying parameter's description from model schema's description [d465d779](https://github.com/ditsmod/ditsmod/commit/d465d779).

<a name="openapi-1.0.1"></a>
## [openapi-1.0.1](https://github.com/ditsmod/ditsmod/releases/tag/openapi-1.0.1) (2021-10-21)

### Bug fix

- Removed immutable for decorator's schema [b4be46dce](https://github.com/ditsmod/ditsmod/commit/b4be46dce).

<a name="openapi-1.0.0"></a>
## [openapi-1.0.0](https://github.com/ditsmod/ditsmod/releases/tag/openapi-1.0.0) (2021-05-23)

### Improvements

- set strict mode for tsconfig [ea07346](https://github.com/ditsmod/ditsmod/commit/ea07346).

<a name="openapi-beta.14"></a>
## [openapi-beta.14](https://github.com/ditsmod/ditsmod/releases/tag/openapi-beta.14) (2021-05-09)

### Features

- introduced OAS operation object as third argument for OasRoute [a21f176](https://github.com/ditsmod/ditsmod/commit/a21f176).

<a name="openapi-beta.13"></a>
## [openapi-beta.13](https://github.com/ditsmod/ditsmod/releases/tag/openapi-beta.13) (2021-05-07)

### BREAKING CHANGES

- drop `OasModuleWithParams` [4cefc8](https://github.com/ditsmod/ditsmod/commit/4cefc8).

### Features

- make `OasRoute` optional [76e01c](https://github.com/ditsmod/ditsmod/commit/76e01c).

<a name="openapi-beta.12"></a>
## [openapi-beta.12](https://github.com/ditsmod/ditsmod/releases/tag/openapi-beta.12) (2021-05-06)

### Features

- allow primitive types for model's arrays [132aa92f](https://github.com/ditsmod/ditsmod/commit/132aa92f).
- added support nested model [61bbf1cb](https://github.com/ditsmod/ditsmod/commit/61bbf1cb).
- added `parameters.describe()` helper [4f6f7f](https://github.com/ditsmod/ditsmod/commit/4f6f7f).
- improvement Content helper.

<a name="openapi-beta.11"></a>
## [openapi-beta.11](https://github.com/ditsmod/ditsmod/releases/tag/openapi-beta.11) (2021-05-01)

### BREAKING CHANGES

- moved `prefixParams` to `OasOptions` [2dbff8d](https://github.com/ditsmod/ditsmod/commit/2dbff8d).

### Features

- added `parameters.recursive()` and `parameters.bindTo()` [891768](https://github.com/ditsmod/ditsmod/blob/openapi-beta.11/packages/openapi/src/utils/parameters.ts#L68-L110).

<a name="openapi-beta.10"></a>
## [openapi-beta.10](https://github.com/ditsmod/ditsmod/releases/tag/openapi-beta.10) (2021-04-30)

### BREAKING CHANGES

- renamed `@Schema` to `@Column` [0adca0a](https://github.com/ditsmod/ditsmod/commit/0adca0a).

### Features

- added [basic media types](https://github.com/ditsmod/ditsmod/blob/5317c97/packages/openapi/src/types/media-types.ts).
- added [`Parameters`](https://github.com/ditsmod/ditsmod/blob/openapi-beta.10/packages/openapi/src/utils/parameters.ts) and [`Content`](https://github.com/ditsmod/ditsmod/blob/openapi-beta.10/packages/openapi/src/utils/content.ts) helpers, and shorthands for them - `getParams()` and `getContents()`.

<a name="openapi-beta.9"></a>
## [openapi-beta.9](https://github.com/ditsmod/ditsmod/releases/tag/openapi-beta.9) (2021-04-28)

### Features

- added `OpenapiPatchMetadataExtension`. [2374c1d](https://github.com/ditsmod/ditsmod/commit/2374c1d).
This extension allows you to distribute prefixParams for imported modules.

<a name="openapi-beta.8"></a>
## [openapi-beta.8](https://github.com/ditsmod/ditsmod/releases/tag/openapi-beta.8) (2021-04-27)

### Features

- added `OasModuleWithParams` interface [26a46f5](https://github.com/ditsmod/ditsmod/commit/26a46f5).
- introduced `prefixParams` [8bcf514](https://github.com/ditsmod/ditsmod/commit/8bcf514).

<a name="openapi-beta.7"></a>
## [openapi-beta.7](https://github.com/ditsmod/ditsmod/releases/tag/openapi-beta.7) (2021-04-27)

### BREAKING CHANGES

- make oas routes like core routes (with parameters like `path/:param`, not like `path/{param}`) [11e6d5](https://github.com/ditsmod/ditsmod/commit/11e6d5).

<a name="openapi-beta.6"></a>
## [openapi-beta.6](https://github.com/ditsmod/ditsmod/releases/tag/openapi-beta.6) (2021-04-27)

### Bug fix

- fixed prefixes for OasRoute's [45ce09c](https://github.com/ditsmod/ditsmod/commit/45ce09c).

<a name="openapi-beta.5"></a>
## [openapi-beta.5](https://github.com/ditsmod/ditsmod/releases/tag/openapi-beta.5) (2021-04-27)

### Features

- added ability to `setSecurityInfo()` for non-OasRoute [073a53c](https://github.com/ditsmod/ditsmod/commit/073a53c).

<a name="openapi-beta.4"></a>
## [openapi-beta.4](https://github.com/ditsmod/ditsmod/releases/tag/openapi-beta.4) (2021-04-26)

### BREAKING CHANGES

- now for `OasRoute` need pass `OperationObject` instead `PathItemObject`
[d5607af](https://github.com/ditsmod/ditsmod/commit/d5607af).

### Bug fix

- init `securitySchemes` only if is needed [4057bbb](https://github.com/ditsmod/ditsmod/commit/4057bbb).

<a name="openapi-beta.3"></a>
## [openapi-beta.3](https://github.com/ditsmod/ditsmod/releases/tag/openapi-beta.3) (2021-04-24)

### Features

- added `SwaggegrOAuthOptions` [310d4b27](https://github.com/ditsmod/ditsmod/commit/310d4b27).
