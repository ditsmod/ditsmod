---
sidebar_position: 1
---

# Контролери та сервіси

## Що являє собою контролер

Контролери призначаються для прийому HTTP-запитів та відправки HTTP-відповідей. TypeScript клас стає контролером Ditsmod завдяки декоратору `Controller`:

```ts
import { Controller } from '@ditsmod/core';

@Controller()
export class SomeController {}
```

Файли контролерів рекомендується називати із закінченням `*.controller.ts`, а імена їхніх класів - із закінченням `*Controller`.

<!--
Загалом, в декоратор `Controller` можна передавати об'єкт із такими властивостями:

```ts
import { Controller } from '@ditsmod/core';

@Controller({
  providersPerRou: [], // Провайдери на рівні роута
  providersPerReq: [] // Провайдери на рівні запиту
})
export class SomeController {}
```
-->

HTTP-запити прив'язуються до методів контролерів через систему маршрутизації, з використанням декоратора `Route`. В наступному прикладі створено два маршрути, що приймають `GET` запити за адресами `/hello` та `/throw-error`:

```ts
import { Controller, Res, Route } from '@ditsmod/core';

@Controller()
export class SomeController {
  constructor(private res: Res) {}

  @Route('GET', 'hello')
  tellHello() {
    this.res.send('Hello World!');
  }

  @Route('GET', 'throw-error')
  thrwoError() {
    throw new Error('Here some error occurred');
  }
}
```

Що ми тут бачимо:

1. В конструкторі класу за допомогою модифікатора доступу `private` оголошується властивість класу `res` із типом даних `Res`. Таким чином ми просимо Ditsmod щоб він створив інстанс класу `Res` і передав його у змінну `res`. До речі, `res` - це скорочення від слова _response_.
2. Маршрути створюються за допомогою декоратора `Route`, що ставиться перед методом класу, причому не важливо як саме називається цей метод.
3. Текстові відповіді на HTTP-запити відправляються через `this.res.send()`.
4. Об'єкти помилок можна кидати прямо в методі класу звичайним для JavaScript способом, тобто за допомогою ключового слова `throw`.

:::tip Використовуйте модифікатор доступу
Модифікатор доступу в конструкторі може бути будь-яким (private, protected або public), але взагалі без модифікатора - `res` вже буде простим параметром з видимістю лише в конструкторі.
:::

Щоб використовувати `pathParams`, `queryParams` чи `body`, у конструкторі контролера необхідно запитати інстанс класу `Req`:

```ts
import { Controller, Req, Res, Route } from '@ditsmod/core';

@Controller()
export class SomeController {
  constructor(private req: Req, private res: Res) {}

  @Route('GET', 'hello/:userName')
  getHello() {
    const { pathParams } = this.req;
    this.res.send(`Hello, ${pathParams.userName}`);
  }

  @Route('POST', 'some-url')
  postSomeUrl() {
    const { body, queryParams } = this.req;
    this.res.sendJson(body, queryParams);
  }
}
```

До речі, `req` - це скорочення від слова _request_.

Як бачите, щоб відправляти відповіді з об'єктами, необхідно використовувати метод `this.res.sendJson()` замість `this.res.send()` (бо він відправляє тільки текст).

В даному прикладі не показано, але пам'ятайте, що нативний Node.js об'єкт запиту знаходиться у `this.req.nodeReq`.

## Прив'язка контролера до модуля

Прив'язується контролер до модуля через масив `controllers`:

```ts
import { Module } from '@ditsmod/core';

import { SomeController } from './some.controller';

@Module({
  controllers: [SomeController]
})
export class SomeModule {}
```

Як у модулі централізовано додати певний префікс, ви можете проглянути у розділі [Експорт та імпорт модулів][1].

## Сервіси

Хоча з технічної точки зору, для обробки HTTP-запиту можна обійтись одним лише контролером, але об'ємний код із бізнес логікою краще виносити в окремі класи, щоб при потребі можна було повторно використовувати цей код. Ці окремі класи з бізнес логікою називаються _сервісами_.

Що можуть робити сервіси:

- надавати конфігурацію;
- робити валідацію запиту;
- робити парсинг тіла HTTP-запиту;
- перевіряти права доступу;
- парцювати з базами даних, з поштою:
- і т.п.

TypeScript клас стає сервісом Ditsmod завдяки декоратору `Injectable`:

```ts
import { Injectable } from '@ts-stack/di';

@Injectable()
export class SomeService {}
```

Файли сервісів рекомендується називати із закінченням `*.service.ts`, а їхні класи - із закінченням `*Service`.

Зверніть увагу, що цей декоратор імпортується із `@ts-stack/di`, а не із `@ditsmod/core`.

Часто одні сервіси залежать від інших сервісів, і щоб отримати інстанс певного сервіса, необхідно указувати його клас в конструкторі:

```ts
import { Injectable } from '@ts-stack/di';

import { FirstService } from './first.service';

@Injectable()
export class SecondService {
  constructor(private firstService: FirstService) {}

  methodOne() {
    this.firstService.doSomeThing();
  }
}
```

Як бачите, правила отримання інстансу класу в сервісі такі ж самі, як і в контролері. Тобто, ми в конструкторі за допомогою модифікатора доступу `private` оголошуємо властивість класу `firstService` із типом даних `FirstService`.

[1]: /core/exports-and-imports#імпорт-модуля
