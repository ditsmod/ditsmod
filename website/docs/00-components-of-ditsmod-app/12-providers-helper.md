---
sidebar_position: 12
---

# Хелпер `Providers`

Даний клас спрощує додавання провайдерів до DI з одночасним контролем їх типів. Оскільки даний клас впроваджує так званий [Iteration protocols][1], це спрощує перетворення його на масив (зверніть увагу на трикрапку):

```ts {8}
import { featureModule, Providers } from '@ditsmod/core';
// ...
@featureModule({
  // ...
  providersPerRou: [
    Provider1,
    Provider2,
    ...new Providers().useValue<CorsOptions>(CorsOptions, { origin: 'https://example.com' }),
    // ...
  ],
  // ...
})
export class SomeModule {}
```

Починаючи з v2.55, Ditsmod дозволяє передавати інстанс `Providers` безпосередньо у властивості `providersPer*` метаданих модуля чи контролера:

```ts
import { featureModule, Providers } from '@ditsmod/core';
// ...
@featureModule({
  // ...
  providersPerRou: new Providers()
    .passThrough(Provider1)
    .passThrough(Provider2)
    .useValue<CorsOptions>(CorsOptions, { origin: 'https://example.com' }),
  // ...
})
export class SomeModule {}
```

Метод `providers.passThrough()` пропускає провайдери без перевірки типів, він призначається для передачі класів у якості провайдерів.

Окрім цього, `Providers` має спеціальний метод `$if()`, що дозволяє передавати провайдери лише у випадку, якщо він отримує правдиве значення:

```ts {7}
import { featureModule, Providers } from '@ditsmod/core';
// ...
@featureModule({
  // ...
  providersPerRou: new Providers()
    .passThrough(Provider1)
    .$if(false)
    .passThrough(Provider2)
    .passThrough(Provider3),
  // ...
})
export class SomeModule {}
```

В даному разі `Provider2` не буде передаватись до DI, тоді як `Provider1` та `Provider3` будуть передаватись. Тобто `$if()` діє лише для першого виразу, що йде зразу після нього.

Метод `providers.$use()` дозволяє створювати плагіни (чи middleware) для розширення функціональності `Providers`:

```ts {2,11,21-22}
class Plugin1 extends Providers {
  method1() {
    if (this.true) {
      // ...
    }
    return this.self;
  }
}

class Plugin2 extends Providers {
  method2() {
    if (this.true) {
      // ...
    }
    return this.self;
  }
}

const providers = [...new Providers()
  .$use(Plugin1, Plugin2)
  .method1()
  .method2()
  .useLogConfig({ level: 'trace' })
  .useClass(SomeService, ExtendedService)];
```

[1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
