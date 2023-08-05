---
sidebar_position: 1
---

# Роутер, контролери та сервіси

## Що робить роутер

Роутер має мапінг між URL та HTTP-обробником запиту. Хоча вам не прийдеться вручну писати цей мапінг, але для загального уявлення роботи роутера, у дуже спрощеному вигляді цей мапінг можна уявити так:

```ts
const routes = new Map<string, Function>();
routes.set('/one', function() { /** обробка запиту... **/ });
routes.set('/two', function() { /** обробка запиту... **/ });
routes.set('/three', function() { /** обробка запиту... **/ });
// ...
```

Зразу після того, як Node.js отримує HTTP-запит і передає його в Ditsmod, URL запиту розбивається на дві частини, які розділяються знаком питання (якщо він є). Перша частина завжди містить так званий _path_, а друга частина - _query-параметри_, якщо URL містить знак питання.

Задача роутера полягає в тому, щоб знайти обробник HTTP-запиту по _path_. Після чого, у більшості випадків, обробник запиту викликає метод контролера. У дуже спрощеному вигляді цей процес можна уявити так:

```ts
const path = '/two';
const handle = routes.get(path);
handle();
```

## Що являє собою контролер

TypeScript клас стає контролером Ditsmod завдяки декоратору `controller`:

```ts
import { controller } from '@ditsmod/core';

@controller()
export class SomeController {}
```

Файли контролерів рекомендується називати із закінченням `*.controller.ts`, а імена їхніх класів - із закінченням `*Controller`.

Як вже було сказано вище, після того, як роутер знайшов обробника HTTP-запиту, цей обробник може викликати метод контролера. Щоб це стало можливим, спочатку HTTP-запити прив'язуються до методів контролерів через систему маршрутизації, з використанням декоратора `route`. В наступному прикладі створено єдиний маршрут, що приймає `GET` запит за адресою `/hello`:

```ts {5}
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
2. В методі класу оголошується параметр `res` з типом даних `Res`. Таким чином ми просимо Ditsmod щоб він створив інстанс класу `Res` і передав його у відповідну змінну. До речі, `res` - це скорочення від слова _response_.
3. Текстові відповіді на HTTP-запити відправляються через `res.send()`.

Хоча в попередньому прикладі інстанс класу `Res` запитувався через `method1()`, але аналогічним чином ми можемо запитати цей інстанс і в конструкторі:

```ts {5}
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

Щоб отримати `pathParams` чи `queryParams` доведеться скористатись декоратором `inject` та токенами `PATH_PARAMS` і `QUERY_PARAMS`:

```ts {7-8}
import { controller, Res, route, inject, AnyObj, PATH_PARAMS, QUERY_PARAMS } from '@ditsmod/core';

@controller()
export class SomeController {
  @route('POST', 'some-url/:param1/:param2')
  postSomeUrl(
    @inject(PATH_PARAMS) pathParams: AnyObj,
    @inject(QUERY_PARAMS) queryParams: AnyObj,
    res: Res
  ) {
    res.sendJson(pathParams, queryParams);
  }
}
```

Більше інформації про те, що таке **токен** та що саме робить декоратор `inject` ви можете отримати з розділу [Dependecy Injection][4].

Як бачите з попереднього прикладу, щоб відправляти відповіді з об'єктами, необхідно використовувати метод `res.sendJson()` замість `res.send()` (бо він відправляє тільки текст).

Рідні Node.js об'єкти запиту та відповіді можна отримати за токенами відповідно - `NODE_REQ` та `NODE_RES`:

```ts {6-7}
import { controller, route, inject, NODE_REQ, NODE_RES, NodeRequest, NodeResponse } from '@ditsmod/core';

@controller()
export class HelloWorldController {
  constructor(
    @inject(NODE_REQ) private nodeReq: NodeRequest,
    @inject(NODE_RES) private nodeRes: NodeResponse
  ) {}

  @route('GET', 'hello')
  method1() {
    this.nodeRes.end('Hello World!');
  }
}
```

Вас також може зацікавити [як можна отримати тіло HTTP-запиту][5].

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

Більш докладну інформацію ви можете прочитати у розділі [Експорт, імпорт та прикріплення модулів][1].

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

```ts {7}
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

Щоб можна було користуватись новоствореними класами сервісів, їх потрібно передати у метадані **поточного** модуля чи контролера. Передати сервіс у метадані модуля можна наступним чином:

```ts {6}
import { featureModule } from '@ditsmod/core';
import { SomeService } from './some.service';

@featureModule({
  providersPerReq: [
    SomeService
  ],
})
export class SomeModule {}
```

Аналогічно сервіс передається у метадані контролера:

```ts {6}
import { controller, route, Res } from '@ditsmod/core';
import { SomeService } from './some.service';

@controller({
  providersPerReq: [
    SomeService
  ],
})
export class SomeController {
  @route('GET', 'hello')
  method1(res: Res, someService: SomeService) {
    res.send(someService.sayHello());
  }
}
```

В останніх двох прикладах сервіс передається у масив `providersPerReq`, але це не єдиний спосіб передачі сервісів. Більш докладну інформацію про правила роботи з DI можна отримати у розділі [Dependency Injection][7].

[1]: /components-of-ditsmod-app/exports-and-imports#імпорт-модуля
[2]: /components-of-ditsmod-app/exports-and-imports#ModuleWithParams
[3]: /components-of-ditsmod-app/dependency-injection#провайдери
[4]: /components-of-ditsmod-app/dependency-injection#токен-залежності
[5]: /native-modules/body-parser#використання
[6]: https://github.com/ditsmod/ditsmod/blob/core-2.38.1/packages/core/src/services/pre-router.ts
[7]: /components-of-ditsmod-app/dependency-injection
