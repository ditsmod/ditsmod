---
sidebar_position: 1
---

# Контролери та сервіси

## Що являє собою контролер

Контролери призначаються для прийому HTTP-запитів та відправки HTTP-відповідей. TypeScript клас стає контролером Ditsmod завдяки декоратору `controller`:

```ts
import { controller } from '@ditsmod/core';

@controller()
export class SomeController {}
```

Файли контролерів рекомендується називати із закінченням `*.controller.ts`, а імена їхніх класів - із закінченням `*Controller`.

<!--
Загалом, в декоратор `controller` можна передавати об'єкт із такими властивостями:

```ts
import { controller } from '@ditsmod/core';

@controller({
  providersPerRou: [], // Провайдери на рівні роута
  providersPerReq: [] // Провайдери на рівні запиту
})
export class SomeController {}
```
-->

HTTP-запити прив'язуються до методів контролерів через систему маршрутизації, з використанням декоратора `route`. В наступному прикладі створено єдиний маршрут, що приймає `GET` запит за адресою `/hello`:

```ts
import { controller, route, Res } from '@ditsmod/core';

@controller()
export class HelloWorldController {
  @route('GET', 'hello')
  method1(res: Res) {
    res.send('Hello World!');
  }
}
```

Що ми тут бачимо:

1. Маршрут створюється за допомогою декоратора `route`, що ставиться перед методом класу, причому не важливо як саме називається цей метод.
2. В методі класу оголошується параметр `res` з типом даних `Res`. Таким чином ми просимо Ditsmod щоб він створив інстанс `Res` і передав його у відповідну змінну. До речі, `res` - це скорочення від слова _context_.
3. Текстові відповіді на HTTP-запити відправляються через `res.send()`.

Хоча в попередньому прикладі інстанс `Res` запитувався у `method1()`, але аналогічним чином ми можемо використати й конструктор:

```ts
import { controller, route, Res } from '@ditsmod/core';

@controller()
export class HelloWorldController {
  constructor(private res: Res) {}

  @route('GET', 'hello')
  method1() {
    this.res.send('Hello World!');
  }
}
```

Звичайно ж, у параметрах можна запитувати й інші інстанси класів, причому послідовність параметрів є неважливою.

:::tip Використовуйте модифікатор доступу
Модифікатор доступу в конструкторі може бути будь-яким (private, protected або public), але взагалі без модифікатора - `res` вже буде простим параметром з видимістю лише в конструкторі.
:::

Наступним чином можна отримати `pathParams`, `queryParams` чи `body`:

```ts
import { controller, Res, route, inject, AnyObj, PATH_PARAMS, QUERY_PARAMS } from '@ditsmod/core';
import { HTTP_BODY } from '@ditsmod/body-parser';

@controller()
export class SomeController {
  @route('POST', 'some-url')
  postSomeUrl(
    @inject(PATH_PARAMS) pathParams: AnyObj,
    @inject(QUERY_PARAMS) queryParams: AnyObj,
    @inject(HTTP_BODY) body: any,
    res: Res
  ) {
    res.sendJson(body, queryParams);
  }
}
```

Як бачите, щоб відправляти відповіді з об'єктами, необхідно використовувати метод `res.sendJson()` замість `res.send()` (бо він відправляє тільки текст).

Рідний Node.js об'єкт запиту та відповіді можна отримати за токенами відповідно - `NODE_REQ` та `NODE_RES`:

```ts
import { controller, route, inject, NODE_REQ, NODE_RES, NodeRequest, NodeResponse } from '@ditsmod/core';

@controller()
export class HelloWorldController {
  constructor(
    @inject(NODE_REQ) private nodeReq: NodeRequest,
    @inject(NODE_RES) private nodeRes: NodeResponse,
  ) {}

  @route('GET', 'hello')
  method1() {
    this.nodeRes.end('Hello World!');
  }
}
```

Більше інформації про токени та декоратор `inject` ви можете отримати з розділу [Dependecy Injection][4].

## Прив'язка контролера до модуля

Прив'язується контролер до модуля через масив `controllers`:

```ts {6}
import { featureModule } from '@ditsmod/core';

import { SomeController } from './some.controller';

@featureModule({
  controllers: [SomeController]
})
export class SomeModule {}
```

Після прив'язки контролерів до модуля, щоб Ditsmod брав до уваги ці контролери, даний модуль потрібно або прикріпити, або імпортувати в об'єкті, що має інтерфейс [ModuleWithParams][2]. В наступному прикладі показано і прикріплення, і повний імпорт модуля (це зроблено лише щоб продемонструвати можливість, на практиці немає сенсу робити одночасне прикріплення з імпортом):

```ts {6-8}
import { featureModule } from '@ditsmod/core';

import { SomeModule } from './some.module';

@featureModule({
  appends: [SomeModule],
  // АБО
  imports: [{ path: 'some-prefix', module: SomeModule }]
})
export class OtherModule {}
```

Більш докладну інформацію ви можете прочитати у розділі [Експорт та імпорт модулів][1].

## Сервіси

Хоча з технічної точки зору, для обробки HTTP-запиту можна обійтись одним лише контролером, але об'ємний код з бізнес логікою краще виносити в окремі класи, щоб при потребі можна було повторно використовувати цей код, і щоб його можна було простіше тестувати. Ці окремі класи з бізнес логікою, як правило, називають _сервісами_.

Що можуть робити сервіси:

- надавати конфігурацію;
- робити валідацію запиту;
- робити парсинг тіла запиту;
- перевіряти права доступу;
- парцювати з базами даних, з поштою;
- і т.п.

TypeScript клас стає сервісом Ditsmod завдяки декоратору `injectable`:

```ts
import { injectable } from '@ditsmod/core';

@injectable()
export class SomeService {}
```

Файли сервісів рекомендується називати із закінченням `*.service.ts`, а їхні класи - із закінченням `*Service`.

Часто одні сервіси залежать від інших сервісів, і щоб отримати інстанс певного сервісу, необхідно указувати його клас в конструкторі:

```ts
import { injectable } from '@ditsmod/core';

import { FirstService } from './first.service';

@injectable()
export class SecondService {
  constructor(private firstService: FirstService) {}

  methodOne() {
    this.firstService.doSomeThing();
  }
}
```

Як бачите, правила отримання інстансу класу в конструкторі такі ж, як і в контролерах: за допомогою модифікатора доступу `private` оголошуємо властивість класу `firstService` з типом даних `FirstService`.

Зверніть увагу, що запитувати залежності у параметрах _методів_ сервісів можна, але, по-перше, перед даними методами потрібно використовувати будь-який декоратор для властивостей класу (наприклад `@methodFactory()`), а по-друге - ці методи потрібно використати у провайдері з властивістю [useFactory][3].


[1]: /components-of-ditsmod-app/exports-and-imports#імпорт-модуля
[2]: /components-of-ditsmod-app/exports-and-imports#ModuleWithParams
[3]: /components-of-ditsmod-app/dependency-injection#провайдер
[4]: /components-of-ditsmod-app/dependency-injection#токен-залежності
