---
sidebar_position: 1
---

# Контролери та сервіси

## Що являє собою контролер

Контролери призначаються для прийому HTTP-запитів та відправки HTTP-відповідей.
TypeScript клас стає контролером Ditsmod завдяки декоратору `Controller`:

```ts
import { Controller } from '@ditsmod/core';

@Controller()
export class SomeController {}
```

Запити прив'язуються до методів контролерів через систему маршрутизації, з використанням декоратора
`Route`. В наступному прикладі створено два маршрути, що приймають `GET` запити за адресами
`/hello` та `/throw-error`:

```ts
import { Controller, Response, Route } from '@ditsmod/core';

@Controller()
export class SomeController {
  constructor(private res: Response) {}

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

1. В конструкторі класу за допомогою модифікатора доступу `private` оголошується властивість
класу `res` із типом даних `Response`. Таким чином ми просимо Ditsmod щоб він створив інстанс
класу `Response` і передав його у змінну `res`.
1. Маршрути створюються за допомогою декоратора `Route`, що ставиться перед методом класу.
1. Відповіді на HTTP-запити відправляються через `this.res.send()` (хоча `this.res` ще має
`sendJson()` та `sendText()`).
1. Об'єкти помилок можна кидати прямо в методі класу звичайним для JavaScript способом, тобто за
допомогою ключового слова `throw`.

:::tip Використовуйте модифікатор доступу
Модифікатор доступу в конструкторі може бути будь-яким (private, protected
або public), але взагалі без модифікатора - `res` вже буде простим параметром з видимістю лише
в конструкторі.
:::

:::caution Не забувайте імпортувати Request та Response
Якщо у конструкторі ви прописуєте клас `Request` чи `Response`, не забувайте
імпортувати їх із @ditsmod/core! Якщо ви цього не зробите, ваш застосунок перестане
працювати, хоча IDE може і не підказати, що у вас неімпортовані дані класи.

Справа в тому, що у TypeScript глобально оголошено інтерфейси з точно такими іменами - `Request`
та `Response`. Через це ваша IDE може лише сказати, що у цих інтерфейсів немає певних
властивостей, що повинні бути у класів, імпортованих з @ditsmod/core.
:::

## Оголошення контролера

Оголошувати контролер можна у будь-якому модулі, у масиві `controllers`:

```ts
import { Module } from '@ditsmod/core';

import { SomeController } from './first.controller';

@Module({
  controllers: [SomeController]
})
export class SomeModule {}
```

Щоб використовувати `pathParams`, `queryParams` чи `body`, у конструкторі контролера необхідно
запитати інстанс класу `Request`:

```ts
import { Controller, Request, Response, Route } from '@ditsmod/core';

@Controller()
export class SomeController {
  constructor(private req: Request, private res: Response) {}

  @Route('GET', 'hello/:userName')
  tellHello() {
    const { pathParams } = this.req;
    this.res.send(`Hello, ${pathParams.userName}`);
  }

  @Route('POST', 'some-url')
  tellHello() {
    const { body, queryParams } = this.req;
    this.res.sendJson(body, queryParams);
  }
}
```

Щойно в конструкторі ми отримали інстанси класів `Request` та `Response`, вони представляють собою
так звані сервіси.

## Сервіси

TypeScript клас стає сервісом Ditsmod завдяки декоратору `Injectable`:

```ts
import { Injectable } from '@ts-stack/di';

@Injectable()
export class SomeService {}
```

Зверніть увагу, що цей декоратор імпортується із `@ts-stack/di`, а не із `@ditsmod/core`.
Приклади сервісів в затосунках Ditsmod:

- сервіс надання конфігурації;
- сервіс роботи з базами даних, з поштою і т.п.;
- сервіс парсингу тіла HTTP-запиту;
- сервіс перевірки прав доступу;
- і т.д.

Часто одні сервіси залежать від інших сервісів, і щоб отримати інстанс певного сервіса,
необхідно указувати їхні класи в конструкторі:

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

Як бачите, правила отримання інстансу класу в сервісі такі ж самі, як і в контролері. Тобто, ми
в конструкторі за допомогою модифікатора доступу `private` оголошуємо властивість класу
`firstService` із типом даних `FirstService`. Інстанси в конструкторі створює
[DI][8].


[8]: https://uk.wikipedia.org/wiki/%D0%92%D0%BF%D1%80%D0%BE%D0%B2%D0%B0%D0%B4%D0%B6%D0%B5%D0%BD%D0%BD%D1%8F_%D0%B7%D0%B0%D0%BB%D0%B5%D0%B6%D0%BD%D0%BE%D1%81%D1%82%D0%B5%D0%B9
