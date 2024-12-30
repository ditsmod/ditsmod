<a name="routing-2.7.0"></a>
# [routing-2.7.0](https://github.com/ditsmod/ditsmod/releases/tag/routing-2.7.0) (2024-10-28)

| Commit | Type | Description |
| -- | -- | -- |
| [23793e9b50](https://github.com/ditsmod/ditsmod/commit/23793e9b50ff582048c) | refactor | removed `DecoratorMetadata`. |
| [82fcfcbe1d](https://github.com/ditsmod/ditsmod/commit/82fcfcbe1d2fc4a91f1a) | refactor | refactoring `RoutesExtension` to use instance of `ClassMetaIterator`. |

<a name="routing-2.6.0"></a>
# [routing-2.6.0](https://github.com/ditsmod/ditsmod/releases/tag/routing-2.6.0) (2024-10-21)

| Commit | Type | Description |
| -- | -- | -- |
| [1f96386c5b](https://github.com/ditsmod/ditsmod/commit/1f96386c5b58b998) | refactor | migration to core-2.60.0. |

<a name="routing-2.5.1"></a>
## [routing-2.5.1](https://github.com/ditsmod/ditsmod/releases/tag/routing-2.5.1) (2024-10-02)

| Commit | Type | Description |
| -- | -- | -- |
| [7ba1baa1be](https://github.com/ditsmod/ditsmod/commit/7ba1baa1bea0e6173) | fix | added `CTX_DATA` to ignore list for `checkDeps()`. |

<a name="routing-2.5.0"></a>
## [routing-2.5.0](https://github.com/ditsmod/ditsmod/releases/tag/routing-2.5.0) (2024-09-29)

| Commit | Type | Description |
| -- | -- | -- |
| [c807842941](https://github.com/ditsmod/ditsmod/commit/c8078429411929d520) | refactor | fixed logic with guards. |

<a name="routing-2.4.1"></a>
## [routing-2.4.1](https://github.com/ditsmod/ditsmod/releases/tag/routing-2.4.1) (2024-08-20)

| Commit | Type | Description |
| -- | -- | -- |
| [0a713a9a39](https://github.com/ditsmod/ditsmod/commit/0a713a9a39273b) | refactor | refactoring `PreRouterExtension`. |

<a name="routing-2.3.0"></a>
## [routing-2.3.0](https://github.com/ditsmod/ditsmod/releases/tag/routing-2.3.0) (2024-08-06)

| Commit | Type | Description |
| -- | -- | -- |
| [a26b4f7ef7](https://github.com/ditsmod/ditsmod/commit/a26b4f7ef75d99805) | fix | fixed `ControllerRawMetadatar`. |
| [607859ef67](https://github.com/ditsmod/ditsmod/commit/607859ef677ddd728) | fix | added `exportedOnly` for extensions. |


<a name="routing-2.2.0"></a>
## [routing-2.2.0](https://github.com/ditsmod/ditsmod/releases/tag/routing-2.2.0) (2024-04-02)

| Commit | Type | Description |
| -- | -- | -- |
| [1e24034583](https://github.com/ditsmod/ditsmod/commit/1e24034583f5ccb6afa27f75ded6a178310a83ae) | refactor | apply RequestContext as ValueProvider. |
| [51f3286c86](https://github.com/ditsmod/ditsmod/commit/51f3286c860e3266c5ad6cd6191603970a69aa90) | refactor | added `PreparedRouteMeta`. |
| [464868587c](https://github.com/ditsmod/ditsmod/commit/464868587c2ba6ccff9b1739d7095e84816ac250) | refactor | renamed `RouterLogMediator` to `RouterErrorMediator`. |
| [27a5320f28](https://github.com/ditsmod/ditsmod/commit/27a5320f28a5d6ddb4e8660168303150404b5a4f) | refactor | rename `SingletonChainMaker` to `DefaultSingletonChainMaker`. |
| [e017512910](https://github.com/ditsmod/ditsmod/commit/e017512910bdb5448f9416c1bed359074e9fa836) | refactor | rename `SingletonHttpErrorHandler` to `DefaultCtxHttpErrorHandler`. |

<a name="routing-2.1.1"></a>
## [routing-2.1.1](https://github.com/ditsmod/ditsmod/releases/tag/routing-2.1.1) (2024-02-04)

### Bug fix

- Before this fix, the controllers singletons is created onece per each route. Now controllers singletons created only once.

<a name="routing-2.1.0"></a>
# [routing-2.1.0](https://github.com/ditsmod/ditsmod/releases/tag/routing-2.1.0) (2023-10-07)

### Features

- Introduced `@guard()` decorator.

<a name="routing-2.0.1"></a>
## [routing-2.0.1](https://github.com/ditsmod/ditsmod/releases/tag/routing-2.0.1) (2023-10-03)

### Bug fixes

- Added support for sigleton HTTP interceptors.
