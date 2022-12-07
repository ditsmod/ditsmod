---
sidebar_position: 5
title: Слухач return
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

Якщо ви хочете щоб така функціональність була доступною тільки в окремому модулі, можете проглянути [готовий приклад у репозиторії Ditsmod][1].

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

## HTTP статуси та заголовки

По дефолту, інтерсептор в модулі `@ditsmod/return` автоматично підставляє 201-ий статус для запитів з HTTP-методом `POST`, 204-ий - для `OPTIONS`, і 200-ий статус - для решти. Якщо вам потрібно змінити цю поведінку, варто використовувати стандартний механізм (без використання оператора `return`):

```ts
import { Controller, Res, Route, Status } from '@ditsmod/core';

@Controller()
export class UsersController {
  constructor(private res: Res) {}

  @Route('GET')
  getUsersList() {
    // ...
    this.res.sendJson({ error: 'Page not found' }, Status.NOT_FOUND);
  }
}
```




[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/18-return
[2]: /00-components-of-ditsmod-app/06-providers-collisions.md
