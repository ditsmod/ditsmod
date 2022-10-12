---
sidebar_position: 4
title: Return listener
---

# @ditsmod/return

Модуль `@ditsmod/return` дозволяє відправляти HTTP-відповідь за допомогою оператора `return` у межах метода, що прив'язується до конкретного роута:

```ts
import { Controller, Route } from '@ditsmod/core';

@Controller()
export class HelloWorldController {
  @Route('GET')
  async tellHello() {
    return 'Hello World!\n';
  }
}
```

## Встановлення та підключення

Встановлення:

```bash
yarn add @ditsmod/return
```

При імпорті `ReturnModule` потрібно ще й [вирішувати колізію][2] в масиві `resolvedCollisionsPerReq`, оскільки `ReturnModule` підміняє провайдер для токена `HttpBackend`, який також під капотом підміняється у `@ditsmod/core`:

```ts
import { HttpBackend, RootModule } from '@ditsmod/core';
import { ReturnModule } from '@ditsmod/return';

@RootModule({
  imports: [
    ReturnModule
    // ...
  ],
  resolvedCollisionsPerReq: [
    [HttpBackend, ReturnModule]
  ],
  exports: [ReturnModule],
  // ...
})
export class AppModule {}
```

Як бачите, окрім імпорта, відбувається ще й експорт `ReturnModule` в кореневому модулі щоб функціональність, яку надає модуль `ReturnModule`, була доступна для будь-якого контролера.

Якщо ви хочете щоб така функціональність була доступною тільки в окремому модулі, можете проглянути [готовий приклад у репозиторії Ditsmod][3].




[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/18-return
[2]: ../00-components-of-ditsmod-app/06-providers-collisions.md
[3]: https://github.com/ditsmod/ditsmod/tree/main/examples/18-return
