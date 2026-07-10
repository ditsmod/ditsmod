---
sidebar_position: 12
---

# `ProviderBuilder` helper

This class simplifies the addition of providers to DI while simultaneously controlling their types. Since this class implements the so-called [Iteration protocols][1], it facilitates the conversion of itself into an array (note the spread operator):

```ts {9}
import { ProviderBuilder } from '@ditsmod/core';
import { restModule } from '@ditsmod/rest';
// ...
@restModule({
  // ...
  providersPerRou: [
    Provider1,
    Provider2,
    ...new ProviderBuilder().useValue<CorsOptions>(CorsOptions, { origin: 'https://example.com' }),
    // ...
  ],
  // ...
})
export class SomeModule {}
```

Starting from v2.55, Ditsmod allows passing an instance of `ProviderBuilder` directly into the `providersPer*` properties of the module or controller metadata:

```ts
import { ProviderBuilder } from '@ditsmod/core';
import { restModule } from '@ditsmod/rest';
// ...
@restModule({
  // ...
  providersPerRou: new ProviderBuilder()
    .passThrough(Provider1)
    .passThrough(Provider2)
    .useValue<CorsOptions>(CorsOptions, { origin: 'https://example.com' }),
  // ...
})
export class SomeModule {}
```

The `providers.passThrough()` method allows providers to be passed without type checking; it is intended for passing classes as providers.

In addition, `ProviderBuilder` has a special method `$if()`, which allows providers to be passed only if it receives a truthy value:

```ts {8}
import { ProviderBuilder } from '@ditsmod/core';
import { restModule } from '@ditsmod/rest';
// ...
@restModule({
  // ...
  providersPerRou: new ProviderBuilder()
    .passThrough(Provider1)
    .$if(false)
    .passThrough(Provider2)
    .passThrough(Provider3),
  // ...
})
export class SomeModule {}
```

In this case, `Provider2` will not be passed to DI, while `Provider1` and `Provider3` will be passed. That is, `$if()` applies only to the first expression immediately following it.

The `providers.$use()` method allows creating plugins (or middlewares) to extend the functionality of `ProviderBuilder`:

```ts {2,11,21-22}
class Plugin1 extends ProviderBuilder {
  method1() {
    if (this.true) {
      // ...
    }
    return this.self;
  }
}

class Plugin2 extends ProviderBuilder {
  method2() {
    if (this.true) {
      // ...
    }
    return this.self;
  }
}

const providers = [...new ProviderBuilder()
  .$use(Plugin1, Plugin2)
  .method1()
  .method2()
  .useLogConfig({ level: 'trace' })
  .useClass(SomeService, ExtendedService)];
```

[1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
