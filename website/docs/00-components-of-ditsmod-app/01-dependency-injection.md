---
sidebar_position: 1
---

# Dependency Injection

## Підготовка {#prerequisites}

В наступних прикладах даного розділу припускається, що ви клонували репозиторій [ditsmod/rest-starter][101]. Це дасть вам змогу отримати базову конфігурацію для застосунку та експериментувати у теці `src/app` даного репозиторію.

Окрім цього, якщо ви ще не знаєте, що саме робить рефлектор і що таке "вирішення залежностей", рекомендуємо вам спочатку прочитати попередній розділ [Декоратори та рефлектор][108].

## Інжектор, токени та провайдери {#injector-and-providers}

У [попередньому розділі][108] ми побачили як в конструкторі можна вказувати залежність одного класу від іншого класу, а також як можна автоматично визначити ланцюжок залежностей за допомогою рефлектора. Тепер давайте познайомимось з **інжектором** - механізмом який зокрема дозволяє отримувати інстанси класів, з врахуванням їхніх залежностей. Інжектор працює дуже просто: приймає **токен**, і видає значення для цього токена. Очевидно, що для такої функціональності потрібні інструкції між тим, що запитують в інжектора, і тим що він видає. Такі інструкції забезпечуються так званими **провайдерами**.

Давайте розглянемо наступний приклад, який трохи розширює останній приклад з розділу [Декоратори та рефлектор][108]:

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
  { token: Service1, useClass: Service1 },
  { token: Service2, useClass: Service2 },
  { token: Service3, useClass: Service3 }
]);
const service3 = injector.get(Service3); // Instance of Service3
service3 === injector.get(Service3); // true
```

Як бачите, метод `Injector.resolveAndCreate()` на вході приймає масив провайдерів, а на виході видає **інжектор**, який вміє створювати інстанс кожного переданого класу за допомогою методу `injector.get()`, з урахуванням усього ланцюжка залежностей (`Service3` -> `Service2` -> `Service1`).

Отже, які задачі стоять перед інжектором, і що робить його метод `injector.get()`:

1. Під час створення інжектора, йому передається масив провайдерів - тобто масив інструкцій між тим, що у нього запитують (токеном), та тим, що він повинен видавати (значенням). Цей етап є дуже важливим для подальшого функціонування інжектора. Якщо ви не передасте усіх необхідних провайдерів, інжектор не матиме відповідних інструкцій, коли ви будете запитувати певний токен.
2. Після створення інжектора, коли у нього запитують токен `Service3`, він проглядає конструктор цього класу, бачить залежність від `Service2`.
3. Потім проглядає конструктор у `Service2`, бачить залежність від `Service1`.
4. Потім проглядає конструктор у `Service1`, не знаходить там залежності, і тому першим створює інстанс `Service1`.
5. Потім створює інстанс `Service2` використовуючи інстанс `Service1`.
6. І останнім створює інстанс `Service3` використовуючи інстанс `Service2`.
7. Якщо пізніше будуть запитувати повторно інстанс `Service3`, метод `injector.get()` буде повертати раніше створений інстанс `Service3` з кешу даного інжектора.

Давайте тепер порушимо пункт 1, і спробуємо під час створення інжектора передати йому пустий масив. В такому разі виклик `injector.get()` кидатиме помилку:

```ts
const injector = Injector.resolveAndCreate([]);
const service3 = injector.get(Service3); // Error: No provider for Service3!
```

Як і варто було очікувати, коли ми передаємо пустий масив замість масиву провайдерів, а потім запитуємо в інжектора токен `Service3`, інжектор кидає помилку вимагаючи **провайдера** для даного токена.

До речі, два наступні інжектори отримують еквівалентні провайдери:

```ts
const injector1 = Injector.resolveAndCreate([
  { token: Service1, useClass: Service1 },
  { token: Service2, useClass: Service2 },
  { token: Service3, useClass: Service3 }
]);
const injector2 = Injector.resolveAndCreate([
  Service1,
  Service2,
  Service3
]);
```

Щоб краще зрозуміти якими можуть бути провайдери, давайте передамо інжектору масив провайдерів в наступній формі:

```ts {9-12}
import { Injector } from '@ditsmod/core';

class Service1 {}
class Service2 {}
class Service3 {}
class Service4 {}

const injector = Injector.resolveAndCreate([
  { token: Service1, useValue: 'value for Service1' },
  { token: Service2, useClass: Service2 },
  { token: Service3, useFactory: () => 'value for Service3' },
  { token: Service4, useToken: Service3 },
]);
injector.get(Service1); // value for Service1
injector.get(Service2); // instance of Service2
injector.get(Service3); // value for Service3
injector.get(Service4); // value for Service3
```

Зверніть увагу, що у цьому прикладі не використовується декоратор `injectable`, оскільки кожен представлений тут клас не має конструктора, де б можна було вказати залежності.

Як бачите, тепер під час створення інжектора, замість класів ми передали масив з об'єктами. Ці об'єкти також називаються **провайдерами**. Кожен провайдер представляє собою інструкцію для DI:

1. Якщо запитується токен `Service1`, потрібно видавати текст `value for Service1`.
2. Якщо запитується токен `Service2`, треба спочатку створити інстанс `Service2`, а потім видати його.
3. Якщо запитується токен `Service3`, треба запустити надану функцію, яка видає текст `value for Service3`.
4. Якщо запитується токен `Service4`, треба видати значення для токену `Service3`, тобто треба видати текст `value for Service3`.

Тепер, коли ми передали до інжектора провайдери у вигляді інструкцій, стає більш зрозуміло, що інжектору необхідні інструкції для мапінгу між тим, що у нього запитують (токеном), та тим що він видає (значенням). В документації такий мапінг також може називатись **реєстром інжектора** або **реєстром провайдерів**. Для інжектора **токен** - це ідентифікатор для пошуку значення у його реєстрі.

### Коротка та довга форма передачі токенів у методах класу {#short-and-long-form-of-token-passing-in-class-methods}

Якщо у якості типу параметра конструктора використовується клас, його одночасно можна використовувати у якості токена:

```ts {7}
import { injectable } from '@ditsmod/core';

class Service1 {}

@injectable()
class Service2 {
  constructor(service1: Service1) {} // Коротка форма вказання залежності
}
```

Дуже важливо розуміти, що сам механізм використання токенів потрібний для JavaScript-runtime, тому у якості токенів не можна використовувати такі типи, які у TypeScript-коді ви оголошуєте з ключовими словами `interface`, `type`, `enum`, `declare` і т.п., бо їх не існує у JavaScript-коді. Окрім цього, токени не можна імпортувати з ключовим словом `type`, оскільки у JavaScript-коді такого імпорту не буде.

На відміну від класу, масив не може одночасно використовуватись і у якості TypeScript-типу, і у якості токену. З іншого боку, токен може мати зовсім нерелевантний тип даних відносно залежності, з якою він асоціюється, тому, наприклад, рядковий тип токена може асоціюватись із залежністю, що має будь-який TypeScript-тип, включаючи масиви, інтерфейси, enum і т.д.

Передати токен можна у короткій або довгій формі вказання залежності. В останньому прикладі використовується **коротка форма** вказання залежності, вона має суттєві обмеження, бо таким чином можна вказати залежність лише від певного _класу_.

А ще існує **довга форма** вказання залежності за допомогою декоратора `inject`, вона дозволяє використовувати альтернативний токен:

```ts {10}
import { injectable, inject } from '@ditsmod/core';

interface InterfaceOfItem {
  one: string;
  two: number;
}

@injectable()
export class Service1 {
  constructor(@inject('some-string') private someArray: InterfaceOfItem[]) {} // Довга форма вказання залежності
  // ...
}
```

Коли використовується `inject`, DI бере до уваги лише переданий в нього токен. В даному разі DI ігнорує тип змінної - `InterfaceOfItem[]`, використовуючи в якості токена текстовий рядок `some-string`. Іншими словами, DI використовує `some-string` як ключ для пошуку відповідного значення для залежності, і для DI взагалі ніякого значення не має тип для цього параметра - тобто `InterfaceOfItem[]`. Таким чином, DI дає можливість розділяти токен та тип змінної, тому в конструкторі можна отримати будь-який тип залежності, включаючи різні типи масивів чи enum.

Токеном може бути референс на клас, об'єкт чи функцію, також у якості токену можна використовувати текстові, числові значення, та символи. Для довгої форми вказання залежностей, у якості токена рекомендуємо використовувати інстанс класу `InjectionToken<T>`, оскільки клас `InjectionToken<T>` має параметризований тип `T`, за допомогою якого можна вказати тип даних, який асоціюється з даним токеном:

```ts {5,14}
// tokens.ts
import { InjectionToken } from '@ditsmod/core';
import { InterfaceOfItem } from './types.js';

const SOME_TOKEN = new InjectionToken<InterfaceOfItem[]>('SOME_TOKEN');

// second-service.ts
import { injectable, inject } from '@ditsmod/core';
import { InterfaceOfItem } from './types.js';
import { SOME_TOKEN } from './tokens.js';

@injectable()
export class Service1 {
  constructor(@inject(SOME_TOKEN) private someArray: InterfaceOfItem[]) {}
  // ...
}
```

### Провайдер {#provider}

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

Якщо провайдер представлено у вигляді об'єкта, його типи можна імпортувати з `@ditsmod/core`:

```ts
import { ValueProvider, ClassProvider, FactoryProvider, TokenProvider } from '@ditsmod/core';
```

Більш детально про кожен із цих типів:

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

      Зверніть увагу, що у властивість `deps` передаються саме _токени_ провайдерів, і DI їх сприймає саме як токени, а не як провайдери. Тобто для цих токенів до реєстру DI ще треба буде передати відповідні провайдери. Також зверніть увагу, що у `deps` не передаються декоратори для параметрів (наприклад `optional`, `skipSelf` і т.д.). Якщо для вашої фабрики необхідні декоратори параметрів - вам потрібно скористатись `ClassFactoryProvider`.

4. **TokenProvider** - цей тип провайдера має властивість `useToken`, в яку передається інший токен. Якщо ви записуєте таке:

    ```ts
    { token: Service2, useToken: Service1 }
    ```

    Таким чином ви говорите DI: "Коли споживачі провайдерів запитують токен `Service2`, потрібно використати значення для токена `Service1`". Іншими словами, ця директива робить аліас `Service2`, який вказує на `Service1`. Отже, `TokenProvider` не є самодостатнім, на відміну від інших типів провайдерів, і в кінцевому підсумку він завжди повинен вказувати на інші типи провайдерів - на `TypeProvider`, `ValueProvider`, `ClassProvider` чи `FactoryProvider`:

    ```ts {4}
    import { Injector } from '@ditsmod/core';

    const injector = Injector.resolveAndCreate([
      { token: 'token1', useValue: 'some value for token1' }, // <-- non TokenProvider
      { token: 'token2', useToken: 'token1' },
    ]);
    console.log(injector.get('token1')); // some value for token1
    console.log(injector.get('token2')); // some value for token1
    ```

    Тут під час створення інжектора передається `TokenProvider`, який вказує на `ValueProvider`, тому цей код працюватиме. Якщо ж ви цього не зробите, то DI кидатиме помилку:

    ```ts
    import { Injector } from '@ditsmod/core';

    const injector = Injector.resolveAndCreate([
      { token: 'token1', useToken: 'token2' },
    ]);
    injector.get('token1'); // Error! No provider for token2! (token1 -> token2)
    // OR
    injector.get('token2'); // Error! No provider for token2!
    ```

    Це стається через те, що ви говорите DI: "Якщо у тебе будуть запитувати `token1`, то використовуй значення для `token2`", але ви не передаєте значення для `token2`.
    
    З іншого боку, ваш `TokenProvider` може вказувати на той же тип - `TokenProvider` - у якості проміжного значення, але в кінцевому підсумку `TokenProvider` завжди повинен вказувати на провайдер іншого типу:

    ```ts {4}
    import { Injector } from '@ditsmod/core';

    const injector = Injector.resolveAndCreate([
      { token: 'token1', useValue: 'some value for token1' }, // <-- non TokenProvider
      { token: 'token2', useToken: 'token1' },
      { token: 'token3', useToken: 'token2' },
      { token: 'token4', useToken: 'token3' },
    ]);
    console.log(injector.get('token4')); // some value for token1
    ```

Тепер, коли ви вже ознайомились з поняттям **провайдер**, можна уточнити, що під **залежністю** розуміють залежність саме від **значення провайдера**. Таку залежність мають **споживачі** значень провайдерів або в конструкторах сервісів, або в конструкторах чи методах контролерів, або в методі `get()` [інжекторів][102].

## Ієрархія та інкапсуляція інжекторів  {#hierarchy-and-encapsulation-of-injectors}

DI надає можливість створювати ще й ієрархію та інкапсуляцію інжекторів, в якій беруть участь батьківські та дочірні інжектори. Саме завдяки ієрархії та інкапсуляції - і будується структура та модульність застосунку. З іншого боку, якщо є інкапсуляція, існують правила, які треба вивчити, щоб орієнтуватись, коли один сервіс може отримати доступ до певного провайдера, а коли - ні.

Давайте розглянемо наступну ситуацію. Уявіть, що вам треба створити дефолтну конфігурацію для логера, яка буде використовуватись для усього застосунку. Але для певного модуля рівень виводу повідомлень треба підвищити, наприклад щоб робити дебаг цього конкретного модуля. Це означає, що на рівні даного модуля ви будете змінювати конфігурацію, і вам треба, щоб вона не впливала на дефолтне значення та інші модулі. Саме для цього і призначається ієрархія інжекторів. Самий вищій в ієрархії - інжектор на рівні застосунку, а від нього вже відгалуджуються інжектори для кожного модуля. Причому важливою особливістю є те, що вищій в ієрархії інжектор не має доступу до нижчих в ієрархії інжекторів. А ось нижчі в ієрархії інжектори можуть мати доступ до вищих в ієрархії інжекторів. Саме тому інжектори на рівні модуля можуть отримувати, наприклад конфігурацію логера від інжектора на рівні застосунку, якщо на рівня модуля вони не отримали змінену конфігурацію.

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

### Ланцюжок залежностей на різних рівнях {#chain-of-dependencies-at-different-levels}

Ланцюжок залежностей провайдерів може бути досить складним, а ієрархія інжекторів ще додає складності. Давайте розглянемо простий випадок, а потім ускладнемо його. Отже в наступному прикладі `Service` залежить від `Config`, причому обидва провайдери передаються в один інжектор:

```ts {14-15,19}
import { injectable, Injector } from '@ditsmod/core';

class Config {
  one: any;
  two: any;
}

@injectable()
class Service {
  constructor(public config: Config) {}
}

const parent = Injector.resolveAndCreate([
  Service,
  { token: Config, useValue: { one: 1, two: 2 } }
]);

const child = parent.resolveAndCreateChild([
  // Пустий масив
]);

parent.get(Service).config; // returns { one: 1, two: 2 }
child.get(Service).config; // returns { one: 1, two: 2 } from parent injector
```

Як бачите, в даному прикладі створюються батьківський та дочірній інжектори, причому як `Service`, так і його залежність - `Config` - передаються в батьківський інжектор. В такому разі, коли з батьківського класу запитується значення за токеном `Service`, DI буде діяти за такою логікою:

1. спочатку інжектор проглядає список залежностей у `Service` і бачить там `Config`;
2. потім інжектор проглядає список залежностей у `Config`, але цей провайдер не має залежностей;
3. першим створюється інстанс `Config`, а потім - інстанс `Service`.

Коли ж дочірній інжектор створюють з пустим масивом провайдерів, за будь-яким запитом від буде звертатись до батьківсього інжектора:

1. спочатку DI прогляне дочірній інжектор і не знайде там `Service`;
2. потім інжектор звернеться до батьківського інжектора і отримає від нього вже готовий інстанс `Service`.

Поки що все просто. Давайте тепер ускладнимо приклад передавши різні значення для токена `Config` у батьківський та дочірній інжектор:

```ts {14-15,19}
import { injectable, Injector } from '@ditsmod/core';

class Config {
  one: any;
  two: any;
}

@injectable()
class Service {
  constructor(public config: Config) {}
}

const parent = Injector.resolveAndCreate([
  Service,
  { token: Config, useValue: { one: 1, two: 2 } }
]);

const child = parent.resolveAndCreateChild([
  { token: Config, useValue: { one: 11, two: 22 } }
]);
```

Розглядаючи даний приклад, нагадайте собі, що батьківський інжектор не бачить дочірніх інжекторів, тому будь-яка зміна в дочірньому інжекторі ніяк не впливає на батьківський інжектор. Тобто, для батьківського інжектора тут нічого не змінилось, оскільки він отримує точно такі самі провайдери, як і у попередньому прикладі.

А як щодо дочірнього інжектора? Тепер він отримав свою власну версію провайдера з токеном `Config`, яка відрізняється від батьківської версії. То як тепер дочірній інжектор буде діяти, коли у нього запитають наступне?

```ts
child.get(Service).config;
```

Корисно спочатку подумати над цим самостійно, щоб краще закріпити дану особливість в пам'яті. Подумали? Ок, логіка у даного інжектора буде наступною:

1. спочатку DI прогляне дочірній інжектор і не знайде там `Service`;
2. потім інжектор звернеться до батьківського інжектора і отримає від нього вже готовий інстанс `Service`. Тому даний вираз поверне `{ one: 1, two: 2 }`.

Трохи неочікувано, правда ж? Мабуть багато хто подумав, що для створення інстансу `Service` буде використовуватись локальна - дочірня версія `Config`, що має значення `{ one: 11, two: 22 }`. Але зверніть увагу, що спочатку у дочірнього інжектора запитують саме `Service`, якого у нього немає, тому він змушений звернутись до батьківського інжектора за інстансом `Service`. І оскільки потім батьківський інжектор вирішує залежності `Service` у своєму контексті, тому він якраз і використовує свою локальну версію `Config`, що має значення `{ one: 1, two: 2 }`.

Коли ж замість `Service` ми запитаємо `Config` у дочірнього інжектора, то він видасть очікувано своє локальне значення:

```ts
child.get(Config); // { one: 11, two: 22 }
```

Здогадуєтесь, що можна зробити щоб при запиті `Service` у дочірнього інжектора можна було отримати локальну версію `Config`? - Так, при створенні дочірнього інжектора ми можемо передати йому також `Service`, щоб він не звертався до батьківського інжектора:

```ts {19}
import { injectable, Injector } from '@ditsmod/core';

class Config {
  one: any;
  two: any;
}

@injectable()
class Service {
  constructor(public config: Config) {}
}

const parent = Injector.resolveAndCreate([
  Service,
  { token: Config, useValue: { one: 1, two: 2 } }
]);

const child = parent.resolveAndCreateChild([
  Service,
  { token: Config, useValue: { one: 11, two: 22 } }
]);
```

Все, тепер дочірній інжектор має як `Service`, так і `Config`, тому він не буде звертатись до батьківсього інжектора:

```ts
child.get(Service).config; // { one: 11, two: 22 }
```

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

### Ієрархія інжекторів в застосунку Ditsmod {#hierarchy-of-injectors-in-the-ditsmod-application}

Пізніше в документації ви зустрічатимете наступні властивості об'єкта, які передаються через метадані модуля:

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

Нагадаємо, що вищі в ієрархії інжектори не мають доступу до нижчих в ієрархії інжекторів. Це означає, що **при передачі класу у певний інжектор, потрібно знати найнижчий рівень ієрархії його залежностей**.

Наприклад, якщо ви напишете клас, що має залежність від HTTP-запиту, ви зможете його передати тільки у масив `providersPerReq`, бо тільки з цього масиву формується інжектор, до якого Ditsmod буде автоматично додавати провайдер з об'єктом HTTP-запиту. З іншого боку, інстанс цього класу матиме доступ до усіх своїх батьківських інжекторів: на рівні роуту, модуля, та застосунку. Тому клас, що передається в масив `providersPerReq` може залежати від провайдерів на будь-якому рівні.

Також ви можете написати певний клас і передати його в масив `providersPerMod`, в такому разі він може залежати тільки від провайдерів на рівні модуля, або на рівні застосунку. Якщо він буде залежати від провайдерів, які ви передали в масив `providersPerRou` чи `providersPerReq`, ви отримаєте помилку про те, що ці провайдери не знайдені.

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

По-суті, мульти-провайдери дозволяють створювати групи провайдерів, що мають спільний токен. Ця можливість зокрема використовується для створення групи `HTTP_INTERCEPTORS`.

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
2. потім даний клас передайте у якості `ClassProvider` чи `TypeProvider`;
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
[15]: https://uk.wikipedia.org/wiki/%D0%9E%D0%B4%D0%B8%D0%BD%D0%B0%D0%BA_(%D1%88%D0%B0%D0%B1%D0%BB%D0%BE%D0%BD_%D0%BF%D1%80%D0%BE%D1%94%D0%BA%D1%82%D1%83%D0%B2%D0%B0%D0%BD%D0%BD%D1%8F) "Singleton"
[16]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/body-parser/src/body-parser.interceptor.ts#L15
[17]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/examples/14-auth-jwt/src/app/modules/services/auth/bearer.guard.ts#L24

[101]: ../../#installation
[102]: #injector-and-providers
[104]: /components-of-ditsmod-app/extensions/#group-of-extensions
[105]: /components-of-ditsmod-app/http-interceptors/
[106]: /components-of-ditsmod-app/guards/
[107]: /developer-guides/exports-and-imports/
[108]: /components-of-ditsmod-app/decorators-and-reflector/
[121]: /components-of-ditsmod-app/providers-collisions/
