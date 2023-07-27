---
sidebar_position: 2
---

# Dependency Injection

## Базові поняття

Ditsmod Dependency Injection (або просто DI) має наступні базові поняття:

- залежність
- токен залежності, типи токенів
- провайдер, значення провайдера
- інжектор
- ієрархія інжекторів
- підміна провайдерів

## Залежність

Якщо для створення інстанса даного класа вам потрібно спочатку створити інстанси інших класів - значить даний клас має залежності. Наприклад, якщо в конструкторі сервісу ви прописуєте ось таке:

```ts {7}
import { injectable } from '@ditsmod/core';

import { FirstService } from './first.service';

@injectable()
export class SecondService {
  constructor(private firstService: FirstService) {}
  // ...
}
```

це означає, що `SecondService` має залежність від `FirstService`, і очікується що DI вирішить цю залежність наступним чином:

1. спочатку DI прогляне конструктор `FirstService`;
2. якщо у `FirstService` немає залежності, буде створено інстанс `FirstService`;
3. інстанс `FirstService` буде передано в конструктор `SecondService`.

Якщо після виконання першого пункту виясниться, що `FirstService` має свої власні залежності, то DI буде рекурсивно виконувати ці три пункти для кожної даної залежності.

### Опціональна залежність

Інколи вам може знадобитись вказати опціональну (необов'язкову) залежність в конструкторі. Давайте розглянемо наступний приклад, де після властивості `firstService` поставлено знак питання, і таким чином вказано для TypeScript що ця властивість є опціональною:

```ts {7}
import { injectable } from '@ditsmod/core';

import { FirstService } from './first.service';

@injectable()
export class SecondService {
  constructor(private firstService?: FirstService) {}
  // ...
}
```

Але DI проігнорує цю опціональність і видасть помилку у разі відсутності можливості для створення `FirstService`. Щоб даний код працював, необхідно скористатись декоратором `optional`:

```ts {7}
import { injectable, optional } from '@ditsmod/core';

import { FirstService } from './first.service';

@injectable()
export class SecondService {
  constructor(@optional() private firstService?: FirstService) {}
  // ...
}
```

## Токен залежності

DI фактично ігнорує тип залежності і бере до уваги лише її JavaScript-значення, з яким в подальшому буде асоціювати цю залежність. Таке JavaScript-значення в контексті DI називають **токеном**. Передати токен можна у короткій або довгій формі вказання залежності. Давайте знову розглянемо попередній приклад:

```ts {7}
import { injectable } from '@ditsmod/core';

import { FirstService } from './first.service';

@injectable()
export class SecondService {
  constructor(private firstService: FirstService) {}
  // ...
}
```

Це **коротка форма** вказання залежності, вона має суттєві обмеження, бо таким чином можна вказати залежність лише від певного класу. В даному разі `FirstService` використовується одночасно і як тип змінної (для DI це не важливо), і в якості токену для указання залежності `SecondService` від інстансу класу `FirstService`. Іншими словами, для DI не важливо які властивості чи методи має клас `FirstService`, важливо лише JavaScript-значення цього класу - тобто референс на цей клас.

А ще існує **довга форма** вказання залежності за допомогою декоратора `inject`, вона дозволяє використовувати альтернативний токен:

```ts {7}
import { injectable, inject } from '@ditsmod/core';

import { InterfaceOfItem } from './types';

@injectable()
export class SecondService {
  constructor(@inject('some-string') private someArray: InterfaceOfItem[]) {}
  // ...
}
```

Коли використовується `inject`, DI бере до уваги лише переданий в нього токен. В даному разі DI ігнорує тип змінної - `InterfaceOfItem[]`, використовуючи в якості токена текстовий рядок `some-string`. Таким чином, DI дає можливість розділяти токен та тип змінної, тому в конструкторі можна отримати будь-який тип залежності, включаючи різні типи масивів чи enum.

Токен не можна оголошувати з ключовими словами `interface`, `type`, і т.п., бо після компіляції TypeScript-коду у JavaScript-код такий токен зникне. У довгій формі вказання залежностей токен може мати будь-який JavaScript-тип окрім `undefined`, масиву чи enum (але не забувайте що тип токена і тип залежності у довгій формі можуть відрізнятись, тому у якості значення залежності ви можете отримати будь-яке значення, окрім `undefined`). У короткій формі вказання залежностей, токен може бути лише класом.

Самий простий та надійний у використанні тип залежності - це клас. DI добре розпізнає референси на різні класи, навіть якщо вони мають однакові імена, тому декоратор `inject` з ними можна не використовувати. Для усіх інших типів залежностей рекомендуємо використовувати інстанс класу `InjectionToken<T>` у якості токена:

```ts {5}
// tokens.ts
import { InjectionToken } from '@ditsmod/core';
import { InterfaceOfItem } from './types';

const SOME_TOKEN = new InjectionToken<InterfaceOfItem[]>('InterfaceOfItem');

// second-service.ts
import { injectable, inject } from '@ditsmod/core';
import { InterfaceOfItem } from './types';
import { SOME_TOKEN } from './tokens';

@injectable()
export class SecondService {
  constructor(@inject(SOME_TOKEN) private someArray: InterfaceOfItem[]) {}
  // ...
}
```

## Провайдери

У DI є реєстр залежностей, який по-суті є мапінгом між токеном та значенням, яке потрібно видавати для цього токена. Схематично цей реєстр можна показати так:

```
токен1 -> значення15
токен2 -> значення100
...
```

Указані тут значення DI створює використовуючи **провайдери**. Отже, щоб DI міг вирішити певну залежність, спочатку необхідно передати відповідний провайдер до реєстру DI, а потім DI буде видавати значення цього провайдера по його токену. Іншими словами, **значення провайдера** фактично вирішує залежність. Тому якщо ви вказали певну залежність у класі, але не передали відповідного провайдера, DI не зможе вирішити дану залежність. Про те, як саме можна передавати провайдери до DI, йдеться [в наступному розділі][100]. Провайдер може бути або класом, або об'єктом:

```ts {3-7}
import { Class } from '@ditsmod/core';

type Provider = Class<any> |
{ token: any, useClass: Class<any>, multi?: boolean } |
{ token: any, useValue: any, multi?: boolean } |
{ token?: any, useFactory: [Class<any>, Class<any>.prototype.methodName], multi?: boolean } |
{ token: any, useToken: any, multi?: boolean }
```

Зверніть увагу, що токен для провайдера з властивістю `useFactory` є опціональним, оскільки DI може використати метод вказаного класу у якості токена.


Якщо провайдер представлено у вигляді об'єкта, у його властивості можуть передаватись наступні значення:

- `useClass` - сюди передається клас, інстанс якого буде використовуватись для вирішення залежності з указаним токеном. Приклад такого провайдера:

  ```ts
  { token: 'token1', useClass: SomeService }
  ```
- `useValue` - сюди передається будь-яке значення, окрім `undefined`, DI його видаватиме без змін. Приклад такого провайдера:

  ```ts
  { token: 'token2', useValue: 'some value' }
  ```
- `useFactory` - сюди передається [tuple][11], де на першому місці повинен бути клас, а на другому місці - метод цього класу, який повинен повернути будь-яке значення для вказаного токена. Наприклад, якщо клас буде таким:

  ```ts
  import { methodFactory } from '@ditsmod/core';

  export class ClassWithFactory {
    @methodFactory()
    method1(dependecy1: Dependecy1, dependecy2: Dependecy2) {
      // ...
      return '...';
    }
  }
  ```

  В такому разі провайдер потрібно передавати до реєстру DI в наступному форматі:

  ```ts
  { token: 'token3', useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] }
  ```

  Спочатку DI створить інстанс цього класу, потім викличе його метод та отримає результат, який вже і буде асоціюватись з указаним токеном. Метод указаного класу може повертати будь-яке значення, окрім `undefined`.

- `useToken` - в цю властивість провайдера передається інший токен. Якщо ви записуєте таке:

  ```ts
  { token: SecondService, useToken: FirstService }
  ```

  таким чином ви говорите DI: "Коли споживачі провайдерів запитують токен `SecondService`, потрібно використати значення для токена `FirstService`". Іншими словами, ця директива робить аліас `SecondService`, який вказує на `FirstService`. Алгоритм роботи DI в таких випадках наступний:
    - Коли споживачі провайдерів запитують `SecondService`, DI шукатиме для нього значення у своєму реєстрі по токену `FirstService`.
    - Після того, як DI знайде значення для `FirstService`, воно буде повернуто споживачу, що шукав `SecondService`.

Тепер, коли ви вже ознайомились з поняттям **провайдер**, можна уточнити, що під **залежністю** розуміють залежність саме від **значення провайдера**. Таку залежність мають **споживачі** значень провайдерів або в конструкторах сервісів, або в конструкторах чи методах контролерів, або в методі `get()` [інжекторів][102] (про це буде згадано пізніше).

## Інжектор

Вище було згадано за так званий **реєстр DI**. Тепер же, коли ви знаєте для чого DI використовує даний реєстр, саме час дізнатись, що ці реєстри знаходяться в інжекторах, і таких інжекторів в Ditsmod-застосунку може бути багато. Але спочатку давайте розберемось як працюють інжектори.

Якщо сильно спростити схему роботи DI, можна сказати що DI приймає масив провайдерів на вході, а на виході видає інжектор, який вміє створювати значення для кожного переданого провайдера. Це має приблизно наступну картину:

```ts {16}
import 'reflect-metadata';
import { Injector, injectable } from '@ditsmod/core';

class Service1 {}

@injectable()
class Service2 {
  constructor(service1: Service1) {}
}

@injectable()
class Service3 {
  constructor(service2: Service2) {}
}

const injector = Injector.resolveAndCreate([Service1, Service2, Service3]);
const service3 = injector.get(Service3);
service3 === injector.get(Service3); // true
service3 === injector.resolveAndInstantiate(Service3); // false
```

Метод `Injector.resolveAndCreate()` на вході приймає масив провайдерів, а на виході видає певний об'єкт, що якраз і називається **інжектором**. Цей інжектор очевидно вміє видавати значення кожного провайдера по його токену за допомогою методу `injector.get()`, з урахуванням усього ланцюжка залежностей (`Service3` -> `Service2` -> `Service1`).

Що робить `injector.get()`:

- коли у нього запитують `Service3`, він проглядає конструктор цього класу, бачить залежність від `Service2`;
- потім проглядає конструктор у `Service2`, бачить залежність від `Service1`;
- потім проглядає конструктор у `Service1`, не знаходить там залежності, і тому першим створює інстанс `Service1`;
- потім створює інстанс `Service2`;
- і останнім створює інстанс `Service3`;
- якщо пізніше будуть запитувати повторно інстанс `Service3`, метод `injector.get()` буде повертати раніше створений інстанс `Service3` з кешу даного інжектора.

Інколи останній пункт (коли інстанс `Service3` повертається з кешу інжектора), є небажаним. В такому разі ви можете скористатись методом `injector.resolveAndInstantiate()`. Фактично він робить усе те саме, що робить `injector.get()`, але кожен раз повертає новий інстанс.

Ditsmod під капотом використовує метод `injector.get()`, коли DI вирішує залежність, яку знаходить в конструкторі сервісу, чи контролера. 

Використовуючи DI, вам можна і не знати весь ланцюжок залежностей `Service3`, довірте цю роботу інжектору, головне - передайте в реєстр DI усі необхідні класи. Майте на увазі, що таким чином можна писати unit-тести для окремо взятих класів.

## Ієрархія інжекторів

DI дозволяє створювати ще й ієрархію інжекторів - це коли є батьківські та дочірні інжектори. На перший погляд, немає нічого цікавого у такій ієрархії, бо не зрозуміло для чого вона потрібна, але у Ditsmod ця можливість використовується якраз дуже часто, оскільки вона дозволяє робити архітектуру застосунку модульною. Вивченню специфіки ієрархії варто приділити особливу увагу, це в майбутньому збереже вам не одну годину часу, бо ви знатимете як воно працює і чому воно не знаходить цієї залежності...

При створенні ієрархії, зв'язок утримує лише дочірній інжектор, він має об'єкт батьківського інжектора. В той же час, батьківський інжектор нічого не знає про свої дочірні інжектори. Тобто зв'язок між інжекторами в ієрархії є одностороннім. Умовно, це виглядає наступним чином:

```ts {6}
interface Parent {
  // Тут є певні властивості батьківського інжектора, але немає дочірнього інжектора
}

interface Child {
  parent: Parent;
  // Тут існують інші властивості дочірного інжектора.
}
```

Завдяки наявності об'єкта батьківського інжектора, дочірній інжектор може звертатись до батьківського інжектора, коли у нього запитують значення провайдера, якого у нього немає.

Давайте розглянемо наступний приклад. Для спрощення, тут взагалі не використовуються декоратори, оскільки кожен клас є незалежним:

```ts {8-9}
import { Injector } from '@ditsmod/core';

class Service1 {}
class Service2 {}
class Service3 {}
class Service4 {}

const parent = Injector.resolveAndCreate([Service1, Service2]); // Батьківський інжектор
const child = parent.resolveAndCreateChild([Service2, Service3]); // Дочірній інжектор

child.get(Service1); // ОК
parent.get(Service1); // ОК

parent.get(Service1) === child.get(Service1); // true

child.get(Service2); // ОК
parent.get(Service2); // ОК

parent.get(Service2) === child.get(Service2); // false

child.get(Service3); // ОК
parent.get(Service3); // Error - No provider for Service3!

child.get(Service4); // Error - No provider for Service4!
parent.get(Service4); // Error - No provider for Service4!
```

Як бачите, при створенні дочірнього інжектора, йому не передали `Service1`, тому при запиті інстансу цього класу він звернеться до батька. До речі, тут є один неочевидний, але дуже важливий момент: дочірні інжектори тільки запитують у батьківських інжекторів певні інстанси класів, а самостійно вони їх не створюють. Саме тому цей вираз повертає `true`:

```ts
parent.get(Service1) === child.get(Service1); // true
```

А `Service2` є в обох інжекторах, тому кожен із них створить свою локальну версію цього сервіса, і саме через це даний вираз повертає `false`:

```ts
parent.get(Service2) === child.get(Service2); // false
```

Батьківський інжектор не може створити інстансу класу `Service3` через те, що батьківський інжектор не має зв'язку з дочірнім інжектором, в якому є `Service3`.

Ну і обидва інжектори не можуть видати інстансу `Service4`, бо їм не передали цього класу при їхньому створенні.

### Ієрархія інжекторів в застосунку Ditsmod

Раніше в документації ви зустрічали наступні властивості об'єкта, які передаються через метадані модуля або контролера:

- `providersPerApp` - провайдери на рівні застосунку;
- `providersPerMod` - провайдери на рівні модуля;
- `providersPerRou` - провайдери на рівні роута;
- `providersPerReq` - провайдери на рівні HTTP-запиту.

Використовуючи ці масиви, Ditsmod формує чотири різні інжектори, що пов'язані між собою ієрархічним зв'язком. Таку ієрархію можна зімітувати наступним чином:

```ts
import { Injector } from '@ditsmod/core';

const providersPerApp = [];
const providersPerMod = [];
const providersPerRou = [];
const providersPerReq = [];

const injectorPerApp = Injector.resolveAndCreate(providersPerApp);
const injectorPerMod = injectorPerApp.resolveAndCreateChild(providersPerMod);
const injectorPerRou = injectorPerMod.resolveAndCreateChild(providersPerRou);
const injectorPerReq = injectorPerRou.resolveAndCreateChild(providersPerReq);
```

Під капотом, Ditsmod робить аналогічну процедуру багато разів для різних модулів, роутів та запитів. Наприклад, якщо застосунок Ditsmod має два модулі, і десять роутів, відповідно буде створено один інжектор на рівні застосунку, по одному інжектору для кожного модуля (2 шт.), по одному інжектору для кожного роуту (10 шт.), і по одному інжектору на кожен запит. Інжектори на рівні запиту видаляються автоматично кожен раз після завершення обробки запиту.

Нагадаємо, що вищі в ієрархії інжектори не мають доступу до нижчих в ієрархії інжекторів. Щоб DI успішно вирішив залежності певного провайдера, даний провайдер потрібно передати в найнижчий в ієрархії інжектор серед тих інжекторів, які будуть брати участь у даному вирішенні залежностей.

Наприклад, якщо ви напишете клас, що має залежність від HTTP-запиту, ви зможете його передати тільки у масив `providersPerReq`, бо тільки з цього масиву формується інжектор, до якого Ditsmod буде автоматично додавати провайдер з об'єктом HTTP-запиту. З іншого боку, інстанс цього класу матиме доступ до усіх своїх батьківських інжекторів: на рівні роуту, модуля, та застосунку. Тому даний клас може залежати від провайдерів на будь-якому рівні.

Також ви можете написати певний клас і передати його в масив `providersPerMod`, в такому разі він може залежати тільки від провайдерів на рівні модуля, або на рівні застосунку. Якщо він буде залежати від провайдерів, які ви передали в масив `providersPerRou` чи `providersPerReq`, ви отримаєте помилку про те, що ці провайдери не знайдені.

### Ієрархія інжекторів контролера

Будь-який контролер, окрім свого власного інжектора на рівні запиту, має ще й три батьківські інжектори: на рівні роута, модуля та застосунка. Ці інжектори також формуються на основі провайдерів, які ви передаєте в наступні масиви:

- `providersPerApp`;
- `providersPerMod`;
- `providersPerRou`;
- `providersPerReq` (<-- це масив, з якого формується інжектор для контролера).

### Ієрархія інжекторів сервіса

На відміну від контролера, інжектор певного сервіса може бути на будь-якому рівні: на рівні застосунку, модуля, роуту, чи запиту. На практиці це означає, що провайдер для даного сервіса передається в один (або в декілька) із вищезазначених масивів. Наприклад, в наступному прикладі `SomeService` передається в інжектор на рівні роуту, а `OtherService` - на рівні модуля:

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

### Поточний інжектор

Безпосередньо сам інжектор сервіса чи контролера вам рідко може знадобиться, але ви його можете отримати у конструкторі як і значення будь-якого іншого провайдера:

```ts
import { injectable, Injector } from '@ditsmod/core';
import { FirstService } from './first.service';

@injectable()
export class SecondService {
  constructor(private injector: Injector) {}

  someMethod() {
    const firstService = this.injector.get(FirstService);  // Lazy loading of dependency
  }
}
```

Майте на увазі, що ви таким чином отримуєте інжектор, що створив інстанс даного сервіса. Рівень ієрархії цього інжектора залежить тільки від того, в реєстр якого інжектора передали `SecondService`.

## Мульти-провайдери

Цей вид провайдерів існує тільки у вигляді об'єкта, і він відрізняється від звичайних DI-провайдерів наявністю властивості `multi: true`. Такі провайдери доцільно використовувати, коли є потреба у передачі до DI зразу декількох провайдерів з однаковим токеном, щоб DI повернув таку саму кількість значень для цих провайдерів в одному масиві:

```ts
import { Injector } from '@ditsmod/core';

import { LOCAL } from './tokens';

const injector = Injector.resolveAndCreate([
  { token: LOCAL, useValue: 'uk', multi: true },
  { token: LOCAL, useValue: 'en', multi: true },
]);

const locals = injector.get(LOCAL); // ['uk', 'en']
```

По-суті, мульти-провайдери дозволяють створювати групи провайдерів, що мають спільний токен. Ця можливість зокрема використовується для створення групи `HTTP_INTERCEPTORS`, а також для створення різних груп розширень.

Не допускається щоб в одному інжекторі однаковий токен мали і звичайні, і мульти-провайдери:

```ts
import { Injector } from '@ditsmod/core';

import { LOCAL } from './tokens';

const injector = Injector.resolveAndCreate([
  { token: LOCAL, useValue: 'uk' },
  { token: LOCAL, useValue: 'en', multi: true },
]);

const locals = injector.get(LOCAL); // Error: Cannot mix multi providers and regular providers
```

Дочірні інжектори можуть повертати мульти-провайдери батьківського інжектора лише якщо при створенні дочірніх інжекторів їм не передавались провайдери з такими самими токенами:

```ts
import { Injector } from '@ditsmod/core';

import { LOCAL } from './tokens';

const parent = Injector.resolveAndCreate([
  { token: LOCAL, useValue: 'uk', multi: true },
  { token: LOCAL, useValue: 'en', multi: true },
]);

const child = parent.resolveAndCreateChild([]);

const locals = child.get(LOCAL); // ['uk', 'en']
```

Якщо ж і в дочірнього, і в батьківського інжектора є мульти-провайдери з однаковим токеном, дочірній інжектор повертатиме значення лише зі свого масиву:

```ts
import { Injector } from '@ditsmod/core';

import { LOCAL } from './tokens';

const parent = Injector.resolveAndCreate([
  { token: LOCAL, useValue: 'uk', multi: true },
  { token: LOCAL, useValue: 'en', multi: true },
]);

const child = parent.resolveAndCreateChild([
  { token: LOCAL, useValue: 'аа', multi: true }
]);

const locals = child.get(LOCAL); // ['аа']
```

### Підміна мультипровайдерів

Щоб стала можливою підміна конкретного мультипровайдера, можна зробити так:

1. спочатку передавайте мультипровайдер в масив для формування інжектора та використовуйте властивість `useToken`;
2. потім передавайте клас який ви хочете підмінити;
3. ну і в кінець масиву передавайте клас, який підмінює потрібний вам клас.

```ts
import { Injector } from '@ditsmod/core';

import { HTTP_INTERCEPTORS } from './constants';
import { DefaultInterceptor } from './default.interceptor';
import { MyInterceptor } from './my.interceptor';

const injector = Injector.resolveAndCreate([
  { token: HTTP_INTERCEPTORS, useToken: DefaultInterceptor, multi: true },
  DefaultInterceptor,
  { token: DefaultInterceptor, useClass: MyInterceptor }
]);

const locals = injector.get(HTTP_INTERCEPTORS); // [MyInterceptor]
```

Така конструкція має сенс, наприклад, якщо перші два пункти виконуються десь у зовнішньому модулі, до якого у вас немає доступу на редагування, а третій пункт виконує вже користувач цього модуля.

## Передача провайдерів в реєстр DI

На одну залежність, в реєстр DI потрібно передавати один або декілька провайдерів. Частіше за все, провайдери передаються в реєстр DI через метадані модулів, хоча інколи вони передаються через метадані контролерів, або навіть напряму в [інжектори][102]. В наступному прикладі `SomeService` передається в масив `providersPerMod`:

```ts {7}
import { featureModule } from '@ditsmod/core';

import { SomeService } from './some.service';

@featureModule({
  providersPerMod: [
    SomeService
  ],
})
export class SomeModule {}
```

Після такої передачі, споживачі провайдерів можуть використовувати `SomeService` в межах `SomeModule`. Ідентичний результат буде, якщо ми цей же провайдер передамо у форматі об'єкта:

```ts {7}
import { featureModule } from '@ditsmod/core';

import { SomeService } from './some.service';

@featureModule({
  providersPerMod: [
    { token: SomeService, useClass: SomeService }
  ],
})
export class SomeModule {}
```

І тепер давайте додатково з цим же токеном передамо інший провайдер, але на цей раз у метадані контролера:

```ts {8}
import { controller } from '@ditsmod/core';

import { SomeService } from './some.service';
import { OtherService } from './other.service';

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

```ts {7}
import { rootModule } from '@ditsmod/core';

import { ConfigService } from './config.service';

@rootModule({
  providersPerApp: [
    ConfigService
  ],
})
export class AppModule {}
```

І вже у певному модулі підмінюємо `ConfigService` на довільне значення:

```ts {7}
import { featureModule } from '@ditsmod/core';

import { ConfigService } from './config.service';

@featureModule({
  providersPerMod: [
    { token: ConfigService, useValue: { propery1: 'some value' } }
  ],
})
export class SomeModule {}
```

## Повторне додавання провайдерів

Один і той самий провайдер можна додавати багато разів в метадані модуля чи контролера, але DI вибере той із провайдерів, що додано останнім (виключення з цього правила є, але це стосується лише мульти-провайдерів):

```ts
import { featureModule } from '@ditsmod/core';

@featureModule({
  providersPerMod: [
    { token: 'token1', useValue: 'value1' },
    { token: 'token1', useValue: 'value2' },
    { token: 'token1', useValue: 'value3' },
  ],
})
export class SomeModule {}
```

В даному разі, в межах `SomeModule` по `token1` буде видаватись `value3` на рівні модуля, роуту чи запиту.

Окрім цього, один і той самий провайдер можна передавати одночасно на декількох різних рівнях ієрархії, але DI завжди буде вибирати найближчі інжектори (тобто, якщо значення для провайдера запитується на рівні запиту, то спочатку буде проглядатись інжектор на рівні запиту, і лише якщо там немає потрібного провайдера, DI буде підніматись до батьківських інжекторів):

```ts
import { featureModule } from '@ditsmod/core';

@featureModule({
  providersPerMod: [{ token: 'token1', useValue: 'value1' }],
  providersPerRou: [{ token: 'token1', useValue: 'value2' }],
  providersPerReq: [{ token: 'token1', useValue: 'value3' }],
})
export class SomeModule {}
```

В даному разі, в межах `SomeModule` по `token1` буде видаватись `value3` на рівні запиту, `value2` - на рівні роуту, і `value1` - на рівні модуля.

Також, якщо ви імпортуєте певний провайдер із зовнішнього модуля, і у вас у поточному модулі є провайдер з таким же токеном, то локальний провайдер матиме вищій пріоритет, при умові, що вони передавались на однаковому рівні ієрархії інжекторів.

## Коли DI не може знайти потрібного провайдера

Пам'ятайте, що коли DI не може знайти потрібного провайдера, існує всього три можливі причини:

1. ви не передали потрібний провайдер до DI в метадані модуля чи контролера (ну або у випадку тестування - у `Injector.resolveAndCreate()`);
2. ви не імпортували модуль, де передається потрібний вам провайдер, або ж цей провайдер не експортується;
3. ви запитуєте у батьківському інжекторі провайдер з дочірнього інжектора.


[12]: https://uk.wikipedia.org/wiki/%D0%9E%D0%B4%D0%B8%D0%BD%D0%B0%D0%BA_(%D1%88%D0%B0%D0%B1%D0%BB%D0%BE%D0%BD_%D0%BF%D1%80%D0%BE%D1%94%D0%BA%D1%82%D1%83%D0%B2%D0%B0%D0%BD%D0%BD%D1%8F) "Singleton"
[14]: https://github.com/ditsmod/seed/blob/901f247/src/app/app.module.ts#L18
[8]: https://uk.wikipedia.org/wiki/%D0%92%D0%BF%D1%80%D0%BE%D0%B2%D0%B0%D0%B4%D0%B6%D0%B5%D0%BD%D0%BD%D1%8F_%D0%B7%D0%B0%D0%BB%D0%B5%D0%B6%D0%BD%D0%BE%D1%81%D1%82%D0%B5%D0%B9
[9]: https://github.com/ts-stack/di
[11]: https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types

[107]: /components-of-ditsmod-app/exports-and-imports
[121]: /components-of-ditsmod-app/providers-collisions
[100]: #передача-провайдерів-в-реєстр-di
[101]: #ієрархія-інжекторів
[102]: #інжектор
