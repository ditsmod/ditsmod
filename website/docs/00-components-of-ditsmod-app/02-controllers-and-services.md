---
sidebar_position: 3
---

# Роутер, контролери та сервіси

## Що робить роутер {#what-does-a-router-do}

Роутер має мапінг між URL та відповідним обробником запиту. Наприклад, коли користувач вашого вебсайту з браузера запитує адресу `/some-path` чи `/other-path`, чи `/path-with/:parameter` і т.д. - таким чином він повідомляє Ditsmod-застосунок, що хоче отримати певний ресурс, або хоче здійснити певну зміну на сайті. Щоб Ditsmod-застосунок знав, що саме треба робити в даних випадках, у його коді потрібно прописувати відповідні обробники запитів. Тобто, якщо запитують `/some-path`, значить треба виконати певну функцію; якщо запитують `/other-path`, значить треба виконати іншу функцію і т.д. Коли прописують подібну відповідність між адресою та її обробником - це і є процес створення мапінгу між URL та відповідним обробником запиту.

Хоча вам не прийдеться вручну писати цей мапінг, але для загального уявлення роботи роутера, у дуже спрощеному вигляді його можна уявити так:

```ts
const routes = new Map<string, Function>();
routes.set('/some-path', function() { /** обробка запиту... **/ });
routes.set('/other-path', function() { /** обробка запиту... **/ });
routes.set('/path-with/:parameter', function() { /** обробка запиту... **/ });
// ...
```

Зразу після того, як Node.js отримує HTTP-запит і передає його в Ditsmod, URL запиту розбивається на дві частини, які розділяються знаком питання (якщо він є). Перша частина завжди містить так званий _path_, а друга частина - _query-параметри_, якщо URL містить знак питання.

Задача роутера полягає в тому, щоб знайти обробник HTTP-запиту по _path_. У дуже спрощеному вигляді цей процес можна уявити так:

```ts
const path = '/some-path';
const handle = routes.get(path);

// ...
// І потім цей обробник викликається у функції, що прослуховує HTTP-запити.
if (handle) {
  handle();
}
```

У більшості випадків, обробник запиту викликає метод контролера. 

## Що являє собою контролер {#what-is-a-controller}

Мапінг між URL та обробником запиту формується на основі метаданих, які закріпляються за методами контролерів. TypeScript клас стає контролером Ditsmod завдяки декоратору `controller`:

```ts {3}
import { controller, route } from '@ditsmod/rest';

@controller()
export class SomeController {
  @route('GET', 'hello')
  method1() {
    // ...
  }
}
```

Файли контролерів рекомендується називати із закінченням `*.controller.ts`, а імена їхніх класів - із закінченням `*Controller`.

Як видно з попереднього прикладу, будь-який контролер повинен мати:

1. метод класу, який буде викликатись під час HTTP-запиту;
2. назву HTTP-методу (`GET`, `POST`, `PATCH` і т.д.);
3. URL до якого буде прив'язуватись виклик метода класу (опціонально).

Комбінація другого та третього пункту повинна бути унікальною на весь застосунок. Тобто, якщо ви один раз визначили що `GET` + `/hello` будуть прив'язані до певного методу контролера, то другий раз ця сама комбінація не повинна повторюватись. В противному разі, модуль `@ditsmod/rest` кине помилку з відповідним повідомленням.

Ditsmod забезпечує роботу контролерів у двох альтернативних режимах, які зокрема відрізняються механізмом передачі HTTP-запиту у метод контролера:

1. **Injector-scoped контролер** (по-дефолту). Метод контролера може отримувати довільну кількість аргументів від [DI-інжектора][3]. Серед цих аргументів може бути HTTP-запит.
2. **Context-scoped контролер**. Метод контролера отримує єдиний аргумент - контекст запиту, який зокрема містить HTTP-запит.

Перший режим більш зручний і більш безпечний, коли потрібно працювати в контексті поточного HTTP-запиту (клієнт надає певний ідентифікатор, який необхідно враховувати для формування відповіді). Другий режим роботи помітно швидший (приблизно на 15-20%) і споживає менше пам'яті, але контекст запиту не можна зберігати у властивостях інстансу контролера, бо цей інстанс може одночасно використовуватись для інших клієнтів.

### Injector-scoped контролер {#injector-scoped-controller}

По-дефолту, Ditsmod працює з контролером у injector-scoped режимі. Це означає, по-перше, що для кожного HTTP-запиту буде створюватись окремий інстанс контролеру. По-друге, будь-який метод контролера, який має декоратор `route`, буде отримувати довільну кількість аргументів від [DI-інжектора][3]. В наступному прикладі створено єдиний маршрут, що приймає `GET` запит за адресою `/hello`:

```ts {7}
import { controller, route, Res } from '@ditsmod/rest';
import { Service1 } from './service-1';
import { Service2 } from './service-2';

@controller()
export class HelloWorldController {
  @route('GET', 'hello')
  method1(service1: Service1, service2: Service2, res: Res) {
    // Working with service1 and service2
    // ...
    res.send('Hello, World!');
  }
}
```

Що ми тут бачимо:

1. Маршрут створюється за допомогою декоратора `route`, що ставиться перед методом класу, причому не важливо як саме називається цей метод.
2. В даному режимі контролера, у методі класу можна оголосити довільну кількість параметрів. У даному разі ми оголосили три параметри: `service1` з типом даних `Service1`, `service2` з типом даних `Service2`, та `res` з типом даних `Res`. Таким чином ми просимо Ditsmod щоб він створив інстанси класів, відповідно до їх типів, і передав їх у відповідні змінні. До речі, `res` - це скорочення від слова _response_.
3. Текстові відповіді на HTTP-запити відправляються через `res.send()`.

Хоча в попередньому прикладі інстанси класів запитувались через `method1`, але аналогічним чином ми можемо запитати ці інстанси і в конструкторі:

```ts {7}
import { controller, Res, route } from '@ditsmod/rest';
import { Service1 } from './service-1';
import { Service2 } from './service-2';

@controller()
export class HelloWorldController {
  constructor(private service1: Service1, private service2: Service2, private res: Res) {}

  @route('GET', 'hello')
  method1() {
    // Working with this.service1 and this.service2
    // ...
    this.res.send('Hello, World!');
  }
}
```

Звичайно ж, у параметрах можна запитувати й інші інстанси класів, причому послідовність параметрів є неважливою.

:::tip Використовуйте модифікатор доступу
Модифікатор доступу в конструкторі може бути будь-яким (private, protected або public), але взагалі без модифікатора - параметри матимуть видимість лише в конструкторі (вони не будуть доступними в методах).
:::

#### Параметри в роутінгу {#routing-parameters}

Щоб передати path-параметри для роутера, необхідно використовувати двокрапку перед іменем параметра. Наприклад, в URL `some-url/:param1/:param2` передано два path-параметри. Якщо для роутінгу ви використовуєте модуль `@ditsmod/rest`, лише path-параметри визначають роути, а query-параметри не беруться до уваги.

Щоб отримати path-параметри чи query-параметри, доведеться скористатись декоратором `inject` та токенами `PATH_PARAMS` і `QUERY_PARAMS`:

```ts {8-9}
import { inject, AnyObj } from '@ditsmod/core';
import { controller, route, PATH_PARAMS, QUERY_PARAMS } from '@ditsmod/rest';

@controller()
export class SomeController {
  @route('GET', 'some-url/:param1/:param2')
  method1(
    @inject(PATH_PARAMS) pathParams: AnyObj,
    @inject(QUERY_PARAMS) queryParams: AnyObj
  ) {
    return ({ pathParams, queryParams });
  }
}
```

Більше інформації про те, що таке **токен** та що саме робить декоратор `inject` ви можете отримати з розділу [Dependecy Injection][3].

Як бачите з попереднього прикладу, відповіді на HTTP-запити також можна відправляти завдяки звичайному `return`.

Рідні Node.js об'єкти запиту та відповіді можна отримати за токенами відповідно - `RAW_REQ` та `RAW_RES`:

```ts {7-8}
import { inject } from '@ditsmod/core';
import { controller, route, RAW_REQ, RAW_RES, RawRequest, RawResponse } from '@ditsmod/rest';

@controller()
export class HelloWorldController {
  constructor(
    @inject(RAW_REQ) private rawReq: RawRequest,
    @inject(RAW_RES) private rawRes: RawResponse
  ) {}

  @route('GET', 'hello')
  method1() {
    this.rawRes.end('Hello, World!');
  }
}
```

Вас також може зацікавити [як можна отримати тіло HTTP-запиту][5].

### Context-scoped контролер {#context-scoped-controller}

Щоб контролер працював в режимі context-scoped, в його метаданих потрібно вказати `{ scope: 'ctx' }`. Через те, що інстанс контролера у цьому режимі створюється єдиний раз, ви не зможете запитувати у його конструкторі інстанси класів, які створюються за кожним запитом. Наприклад, якщо в конструкторі ви запросите інстанс класу `Res`, Ditsmod кине помилку:

```ts {3,5}
import { RequestContext, controller, route } from '@ditsmod/rest';

@controller({ scope: 'ctx' })
export class HelloWorldController {
  constructor(private res: Res) {}

  @route('GET', 'hello')
  method1() {
    this.res.send('Hello, World!');
  }
}
```

Робочий варіант буде таким:

```ts {3,6}
import { controller, RequestContext, route } from '@ditsmod/rest';

@controller({ scope: 'ctx' })
export class HelloWorldController {
  @route('GET', 'hello')
  method1(ctx: RequestContext) {
    ctx.send('Hello, World!');
  }
}
```

В режимі "context-scoped", методи контролерів, що прив'язані до певних роутів, отримують єдиний аргумент - контекст запиту. Тобто в цьому режимі ви вже не зможете оголосити інші параметри методів. Разом з тим, в конструкторі ви все ще можете оголошувати довільну кількість параметрів, які створюються єдиний раз.

### Ієрархія інжекторів контролера {#controller-injector-hierarchy}

Контролер [в режимі injector-scoped][10], окрім свого власного інжектора на рівні запиту, має ще й три батьківські інжектори: на рівні роута, модуля та застосунка. Ці інжектори також формуються на основі провайдерів, які ви передаєте в наступні масиви:

- `providersPerApp`;
- `providersPerMod`;
- `providersPerRou`;
- `providersPerReq` (це масив, з якого формується інжектор для контролера в режимі injector-scoped).

Тобто контролер в режимі injector-scoped може залежати від сервісів на будь-якому рівні.

Якщо ж контролер є [в режимі context-scoped][11], його власний інжектор знаходиться на рівні модуля, і він має один батьківський інжектор на рівні застосунку:

- `providersPerApp`;
- `providersPerMod` (це масив, з якого формується інжектор для контролера в режимі context-scoped).

## Прив'язка контролера до хост-модуля {#binding-of-the-controller-to-the-host-module}

Будь-який контролер повинен прив'язуватись лише до поточного модуля, де він був оголошений, тобто до хост-модуля. Така прив'язка робиться через масив `controllers`:

```ts {4}
import { restModule } from '@ditsmod/rest';
import { SomeController } from './some.controller.js';

@restModule({ controllers: [SomeController] })
export class SomeModule {}
```

Після прив'язки контролерів до хост-модуля, щоб Ditsmod брав їх до уваги у зовнішньому модулі, хост-модуль потрібно або прикріпити, або імпортувати у формі об'єкта, що має інтерфейс [ModuleWithParams][2]. В наступному прикладі показано і прикріплення, і повний імпорт хост-модуля (це зроблено лише щоб продемонструвати можливість, на практиці немає сенсу робити одночасне прикріплення з імпортом):

```ts {5,7}
import { restModule } from '@ditsmod/rest';
import { SomeModule } from './some.module.js';

@restModule({
  appends: [SomeModule],
  // OR
  imports: [{ module: SomeModule, path: '' }]
})
export class OtherModule {}
```

Якщо модуль імпортується без властивості `path`, Ditsmod буде імпортувати лише його [провайдери][3] та [розширення][9]:

```ts {5}
import { restModule } from '@ditsmod/rest';
import { SomeModule } from './some.module.js';

@restModule({
  imports: [SomeModule]
})
export class OtherModule {}
```

Більш докладну інформацію ви можете прочитати у розділі [Експорт, імпорт та прикріплення модулів][1].

## Сервіси {#services}

Хоча з технічної точки зору, для обробки HTTP-запиту можна обійтись одним лише контролером, але об'ємний код з бізнес логікою краще виносити в окремі класи, щоб при потребі можна було повторно використовувати цей код, і щоб його можна було простіше тестувати. Ці окремі класи з бізнес логікою, як правило, називають _сервісами_.

Що можуть робити сервіси:

- перевіряти права доступу;
- робити валідацію запиту;
- надавати конфігурацію;
- робити парсинг тіла запиту;
- парцювати з базами даних, з поштою;
- і т.п.

Будь-який TypeScript клас може бути сервісом Ditsmod, але якщо ви хочете щоб [DI][7] вирішував залежність, яку ви вказуєте в конструкторах даних класів, перед ними необхідно прописувати декоратор `injectable`:

```ts {4,6}
import { injectable } from '@ditsmod/core';
import { FirstService } from './first.service.js';

@injectable()
export class SecondService {
  constructor(private firstService: FirstService) {}

  methodOne() {
    this.firstService.doSomeThing();
  }
}
```

Файли сервісів рекомендується називати із закінченням `*.service.ts`, а їхні класи - із закінченням `*Service`.

Як бачите, правила отримання інстансу класу в конструкторі такі ж, як і в контролерах: за допомогою модифікатора доступу `private` оголошуємо властивість класу `firstService` з типом даних `FirstService`.

Щоб можна було користуватись новоствореними класами сервісів, їх потрібно передати у метадані **поточного** модуля чи контролера. Передати сервіси у метадані модуля можна наступним чином:

```ts {8-9}
import { restModule } from '@ditsmod/rest';

import { FirstService } from './first.service.js';
import { SecondService } from './second.service.js';

@restModule({
  providersPerReq: [
    FirstService,
    SecondService
  ],
})
export class SomeModule {}
```

Аналогічно сервіси передаються у метадані контролера:

```ts {8-9}
import { controller, Res, route } from '@ditsmod/rest';

import { FirstService } from './first.service.js';
import { SecondService } from './second.service.js';

@controller({
  providersPerReq: [
    FirstService,
    SecondService
  ],
})
export class SomeController {
  @route('GET', 'hello')
  method1(res: Res, secondService: SecondService) {
    res.send(secondService.sayHello());
  }
}
```

В останніх двох прикладах сервіси передаються у масив `providersPerReq`, але це не єдиний спосіб передачі сервісів. Більш докладну інформацію про правила роботи з DI можна отримати у розділі [Dependency Injection][7].

### Ієрархія інжекторів сервіса {#service-injector-hierarchy}

На відміну від контролера, інжектор певного сервіса може бути на будь-якому рівні: на рівні застосунку, модуля, роуту, чи запиту. На практиці це означає, що провайдер для даного сервіса передається в один (або в декілька) масивів `providersPer*`. Наприклад, в наступному прикладі `SomeService` передається в інжектор на рівні роуту, а `OtherService` - на рівні модуля:

```ts {5-6}
import { Injector } from '@ditsmod/core';
// ...

const providersPerApp = [];
const providersPerMod = [OtherService];
const providersPerRou = [SomeService];
const providersPerReq = [];

const injectorPerApp = Injector.resolveAndCreate(providersPerApp);
const injectorPerMod = injectorPerApp.resolveAndCreateChild(providersPerMod);
const injectorPerRou = injectorPerMod.resolveAndCreateChild(providersPerRou);
const injectorPerReq = injectorPerRou.resolveAndCreateChild(providersPerReq);
```

В даному разі, якщо `SomeService` матиме залежність від `OtherService`, DI зможе створити інстанс `SomeService`, оскільки інжектор на рівні роуту може отримати інстанс `OtherService` від свого батьківського інжектора на рівні модуля. А от якщо навпаки - `OtherService` матиме залежність від `SomeService` - DI не зможе створити інстансу `OtherService`, оскільки інжектор на рівні модуля не бачить свого дочірнього інжектора на рівні роуту.

В наступному прикладі показано чотири різні варіанти запиту інстансу `SomeService` за допомогою методу `injectorPer*.get()` напряму або через параметри методу класу:

```ts
injectorPerRou.get(SomeService); // Injector per route.
// OR
injectorPerReq.get(SomeService); // Injector per request.
// OR
@injectable()
class Service1 {
  constructor(private someService: SomeService) {} // Constructor's parameters.
}
// OR
@controller()
class controller1 {
  @route('GET', 'some-path')
  method1(someService: SomeService) {} // Method's parameters.
}
```

Тут важливо пам'ятати про наступне правило: значення для `SomeService` створюється в тому інжекторі, в який передається даний провайдер, причому це значення створюється лише один раз при першому запиті. В нашому прикладі, клас `SomeService` фактично передається до `injectorPerRou`, отже саме в `injectorPerRou` буде створюватись інстанс класу `SomeService`, навіть якщо цей інстанс запитується у дочірньому `injectorPerReq`.

Це правило є дуже важливим, оскільки воно чітко показує:

1. в якому саме інжекторі створюється значення для певного провайдера;
2. якщо взяти окремий інжектор, то лише один раз у ньому створюється значення для певного провайдера (за певним токеном);
3. якщо у дочірнього інжектора бракує певного провайдера, то він може звернутись до батьківського інжектора за _значенням_ цього провайдера (тобто дочірній інжектор запитує у батьківсього інжектора _значення_ провайдера, а не сам провайдер).

Це правило працює для методу `injector.get()`, але не для `injector.pull()` чи `injector.resolveAndInstantiate()`.

## Передача провайдерів в реєстр DI {#transfer-of-providers-to-the-di-registry}

На одну залежність, в реєстр DI потрібно передавати один або декілька [провайдерів][3]. Частіше за все, провайдери передаються в реєстр DI через метадані модулів, хоча інколи вони передаються через метадані контролерів, або навіть напряму в [інжектори][3]. В наступному прикладі `SomeService` передається в масив `providersPerMod`:

```ts {6}
import { restModule } from '@ditsmod/rest';
import { SomeService } from './some.service.js';

@restModule({
  providersPerMod: [
    SomeService
  ],
})
export class SomeModule {}
```

Після такої передачі, споживачі провайдерів можуть використовувати `SomeService` в межах `SomeModule`. І тепер давайте додатково з цим же токеном передамо інший провайдер, але на цей раз у метадані контролера:

```ts {8}
import { controller } from '@ditsmod/rest';

import { SomeService } from './some.service.js';
import { OtherService } from './other.service.js';

@controller({
  providersPerReq: [
    { token: SomeService, useClass: OtherService }
  ]
})
export class SomeController {
  constructor(private someService: SomeService) {}
  // ...
}
```

Зверніть увагу на виділений рядок. Таким чином ми говоримо DI: "Якщо даний контролер має залежність від провайдера з токеном `SomeService`, її потрібно підмінити інстансом класу `OtherService`". Ця підміна буде діяти тільки для даного контролера. Усі інші контролери в `SomeModule` по токену `SomeService` будуть отримувати інстанси класу `SomeService`.

Аналогічну підміну можна робити на рівні застосунку та на рівні модуля. Це інколи може знадобитись, наприклад коли ви хочете мати дефолтні значення конфігурації на рівні застосунку, але кастомні значення цієї конфігурації на рівні конкретного модуля. В такому разі передамо спочатку дефолтний конфіг в кореневому модулі:

```ts {6}
import { rootModule } from '@ditsmod/core';
import { ConfigService } from './config.service.js';

@rootModule({
  providersPerApp: [
    ConfigService
  ],
})
export class AppModule {}
```

І вже у певному модулі підмінюємо `ConfigService` на довільне значення:

```ts {6}
import { restModule } from '@ditsmod/rest';
import { ConfigService } from './config.service.js';

@restModule({
  providersPerMod: [
    { token: ConfigService, useValue: { propery1: 'some value' } }
  ],
})
export class SomeModule {}
```

## Повторне додавання провайдерів {#re-adding-providers}

Різні провайдери з одним і тим самим токеном можна додавати багато разів в метадані модуля чи контролера, але DI вибере той із провайдерів, що додано останнім (виключення з цього правила є, але це стосується лише мульти-провайдерів):

```ts
import { restModule } from '@ditsmod/rest';

@restModule({
  providersPerMod: [
    { token: 'token1', useValue: 'value1' },
    { token: 'token1', useValue: 'value2' },
    { token: 'token1', useValue: 'value3' },
  ],
})
export class SomeModule {}
```

В даному разі, в межах `SomeModule` по `token1` буде видаватись `value3` на рівні модуля, роуту чи запиту.

Окрім цього, різні провайдери з одним і тим самим токеном можна передавати одночасно на декількох різних рівнях ієрархії, але DI завжди буде вибирати найближчі інжектори (тобто, якщо значення для провайдера запитується на рівні запиту, то спочатку буде проглядатись інжектор на рівні запиту, і лише якщо там немає потрібного провайдера, DI буде підніматись до батьківських інжекторів):

```ts
import { restModule } from '@ditsmod/rest';

@restModule({
  providersPerMod: [{ token: 'token1', useValue: 'value1' }],
  providersPerRou: [{ token: 'token1', useValue: 'value2' }],
  providersPerReq: [{ token: 'token1', useValue: 'value3' }],
})
export class SomeModule {}
```

В даному разі, в межах `SomeModule` по `token1` буде видаватись `value3` на рівні запиту, `value2` - на рівні роуту, і `value1` - на рівні модуля.

Також, якщо ви імпортуєте певний провайдер із зовнішнього модуля, і у вас у поточному модулі є провайдер з таким же токеном, то локальний провайдер матиме вищій пріоритет, при умові, що вони передавались на однаковому рівні ієрархії інжекторів.

[1]: /developer-guides/exports-and-imports/#import-module
[2]: /developer-guides/exports-and-imports#ModuleWithParams
[3]: /components-of-ditsmod-app/dependency-injection/#injector-and-providers
[5]: /native-modules/body-parser/#retrieving-the-request-body
[6]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/src/services/pre-router.ts
[7]: /components-of-ditsmod-app/dependency-injection/
[9]: /components-of-ditsmod-app/extensions/
[10]: #injector-scoped-controller
[11]: #context-scoped-controller
