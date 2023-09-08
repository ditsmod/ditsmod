<a name="core-2.48.0"></a>
# [core-2.48.0](https://github.com/ditsmod/ditsmod/releases/tag/core-2.48.0) (2023-09-07)

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
