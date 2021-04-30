<a name="openapi-beta.10"></a>
# [openapi-beta.10](https://github.com/ts-stack/ditsmod/releases/tag/openapi-beta.10) (2021-04-30)

### BREAKING CHANGES

- renamed `@Schema` to `@Column` [0adca0a](https://github.com/ditsmod/ditsmod/commit/0adca0a).

### Features

- added [basic media types](https://github.com/ditsmod/ditsmod/blob/5317c97/packages/openapi/src/types/media-types.ts).
- added [`Parameters`](https://github.com/ditsmod/ditsmod/blob/openapi-beta.10/packages/openapi/src/utils/parameters.ts) and [`Content`](https://github.com/ditsmod/ditsmod/blob/openapi-beta.10/packages/openapi/src/utils/content.ts) helpers, and shorthands for them - `getParams()` and `getContents()`.

<a name="openapi-beta.9"></a>
## [openapi-beta.9](https://github.com/ts-stack/ditsmod/releases/tag/openapi-beta.9) (2021-04-28)

### Features

- added `OpenapiPatchMetadataExtension`. [2374c1d](https://github.com/ditsmod/ditsmod/commit/2374c1d).
This extension allows you to distribute prefixParams for imported modules.

<a name="openapi-beta.8"></a>
## [openapi-beta.8](https://github.com/ts-stack/ditsmod/releases/tag/openapi-beta.8) (2021-04-27)

### Features

- added `OasModuleWithParams` interface [26a46f5](https://github.com/ditsmod/ditsmod/commit/26a46f5).
- introduced `prefixParams` [8bcf514](https://github.com/ditsmod/ditsmod/commit/8bcf514).

<a name="openapi-beta.7"></a>
## [openapi-beta.7](https://github.com/ts-stack/ditsmod/releases/tag/openapi-beta.7) (2021-04-27)

### BREAKING CHANGES

- make oas routes like core routes (with parameters like `path/:param`, not like `path/{param}`) [11e6d5](https://github.com/ditsmod/ditsmod/commit/11e6d5).

<a name="openapi-beta.6"></a>
## [openapi-beta.6](https://github.com/ts-stack/ditsmod/releases/tag/openapi-beta.6) (2021-04-27)

### Bug fix

- fixed prefixes for OasRoute's [45ce09c](https://github.com/ditsmod/ditsmod/commit/45ce09c).

<a name="openapi-beta.5"></a>
## [openapi-beta.5](https://github.com/ts-stack/ditsmod/releases/tag/openapi-beta.5) (2021-04-27)

### Features

- added ability to `setSecurityInfo()` for non-OasRoute [073a53c](https://github.com/ditsmod/ditsmod/commit/073a53c).

<a name="openapi-beta.4"></a>
## [openapi-beta.4](https://github.com/ts-stack/ditsmod/releases/tag/openapi-beta.4) (2021-04-26)

### BREAKING CHANGES

- now for `OasRoute` need pass `OperationObject` instead `PathItemObject`
[d5607af](https://github.com/ditsmod/ditsmod/commit/d5607af).

### Bug fix

- init `securitySchemes` only if is needed [4057bbb](https://github.com/ditsmod/ditsmod/commit/4057bbb).

<a name="openapi-beta.3"></a>
## [openapi-beta.3](https://github.com/ts-stack/ditsmod/releases/tag/openapi-beta.3) (2021-04-24)

### Features

- added `SwaggegrOAuthOptions` [310d4b27](https://github.com/ditsmod/ditsmod/commit/310d4b27).
