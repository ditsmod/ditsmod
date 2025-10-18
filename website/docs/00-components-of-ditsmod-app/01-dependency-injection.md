---
sidebar_position: 1
---

# Dependency Injection

В наступних прикладах даного розділу припускається, що ви клонували репозиторій [ditsmod/rest-starter][101]. Це дасть вам змогу отримати базову конфігурацію для застосунку та експериментувати у теці `src/app` даного репозиторію.

## Інжектор та провайдери {#injector-and-providers}

Давайте розглянемо наступний приклад з інжектором та провайдерами:

```ts {15-19}
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

const injector = Injector.resolveAndCreate([
  Service1,
  Service2,
  Service3
]);
const service3 = injector.get(Service3); // Instance of Service3
service3 === injector.get(Service3); // true
```

Як бачите, метод `Injector.resolveAndCreate()` на вході приймає масив класів, а на виході видає інжектор, який вміє створювати інстанс кожного переданого класу за допомогою методу `injector.get()`, з урахуванням усього ланцюжка залежностей (`Service3` -> `Service2` -> `Service1`).

Що робить `injector.get()`:

- коли у нього запитують `Service3`, він проглядає конструктор цього класу, бачить залежність від `Service2`;
- потім проглядає конструктор у `Service2`, бачить залежність від `Service1`;
- потім проглядає конструктор у `Service1`, не знаходить там залежності, і тому першим створює інстанс `Service1`;
- потім створює інстанс `Service2` використовуючи інстанс `Service1`;
- і останнім створює інстанс `Service3` використовуючи інстанс `Service2`;
- якщо пізніше будуть запитувати повторно інстанс `Service3`, метод `injector.get()` буде повертати раніше створений інстанс `Service3` з кешу даного інжектора.

Важливою особливістю тут є те, що DI здатен прочитати ланцюжок залежностей `Service3` за допомогою рефлектора і без передачі до інжектора масиву зазначених класів, але `injector.get()` в такому разі кидатиме помилку, якщо ви спробуєте отримати інстанс певного класу:

```ts
const injector = Injector.resolveAndCreate([]);
const service3 = injector.get(Service3); // Error: No provider for Service3!
```

Чому це стається? Щоб краще зрозуміти це, давайте перепишемо попередній приклад передавши інжектору провайдери в іншій формі:

```ts {16-18}
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

const injector = Injector.resolveAndCreate([
  { token: Service1, useClass: Service1 },
  { token: Service2, useClass: Service2 },
  { token: Service3, useClass: Service3 },
]);
const service1 = injector.get(Service1); // instance of Service1
const service2 = injector.get(Service2); // instance of Service2
const service3 = injector.get(Service3); // instance of Service3
```

Як бачите, тепер під час створення інжектора, замість класів ми передали масив з об'єктами. Ці об'єкти також називаються **провайдерами**. Кожен провайдер представляє собою інструкцію для DI:

1. Якщо запитується токен `Service1`, треба спочатку створити інстанс `Service1`, а потім видати його.
2. Якщо запитується токен `Service2`, треба спочатку створити інстанс `Service2`, а потім видати його.
3. Якщо запитується токен `Service3`, треба спочатку створити інстанс `Service3`, а потім видати його.

Тепер, коли ми передали до інжектора провайдери у вигляді інструкцій, стає більш зрозуміло, що інжектору необхідні інструкції для мапінгу між тим, що у нього запитують (токеном), та тим що він видає (значенням). В документації такий мапінг також може називатись **реєстром провайдерів**, оскільки інструкції для мапінгу надають йому провайдери. Що стосується токенів, то для інжектора токен - це ідентифікатор для пошуку значення у реєстрі провайдерів.

До речі, в попередньому прикладі, коли ми передавали масив класів, інжектор їх сприймав також як провайдери. Тобто провайдери можуть бути у двох формах: або це клас, або це об'єкт з інструкціями для створення певного значення. Це означає, що обидва наступні інжектори отримують конфігурацію з еквівалентними інструкціями:

```ts
const injector1 = Injector.resolveAndCreate([
  Service1,
  Service2,
  Service3,
]);
const injector2 = Injector.resolveAndCreate([
  { token: Service1, useClass: Service1 },
  { token: Service2, useClass: Service2 },
  { token: Service3, useClass: Service3 },
]);
```

Формально, тип провайдера представляє собою таку декларацію:

```ts
import { Class } from '@ditsmod/core';

type Provider = Class<any> |
{ token: any, useValue?: any, multi?: boolean } |
{ token: any, useClass: Class<any>, multi?: boolean } |
{ token?: any, useFactory: [Class<any>, Class<any>.prototype.methodName], multi?: boolean } |
{ token?: any, useFactory: (...args: any[]) => any, deps: any[], multi?: boolean } |
{ token: any, useToken: any, multi?: boolean }
```

*_зверніть увагу, що токен для провайдера з властивістю `useFactory` є опціональним, оскільки DI може використати функцію чи метод вказаного класу у якості токена._

Якщо провайдер представлено у вигляді об'єкта, він може мати наступні типи:

1. **ValueProvider** - цей тип провайдера має властивість `useValue`, в яку передається будь-яке значення, окрім `undefined`, DI його видаватиме без змін. Приклад такого провайдера:

    ```ts
    { token: 'token1', useValue: 'some value' }
    ```

2. **ClassProvider** - цей тип провайдера має властивість `useClass`, в яку передається клас, чий інстанс буде використано як значення цього провайдера. Приклад такого провайдера:

    ```ts
    { token: 'token2', useClass: SomeService }
    ```

3. **FactoryProvider** - цей тип провайдера має властивість `useFactory`, в яку можна передавати аргументи двох типів:

    - **ClassFactoryProvider** (рекомендовано, через свою кращу інкапсуляцію) передбачає, що до `useFactory` передається [tuple][11], де на першому місці повинен бути клас, а на другому місці - метод цього класу, який повинен повернути якесь значення для вказаного токена. Наприклад, якщо клас буде таким:

      ```ts
      import { factoryMethod } from '@ditsmod/core';

      export class ClassWithFactory {
        @factoryMethod()
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

    - **FunctionFactoryProvider** передбачає, що до `useFactory` можна передавати функцію, яка може мати параметри - тобто може мати залежність. Цю залежність необхідно додатково вручну вказувати у властивості `deps` у вигляді масиву токенів, причому порядок передачі токенів важливий:

      ```ts {6}
      function fn(service1: Service1, service2: Service2) {
        // ...
        return 'some value';
      }

      { token: 'token3', deps: [Service1, Service2], useFactory: fn }
      ```

      Зверніть увагу, що у властивість `deps` передаються саме _токени_ провайдерів, і DI їх сприймає саме як токени, а не як провайдери. Тобто для цих токенів до реєстру DI ще треба буде [передати відповідні провайдери][100]. Також зверніть увагу, що у `deps` не передаються декоратори для параметрів (наприклад `optional`, `skipSelf` і т.д.). Якщо для вашої фабрики необхідні декоратори параметрів - вам потрібно скористатись `ClassFactoryProvider`.

4. **TokenProvider** - цей тип провайдера має властивість `useToken`, в яку передається інший токен. Якщо ви записуєте таке:

    ```ts
    { token: SecondService, useToken: FirstService }
    ```

    таким чином ви говорите DI: "Коли споживачі провайдерів запитують токен `SecondService`, потрібно використати значення для токена `FirstService`". Іншими словами, ця директива робить аліас `SecondService`, який вказує на `FirstService`.

Тепер, коли ви вже ознайомились з поняттям **провайдер**, можна уточнити, що під **залежністю** розуміють залежність саме від **значення провайдера**. Таку залежність мають **споживачі** значень провайдерів або в конструкторах сервісів, або в конструкторах чи методах контролерів, або в методі `get()` [інжекторів][102].

## Ієрархія та інкапсуляція інжекторів  {#hierarchy-and-encapsulation-of-injectors}

DI надає можливість створювати ще й ієрархію та інкапсуляцію інжекторів, в якій беруть участь батьківські та дочірні інжектори. Саме завдяки ієрархії та інкапсуляції - і будується структура та модульність застосунку. З іншого боку, якщо є інкапсуляція, існують правила, які треба вивчити, щоб орієнтуватись, коли один сервіс може отримати доступ до певного провайдера, а коли - ні.

Давайте розглянемо наступну ситуацію. Уявіть, що вам треба створити дефолтну конфігурацію для усього застосунку, і кастомну конфігурацію для певних модулів. Це означає, що на рівні деяких модулів ви будете змінювати конфігурацію, і вам треба, щоб вона не впливала на дефолтне значення та інші модулі. Наступний псевдо-код показує базову концепцію, яка забезпечує таку поведінку:

```ts
// Батьківський інжектор
class PerApplicationInjector {
  locale = 'en'
  token1 = 'value1'
  token2 = 'value2'
  // ...
}

// Дочірній інжектор
class PerModuleInjector {
  parent: perApplicationInjector;
  locale = 'uk'
}
```

Дочірній інжектор може звертатись до батьківського інжектора, оскільки має відповідну властивість - `parent` - з інстансом батьківського інжектора. З іншого боку, батьківський інжектор не має доступу до дочірнього інжектора, тому він може знайти лише значення для тих провайдерів, які передали безпосередньо йому. Це дуже важлива особливість в ієрархії інжекторів, тому ми її повторимо ще раз: дочірні інжектори можуть звертатись до батьківських інжекторів, а батьківські інжектори не можуть звертатись до дочірніх інжекторів.

Давайте розглянемо наступний приклад. Для спрощення, тут взагалі не використовуються декоратори, оскільки жоден клас не має залежностей:

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

Як бачите, при створенні дочірнього інжектора, йому не передали `Service1`, тому при запиті інстансу цього класу він звернеться до батька. До речі, тут є один неочевидний, але дуже важливий момент: через метод `get()` дочірні інжектори тільки запитують у батьківських інжекторів певні інстанси класів, а самостійно вони їх не створюють. Саме тому цей вираз повертає `true`:

```ts
parent.get(Service1) === child.get(Service1); // true
```

Оскільки це дуже важлива особливість в ієрархії інжекторів, давайте ще раз опишемо її: значення певного провайдера зберігається саме у тому інжекторі, в який передається відповідний провайдер. Тобто, якщо під час створення дочірнього інжектора йому не передавали `Service1`, то `child.get(Service1)` може видати інстанс `Service1`, але він буде створюватись у батьківському інжекторі. І вже після того, як інстанс `Service1` створено у батьківському інжекторі, цей самий інстанс буде видаватись (з кешу) при повторному запиті або через `child.get(Service1)`, або через `parent.get(Service1)`. Це теж дуже важлива особливість, бо вона визначає де саме буде зберігатись стан конкретного провайдера.

Коли ж ми поглянемо на поведінку інжекторів при запиті у них `Service2`, то тут вони будуть поводитись по-іншому, оскільки під час їх створення їм обом передали провайдер `Service2`, тому кожен із них створить свою локальну версію цього сервіса, і саме через це даний вираз повертає `false`:

```ts
parent.get(Service2) === child.get(Service2); // false
```

Коли ми запитуємо у батьківського інжектора `Service3`, він не може створити інстансу класу `Service3` через те, що він не має зв'язку з дочірнім інжектором, в якому є `Service3`.

Ну і обидва інжектори не можуть видати інстансу `Service4`, бо їм не передали цього класу при їхньому створенні.

### Ієрархія інжекторів в застосунку Ditsmod {#hierarchy-of-injectors-in-the-ditsmod-application}

Раніше в документації ви могли зустрічати наступні властивості об'єкта, які передаються через метадані модуля:

- `providersPerApp` - провайдери на рівні застосунку;
- `providersPerMod` - провайдери на рівні модуля;
- `providersPerRou` - провайдери на рівні роута;
- `providersPerReq` - провайдери на рівні HTTP-запиту.

Використовуючи ці масиви, Ditsmod формує різні інжектори, що пов'язані між собою ієрархічним зв'язком. Таку ієрархію можна зімітувати наступним чином:

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

Нагадаємо, що вищі в ієрархії інжектори не мають доступу до нижчих в ієрархії інжекторів. Це означає, що **при передачі класу у певний інжектор, потрібно враховувати мінімальний рівень ієрархії його залежностей**.

Наприклад, якщо ви напишете клас, що має залежність від HTTP-запиту, ви зможете його передати тільки у масив `providersPerReq`, бо тільки з цього масиву формується інжектор, до якого Ditsmod буде автоматично додавати провайдер з об'єктом HTTP-запиту. З іншого боку, інстанс цього класу матиме доступ до усіх своїх батьківських інжекторів: на рівні роуту, модуля, та застосунку. Тому даний клас може залежати від провайдерів на будь-якому рівні.

Також ви можете написати певний клас і передати його в масив `providersPerMod`, в такому разі він може залежати тільки від провайдерів на рівні модуля, або на рівні застосунку. Якщо він буде залежати від провайдерів, які ви передали в масив `providersPerRou` чи `providersPerReq`, ви отримаєте помилку про те, що ці провайдери не знайдені.

### Ієрархія інжекторів контролера {#controller-injector-hierarchy}

Контролер [в режимі injector-scoped][103], окрім свого власного інжектора на рівні запиту, має ще й три батьківські інжектори: на рівні роута, модуля та застосунка. Ці інжектори також формуються на основі провайдерів, які ви передаєте в наступні масиви:

- `providersPerApp`;
- `providersPerMod`;
- `providersPerRou`;
- `providersPerReq` (це масив, з якого формується інжектор для контролера в режимі injector-scoped).

Тобто контролер в режимі injector-scoped може залежати від сервісів на будь-якому рівні.

Якщо ж контролер є [в режимі context-scoped][103], його власний інжектор знаходиться на рівні модуля, і він має один батьківський інжектор на рівні застосунку:

- `providersPerApp`;
- `providersPerMod` (це масив, з якого формується інжектор для контролера в режимі context-scoped).

### Ієрархія інжекторів сервіса {#service-injector-hierarchy}

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

### Метод `injector.pull()` {#method-injector-pull}

Цей метод є сенс використовувати лише у дочірньому інжекторі, коли у нього бракує певного провайдера, який є у батьківському інжекторі, причому цей провайдер повинен залежати від іншого провайдера, який є у дочірньому інжекторі.

Наприклад, коли `Service` залежить від `Config`, причому `Service` є тільки у батьківському інжекторі, а `Config` є як у батьківському, так і у дочірньому інжекторі:

```ts {16}
import { injectable, Injector } from '@ditsmod/core';

class Config {
  one: any;
  two: any;
}

@injectable()
class Service {
  constructor(public config: Config) {}
}

const parent = Injector.resolveAndCreate([Service, { token: Config, useValue: { one: 1, two: 2 } }]);
const child = parent.resolveAndCreateChild([{ token: Config, useValue: { one: 11, two: 22 } }]);
child.get(Service).config; // returns from parent injector: { one: 1, two: 2 }
child.pull(Service).config; // pulls Service in current injector: { one: 11, two: 22 }
```

Як бачите, якщо в даному випадку використовувати `child.get(Service)`, то `Service` створиться з тим `Config`, який є у батьківському інжекторі. Якщо ж використовувати `child.pull(Service)`, він спочатку зтягне потрібний провайдер у дочірній інжектор, а потім створить його значення в контексті дочірнього інжектора не додаючи його значення у кеш інжектора (тобто `child.pull(Service)` повертатиме кожен раз новий інстанс).

Але якщо запитуваний провайдер є у дочірньому інжекторі, то вираз `child.pull(Service)` буде працювати ідентично до виразу `child.get(Service)` (з додаванням значення провайдера у кеш інжектора):

```ts {14-15}
import { injectable, Injector } from '@ditsmod/core';

class Config {
  one: any;
  two: any;
}

@injectable()
class Service {
  constructor(public config: Config) {}
}

const parent = Injector.resolveAndCreate([]);
const child = parent.resolveAndCreateChild([Service, { token: Config, useValue: { one: 11, two: 22 } }]);
child.get(Service).config; // { one: 11, two: 22 }
```

### Поточний інжектор {#current-injector}

Безпосередньо сам інжектор сервіса чи контролера вам рідко може знадобиться, але ви його можете отримати у конструкторі як і значення будь-якого іншого провайдера:

```ts {6}
import { injectable, Injector } from '@ditsmod/core';
import { FirstService } from './first.service.js';

@injectable()
export class SecondService {
  constructor(private injector: Injector) {}

  someMethod() {
    const firstService = this.injector.get(FirstService);  // Lazy loading of dependency
  }
}
```

Майте на увазі, що ви таким чином отримуєте інжектор, що створив інстанс даного сервіса. Рівень ієрархії цього інжектора залежить тільки від того, в реєстр якого інжектора передали `SecondService`.

## Мульти-провайдери {#multi-providers}

Цей вид провайдерів існує тільки у вигляді об'єкта, і він відрізняється від звичайних DI-провайдерів наявністю властивості `multi: true`. Такі провайдери доцільно використовувати, коли є потреба у передачі до DI зразу декількох провайдерів з однаковим токеном, щоб DI повернув таку саму кількість значень для цих провайдерів в одному масиві:

```ts
import { Injector } from '@ditsmod/core';
import { LOCAL } from './tokens.js';

const injector = Injector.resolveAndCreate([
  { token: LOCAL, useValue: 'uk', multi: true },
  { token: LOCAL, useValue: 'en', multi: true },
]);

const locals = injector.get(LOCAL); // ['uk', 'en']
```

По-суті, мульти-провайдери дозволяють створювати групи провайдерів, що мають спільний токен. Ця можливість зокрема використовується для створення групи `HTTP_INTERCEPTORS`, а також для створення різних [груп розширень][104].

Не допускається щоб в одному інжекторі однаковий токен мали і звичайні, і мульти-провайдери:

```ts {5-6}
import { Injector } from '@ditsmod/core';
import { LOCAL } from './tokens.js';

const injector = Injector.resolveAndCreate([
  { token: LOCAL, useValue: 'uk' },
  { token: LOCAL, useValue: 'en', multi: true },
]);

const locals = injector.get(LOCAL); // Error: Cannot mix multi providers and regular providers
```

Дочірні інжектори можуть повертати значення мульти-провайдерів батьківського інжектора, лише якщо при їх створенні їм не передавались провайдери з такими самими токенами:

```ts
import { InjectionToken, Injector } from '@ditsmod/core';

const LOCAL = new InjectionToken('LOCAL');

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
import { LOCAL } from './tokens.js';

const parent = Injector.resolveAndCreate([
  { token: LOCAL, useValue: 'uk', multi: true },
  { token: LOCAL, useValue: 'en', multi: true },
]);

const child = parent.resolveAndCreateChild([
  { token: LOCAL, useValue: 'аа', multi: true }
]);

const locals = child.get(LOCAL); // ['аа']
```

### Підміна мультипровайдерів {#multi-provider-substitution}

Щоб стала можливою підміна конкретного мультипровайдера, можна зробити так:

1. передайте певний клас в об'єкт мультипровайдера використовуючи властивість `useToken`;
2. потім даний клас передайте у якості `ClassProvider`;
3. наступним в масив провайдерів потрібно передати провайдер для підміни даного класу.

```ts
import { Injector, HTTP_INTERCEPTORS } from '@ditsmod/core';

import { DefaultInterceptor } from './default.interceptor.js';
import { MyInterceptor } from './my.interceptor.js';

const injector = Injector.resolveAndCreate([
  { token: HTTP_INTERCEPTORS, useToken: DefaultInterceptor, multi: true },
  DefaultInterceptor,
  { token: DefaultInterceptor, useClass: MyInterceptor }
]);

const locals = injector.get(HTTP_INTERCEPTORS); // [MyInterceptor]
```

Така конструкція має сенс, наприклад, якщо перші два пункти виконуються десь у зовнішньому модулі, до якого у вас немає доступу на редагування, а третій пункт виконує вже користувач поточного модуля.

## Передача провайдерів в реєстр DI {#transfer-of-providers-to-the-di-registry}

На одну залежність, в реєстр DI потрібно передавати один або декілька провайдерів. Частіше за все, провайдери передаються в реєстр DI через метадані модулів, хоча інколи вони передаються через метадані контролерів, або навіть напряму в [інжектори][102]. В наступному прикладі `SomeService` передається в масив `providersPerMod`:

```ts {9}
import { featureModule } from '@ditsmod/core';

import { SomeService } from './some.service.js';
import { SomeController } from './some.controller.js';

@featureModule({
  controllers: [SomeController],
  providersPerMod: [
    SomeService
  ],
})
export class SomeModule {}
```

Після такої передачі, споживачі провайдерів можуть використовувати `SomeService` в межах `SomeModule`. Ідентичний результат буде, якщо ми цей же провайдер передамо у форматі об'єкта:

```ts {9}
import { featureModule } from '@ditsmod/core';

import { SomeService } from './some.service.js';
import { SomeController } from './some.controller.js';

@featureModule({
  controllers: [SomeController],
  providersPerMod: [
    { token: SomeService, useClass: SomeService }
  ],
})
export class SomeModule {}
```

І тепер давайте додатково з цим же токеном передамо інший провайдер, але на цей раз у метадані контролера:

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
import { featureModule } from '@ditsmod/core';
import { ConfigService } from './config.service.js';

@featureModule({
  providersPerMod: [
    { token: ConfigService, useValue: { propery1: 'some value' } }
  ],
})
export class SomeModule {}
```

## Повторне додавання провайдерів {#re-adding-providers}

Різні провайдери з одним і тим самим токеном можна додавати багато разів в метадані модуля чи контролера, але DI вибере той із провайдерів, що додано останнім (виключення з цього правила є, але це стосується лише мульти-провайдерів):

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

Окрім цього, різні провайдери з одним і тим самим токеном можна передавати одночасно на декількох різних рівнях ієрархії, але DI завжди буде вибирати найближчі інжектори (тобто, якщо значення для провайдера запитується на рівні запиту, то спочатку буде проглядатись інжектор на рівні запиту, і лише якщо там немає потрібного провайдера, DI буде підніматись до батьківських інжекторів):

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

## Редагування значень в реєстрі DI {#editing-values-​​in-the-di-register}

Як вже було сказано раніше, в реєстр DI передаються _провайдери_, з яких потім формуються _значення_, щоб в кінцевому результаті мати мапінг між токеном та його значенням:

```
token1 -> value15
token2 -> value100
...
```

Окрім цього, існує можливість редагування готових _значень_ реєстра DI:

```ts {4}
import { Injector } from '@ditsmod/core';

const injector = Injector.resolveAndCreate([{ token: 'token1', useValue: undefined }]);
injector.setByToken('token1', 'value1');
injector.get('token1'); // value1
```

Зверніть увагу, що в даному разі до реєстру спочатку передається провайдер з `token1`, який має значення `undefined`, і лише потім ми змінюємо значення для даного токена. Якщо ви спробуєте редагувати значення для токена, якого у реєстрі немає, DI кине приблизно таку помилку:

```text
DiError: Setting value by token failed: cannot find token in register: "token1". Try adding a provider with the same token to the current injector via module or controller metadata.
```

У більшості випадків, редагування значень використовують [інтерсептори][105] або [гарди][106], оскільки вони таким чином передають результат своєї роботи до реєстру:

1. [BodyParserInterceptor][16];
2. [BearerGuard][17].

У якості альтернативи для методу `injector.setByToken()`, можна використовувати еквівалентний вираз:

```ts {5}
import { KeyRegistry } from '@ditsmod/core';

// ...
const { id } = KeyRegistry.get('token1');
injector.setById(id, 'value1');
// ...
```

Переваги використання методу `injector.setById()` в тому, що він швидший за метод `injector.setByToken()`, але лише при умові, якщо ви один раз отримуєте ID із `KeyRegistry`, а потім багато разів використовуєте `injector.setById()`.

## Декоратори `optional`, `fromSelf` та `skipSelf` {#optional-fromSelf-skipSelf-decorators}

Ці декоратори використовуються для управління поведінкою інжектора під час пошуку значень для певного токена.

### optional {#optional}

Інколи вам може знадобитись вказати опціональну (необов'язкову) залежність в конструкторі. Давайте розглянемо наступний приклад, де після властивості `firstService` поставлено знак питання, і таким чином вказано для TypeScript що ця властивість є опціональною:

```ts {6}
import { injectable } from '@ditsmod/core';
import { FirstService } from './first.service.js';

@injectable()
export class SecondService {
  constructor(private firstService?: FirstService) {}
  // ...
}
```

Але DI проігнорує цю опціональність і видасть помилку у разі відсутності можливості для створення `FirstService`. Щоб даний код працював, необхідно скористатись декоратором `optional`:

```ts {6}
import { injectable, optional } from '@ditsmod/core';
import { FirstService } from './first.service.js';

@injectable()
export class SecondService {
  constructor(@optional() private firstService?: FirstService) {}
  // ...
}
```

### fromSelf {#fromSelf}

Декоратори `fromSelf` та `skipSelf` мають сенс у випадку, коли існує певна ієрархія інжекторів. Декоратор `fromSelf` використовується дуже рідко.

```ts
import { injectable, fromSelf, Injector } from '@ditsmod/core';

class Service1 {}

@injectable()
class Service2 {
  constructor(@fromSelf() public service1: Service1) {}
}

const parent = Injector.resolveAndCreate([Service1, Service2]);
const child = parent.resolveAndCreateChild([Service2]);

const service2 = parent.get(Service2) as Service2;
service2.service1 instanceof Service1; // true

child.get(Service2); // Error - Service1 not found
```

Як бачите, `Service2` залежить від `Service1`, причому декоратор `fromSelf` вказує DI: "При створенні інстансу `Service1` використовувати тільки той самий інжектор, який створить інстанс `Service2`, а до батьківського інжектора не потрібно звертатись". Коли створюється батьківський інжектор, йому передають обидва необхідні сервіси, тому при запиті токену `Service2` він успішно вирішить залежність та видасть інстанс цього класу.

А ось при створенні дочірнього інжектора, йому не передали `Service1`, тому при запиті токену `Service2` він не зможе вирішити залежність цього сервісу. Якщо прибрати декоратор `fromSelf` з конструктора, то дочірній іжектор успішно вирішить залежність `Service2`.

### skipSelf {#skipSelf}

Декоратор `skipSelf` використовується частіше, ніж `fromSelf`, але також рідко.

```ts
import { injectable, skipSelf, Injector } from '@ditsmod/core';

class Service1 {}

@injectable()
class Service2 {
  constructor(@skipSelf() public service1: Service1) {}
}

const parent = Injector.resolveAndCreate([Service1, Service2]);
const child = parent.resolveAndCreateChild([Service2]);

parent.get(Service2); // Error - Service1 not found

const service2 = child.get(Service2) as Service2;
service2.service1 instanceof Service1; // true
```

Як бачите, `Service2` залежить від `Service1`, причому декоратор `skipSelf` вказує DI: "При створенні інстансу `Service1` пропустити той інжектор, який створить інстанс `Service2`, і зразу звертатись до батьківського інжектора". Коли створюється батьківський інжектор, йому передають обидва необхідні сервіси, але через `skipSelf` він не може використати значення для `Service1` з власного реєстру, тому він не зможе вирішити вказану залежність.

А при створенні дочірнього інжектора, йому не передали `Service1`, зате він може звернутись до батьківського інжектора за ним. Тому дочірній інжектор успішно вирішить залежність `Service2`.

## Коли DI не може знайти потрібного провайдера {#when-di-cant-find-the-right-provider}

Пам'ятайте, що коли DI не може знайти потрібного провайдера, існує всього три можливі причини:

1. ви не передали потрібний провайдер до DI в метадані модуля чи контролера (ну або у випадку тестування - у `Injector.resolveAndCreate()`);
2. ви не імпортували модуль, де передається потрібний вам провайдер, або ж цей провайдер не експортується;
3. ви запитуєте у батьківському інжекторі провайдер з дочірнього інжектора.


[1]: https://uk.wikipedia.org/wiki/%D0%92%D0%BF%D1%80%D0%BE%D0%B2%D0%B0%D0%B4%D0%B6%D0%B5%D0%BD%D0%BD%D1%8F_%D0%B7%D0%B0%D0%BB%D0%B5%D0%B6%D0%BD%D0%BE%D1%81%D1%82%D0%B5%D0%B9
[11]: https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types
[12]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/tsconfig.json#L31
[14]: https://github.com/tc39/proposal-decorators
[15]: https://uk.wikipedia.org/wiki/%D0%9E%D0%B4%D0%B8%D0%BD%D0%B0%D0%BA_(%D1%88%D0%B0%D0%B1%D0%BB%D0%BE%D0%BD_%D0%BF%D1%80%D0%BE%D1%94%D0%BA%D1%82%D1%83%D0%B2%D0%B0%D0%BD%D0%BD%D1%8F) "Singleton"
[16]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/body-parser/src/body-parser.interceptor.ts#L15
[17]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/examples/14-auth-jwt/src/app/modules/services/auth/bearer.guard.ts#L24

[101]: ../../#installation
[107]: /developer-guides/exports-and-imports
[121]: /components-of-ditsmod-app/providers-collisions
[100]: #transfer-of-providers-to-the-di-registry
[102]: #injector-and-providers
[103]: /components-of-ditsmod-app/controllers-and-services/#what-is-a-controller
[104]: /components-of-ditsmod-app/extensions/#group-of-extensions
[105]: /components-of-ditsmod-app/http-interceptors/
[106]: /components-of-ditsmod-app/guards/
