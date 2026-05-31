---
sidebar_position: 1
---

# Dependency Injection

## Підготовка {#prerequisites}

В наступних прикладах даного розділу припускається, що ви клонували репозиторій [ditsmod/rest-starter][101]. Це дасть вам змогу отримати базову конфігурацію для застосунку та експериментувати у теці `src/app` даного репозиторію.

Окрім цього, якщо ви ще не знаєте, що саме робить рефлектор і що таке "вирішення залежностей", рекомендуємо вам спочатку прочитати попередній розділ [Декоратори та рефлектор][108].

## Інжектор, токени та провайдери {#injector-and-providers}

В контексті Dependency Injection (DI) часто говорять про інжектори (їх також називають контейнерами), токени, сервіси та провайдери. Якщо для вас ці терміни є новими, вам мають допомогти наступні асоціації з реального життя:

- **Токен** — Хоча це слово у побуті часто означає жетон для метро або фішку в грі, у DI воно працює як квиток у камеру схову. Тобто в DI токен - це ідентифікатор, за яким можна знайти потрібне значення.
- **Провайдер** - В побутовому житті цей термін означає компанію, яка надає певний сервіс або товар. В DI же цей термін означає інструкцію (мапінг), що містить токен та відповідний сервіс чи значення. В технічному плані, найпростіше уявляти провайдер, наприклад, у вигляді такого об'єкту:
  ```ts
  { token: 'some-token', useValue: 'some-value' }
  ```
  В даному разі це інструкція, яка говорить: "Коли запитують `some-token` - потрібно видати `some-value`".
- **Інжектор** (також відомий як контейнер) - цей термін у побуті використовується рідко, хоча сама його концепція у побуті досить поширена і нагадує працівника камери схову. Ви видаєте свій квиток (токен) працівнику камери схову, і він знаходить відповідну комірку, дістає її вміст і передає її вам. Таким чином, інжектор - це механізм, що приймає токен і повертає відповідне значення, спираючись на інструкції, залишені провайдерами

У [попередньому розділі][108] ми побачили як в конструкторі можна вказувати залежність одного класу від іншого класу, а також як можна автоматично визначити ланцюжок залежностей за допомогою рефлектора. В контексті Dependency Injection такі класи часто називають **сервісами**. Тепер давайте познайомимось ближче з **інжектором** - механізмом, який дозволяє отримувати інстанси сервісів, з врахуванням їхніх залежностей. Інжектор працює дуже просто: приймає **токен** і повертає значення, пов'язане з цим токеном. Очевидно, що для такої функціональності потрібні інструкції між тим, що запитують в інжектора, і тим що він видає. Такі інструкції забезпечуються так званими **провайдерами**.

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
const service3 = injector.get(Service3); // інстанс Service3
service3 === injector.get(Service3); // true
```

Як бачите, метод `Injector.resolveAndCreate()` на вході приймає масив провайдерів, а на виході видає **інжектор**, який вміє створювати інстанс кожного переданого класу за допомогою методу `injector.get()`, з урахуванням усього ланцюжка залежностей (`Service3` -> `Service2` -> `Service1`).

Отже, які задачі стоять перед інжектором, і що робить його метод `injector.get()`:

1. Під час створення інжектора, йому передається масив провайдерів - тобто масив інструкцій між тим, що у нього запитують (токеном), та тим, що він повинен видавати (значенням). Цей етап є дуже важливим для подальшого функціонування інжектора. Якщо ви не передасте усіх необхідних провайдерів, інжектор не матиме відповідних інструкцій, коли ви будете запитувати певний токен.
2. Після створення інжектора, коли у нього запитують токен `Service3`, він проглядає масив провайдерів і бачить там інструкцію `{ token: Service3, useClass: Service3 }`, тому він "розуміє", що для токена `Service3` треба видавати інстанс класу `Service3`.
3. Потім він проглядає конструктор класу `Service3`, бачить залежність від `Service2`.
4. Далі інжектор проглядає свій масив провайдерів і бачить там інструкцію `{ token: Service2, useClass: Service2 }`, тому він "розуміє", що для токена `Service2` треба видавати інстанс класу `Service2`.
5. Потім проглядає конструктор у `Service2`, бачить залежність від `Service1`.
6. Далі інжектор проглядає масив провайдерів і бачить там інструкцію `{ token: Service1, useClass: Service1 }`, тому він "розуміє", що для токена `Service1` треба видавати інстанс класу `Service1`.
7. Потім проглядає конструктор у `Service1`, не знаходить там залежності, і тому першим створює інстанс `Service1`.
8. Потім створює інстанс `Service2` використовуючи інстанс `Service1`.
9. І останнім створює інстанс `Service3` використовуючи інстанс `Service2`.
10. Якщо пізніше будуть запитувати повторно інстанс `Service3`, метод `injector.get()` буде повертати раніше створений інстанс `Service3` з кешу даного інжектора.

У підсумку ми можемо констатувати, що `injector.get()` дійсно працює дуже просто: приймає токен `Service3`, і видає його значення - інстанс класу `Service3`. Але щоб так діяти, інжектор, по-перше, бере до уваги наданий йому масив провайдерів. По-друге, він враховує ланцюжок залежностей кожного із провайдерів.

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

Давайте тепер порушимо пункт 1, і спробуємо під час створення інжектора передати йому пустий масив. В такому разі виклик `injector.get()` кидатиме помилку:

```ts
const injector = Injector.resolveAndCreate([]);
const service3 = injector.get(Service3); // Error: No provider for Service3!
```

Як і варто було очікувати, коли ми передаємо пустий масив замість масиву провайдерів, а потім запитуємо в інжектора токен `Service3`, інжектор кидає помилку вимагаючи **провайдера** для даного токена.

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
injector.get(Service2); // інстанс Service2
injector.get(Service3); // value for Service3
injector.get(Service4); // value for Service3
```

Зверніть увагу, що у цьому прикладі не використовується декоратор `injectable`, оскільки кожен представлений тут клас не має конструктора, де б можна було вказати залежності.

Як бачите, тепер під час створення інжектора ми передали масив провайдерів чотирьох типів. Пізніше кожен із цих типів буде формально описано, але і без цього можна здогадатись, які інструкції несуть ці провайдери до інжектора:

1. Якщо запитується токен `Service1`, потрібно видавати текст `value for Service1`.
2. Якщо запитується токен `Service2`, треба спочатку створити інстанс `Service2`, а потім видати його.
3. Якщо запитується токен `Service3`, треба запустити надану функцію, яка видає текст `value for Service3`.
4. Якщо запитується токен `Service4`, треба видати значення для токену `Service3`, тобто треба видати текст `value for Service3`.

### Коротка та довга форми декларації залежностей у методах класу {#short-and-long-forms-of-declaring-dependencies-in-class-methods}

Якщо у якості типу параметра конструктора використовується клас, його одночасно можна використовувати у якості токена:

```ts {7}
import { injectable } from '@ditsmod/core';

class Service1 {}

@injectable()
class Service2 {
  constructor(service1: Service1) {} // Коротка форма декларування залежності
}
```

Дуже важливо розуміти, що сам механізм використання токенів потрібний для JavaScript-runtime, тому у якості токенів не можна використовувати такі типи, які у TypeScript-коді ви оголошуєте з ключовими словами `interface`, `type`, `enum`, `declare` і т.п., бо їх не існує у JavaScript-коді. Окрім цього, токени не можна імпортувати з ключовим словом `type`, оскільки у JavaScript-коді такого імпорту не буде.

На відміну від класу, масив не може одночасно використовуватись і у якості TypeScript-типу, і у якості токену. З іншого боку, токен може мати зовсім нерелевантний тип даних відносно залежності, з якою він асоціюється, тому, наприклад, рядковий тип токена може асоціюватись із залежністю, що має будь-який TypeScript-тип, включаючи масиви, інтерфейси, enum і т.д.

Декларувати зележність можна у короткій або довгій формі. В останньому прикладі використовується **коротка форма** декларування залежності, вона має суттєві обмеження, бо таким чином можна вказати залежність лише від певного _класу_.

А ще існує **довга форма** декларування залежності за допомогою декоратора `inject`, вона дозволяє використовувати альтернативний токен:

```ts {10}
import { injectable, inject } from '@ditsmod/core';

interface InterfaceOfItem {
  one: string;
  two: number;
}

@injectable()
export class Service1 {
  constructor(@inject('some-string') private someArray: InterfaceOfItem[]) {} // Довга форма декларування залежності
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

// service1.ts
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

Типи провайдерів можна імпортувати з `@ditsmod/core`:

```ts
import { ValueProvider, ClassProvider, FactoryProvider, TokenProvider } from '@ditsmod/core';
```

Більш детально про кожен із цих типів:

1. **ValueProvider** - цей тип провайдера має властивість `useValue`, в яку передається будь-яке значення, і значення якого буде використано як значення даного провайдера. Приклад такого провайдера:

    ```ts
    { token: 'token1', useValue: 'some value' }
    ```

2. **ClassProvider** - цей тип провайдера має властивість `useClass`, в яку передається клас, чий інстанс буде використано як значення цього провайдера. Приклад такого провайдера:

    ```ts
    { token: 'token2', useClass: SomeService }
    ```

3. **FactoryProvider** - цей тип провайдера має властивість `useFactory`, і він має два підтипи:

    - **ClassFactoryProvider** (рекомендовано, через свою кращу інкапсуляцію) передбачає, що до `useFactory` передається [tuple][11], де на першому місці повинен бути клас, а на другому місці - метод цього класу, який повинен повернути якесь значення для вказаного токена. Наприклад, якщо клас буде таким:

      ```ts
      import { factoryMethod } from '@ditsmod/core';

      export class ClassWithFactory {
        @factoryMethod()
        method1(Dependency1: Dependency1, dependecy2: Dependecy2) {
          // ...
          return '...';
        }
      }
      ```

      В такому разі, провайдер потрібно передавати в наступному форматі:

      ```ts
      { token: 'token3', useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] }
      ```

      Спочатку DI створить інстанс цього класу, потім викличе його метод та отримає результат, який вже і буде значенням даного провайдера. Метод указаного класу може повертати будь-яке значення.

    - **FunctionFactoryProvider** передбачає, що до `useFactory` можна передавати функцію, яка може мати параметри - тобто може мати залежність. Цю залежність необхідно додатково вручну вказувати у властивості `deps` у вигляді масиву токенів, причому порядок передачі токенів важливий:

      ```ts {6}
      function fn(Dependency1: Dependency1, dependecy2: Dependecy2) {
        // ...
        return 'some value';
      }

      { token: 'token3', deps: [Dependency1, Dependecy2], useFactory: fn }
      ```

      Зверніть увагу, що у властивість `deps` передаються саме _токени_ провайдерів, і DI їх сприймає саме як токени, а не як провайдери. Тобто для цих токенів, в масив провайдерів ще треба буде передати відповідні провайдери. Також зверніть увагу, що у `deps` не передаються [декоратори для параметрів][103] (наприклад `optional`, `skipSelf` і т.д.). Якщо для вашої фабрики необхідні декоратори параметрів - вам потрібно скористатись `ClassFactoryProvider`.

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

    Тобто, у провайдера з `token4` є наступний ланцюжок залежностей: `token4` -> `token3` -> `token2` -> `token1`. Саме тому, коли в інжектора запитують `token4`, в кінцевому підсумку він видає значення для `token1`.

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

child.get(Service1); // інстанс Service1
parent.get(Service1); // інстанс Service1

parent.get(Service1) === child.get(Service1); // true

child.get(Service2); // інстанс Service2
parent.get(Service2); // інстанс Service2

parent.get(Service2) === child.get(Service2); // false

child.get(Service3); // інстанс Service3
parent.get(Service3); // Error: No provider for Service3!

child.get(Service4); // Error: No provider for [Service4 in injector2 >> injector1]!
parent.get(Service4); // Error: No provider for Service4!
```

Як бачите, при створенні дочірнього інжектора, йому не передали `Service1`, тому при запиті у нього значення для цього токена, він візьме його у батьківського інжектора. До речі, тут є один неочевидний, але дуже важливий момент: через метод `get()`, у разі потреби, дочірні інжектори можуть запитувати у батьківських інжекторів значення для певних токенів, а самостійно вони їх не створюють. Саме тому цей вираз повертає `true`:

```ts
parent.get(Service1) === child.get(Service1); // true
```

Оскільки це дуже важлива особливість в ієрархії інжекторів, давайте ще раз опишемо її: значення певного провайдера зберігається саме у тому інжекторі, в який передається відповідний провайдер. Тобто, якщо під час створення дочірнього інжектора йому не передавали провайдер з токеном `Service1`, то при запиті `child.get(Service1)` дочірній інжектор не буде створювати значення для токена `Service1`. Замість цього, дочірній інжектор звернеться до батьківського інжектора, куди передали провайдер з токеном `Service1`, тому батьківський інжектор вже зможе створити значення для цього токена. І вже після того, як інстанс `Service1` створено у батьківському інжекторі, цей самий інстанс буде видаватись (з кешу) при повторному запиті або через `child.get(Service1)`, або через `parent.get(Service1)`.

Коли ж ми поглянемо на поведінку інжекторів при запиті у них `Service2`, то тут вони будуть поводитись по-іншому, оскільки під час їх створення їм обом передали провайдер `Service2`, тому кожен із них створить свою локальну версію цього сервіса, і саме через це даний вираз повертає `false`:

```ts
parent.get(Service2) === child.get(Service2); // false
```

Коли ми запитуємо у батьківського інжектора `Service3`, він не може створити інстансу класу `Service3` через те, що він не має зв'язку з дочірнім інжектором, в якому є `Service3`.

Ну і обидва інжектори не можуть видати інстансу `Service4`, бо їм не передали цього класу при їхньому створенні.

### Ланцюжок залежностей на різних рівнях {#chain-of-dependencies-at-different-levels}

Ланцюжок залежностей провайдерів може бути досить складним, а ієрархія інжекторів ще додає складності. Тут допоможе наступне правило: "**Якщо певний провайдер залежить від іншого провайдера, то цей інший провайдер не можна передавати на нижні рівні ієрархії — у дочірні інжектори**".

Давайте почнемо з простого прикладу:

```ts {14,18}
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
  { token: Config, useValue: { one: 1, two: 2 } }
]);

const child = parent.resolveAndCreateChild([
  Service,
]);

child.get(Config); // { one: 1, two: 2 }
child.get(Service); // instance of Service

parent.get(Config); // { one: 1, two: 2 }
parent.get(Service); // Error: No provider for Service!
```

Що ми тут бачимо:

1. Провайдер з токеном `Service` залежить від провайдера з токеном `Config`.
2. Є два рівні ієрархії утворені батьківським та дочірнім інжектором.
3. `Config` передається у батьківський інжектор, а `Service` - у дочірній. Тобто тут дотримано заборони передачі залежності (`Config`) на нижні рівні ієрархії. Якщо зробити навпаки - жоден інжектор не зможе створити інстанс `Service` (такий варіант показано в наступному прикладі).
4. Дочірній інжектор може повернути значення для обох провайдерів, оскільки він знаходиться на нижньому рівні ієрархії, і дотримано правила передачі провайдерів із залежностями на різних рівнях ієрархії (див. третій пункт цього списку).
5. Батьківський інжектор може повернути значення лише для `Config`, оскільки йому передали провайдер лише з цим токеном. Коли ж у нього запитують значення для `Service`, він кидає помилку, хоча у дочірньому інжекторі є провайдер з токеном `Service`. Це відбувається через те, що батьківські інжектори ніколи не звертаються до дочірніх інжекторів щоб отримати від них необхідні значення провайдерів.

Тепер давайте порушимо правило, яке говорить, що залежність не можна передавати на нижні рівні ієрархії. Отже, `Service` у нас буде на вищому рівні (в батьківському інжекторі), а `Config` - на нижньому рівні (в дочірньому інжекторі):

```ts {14,18}
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
]);

const child = parent.resolveAndCreateChild([
  { token: Config, useValue: { one: 11, two: 22 } }
]);

child.get(Config); // { one: 11, two: 22 }

child.get(Service);
// Error: No provider for [Config in injector1]!
// Resolution path: [Service in injector2 >> injector1] -> [Config in injector1]

parent.get(Service);
// Error: No provider for Config!
// Resolution path: Service -> Config
```

Як бачите, коли у дочірнього інжектора запитується токен `Config`, він видає відповідне значення, оскільки під час його створення йому передали провайдер з цим токеном.

Інша справа із `Service`, який залежить від `Config`. Під час створення дочірнього інжектора йому не передали провайдер з токеном `Service`, тому він не може створити інстансу `Service`, і тому він змушений звернутись до батьківського інжектора. В той же час, батьківський інжектор хоча і має провайдер з токеном `Service`, але не має доступу до дочірнього інжектора, де є `Config`, тому під час запиту `child.get(Service)` насправді кидатиме помилку саме батьківський інжектор.

Зверніть увагу на `Resolution path` у повідомленні помилки:

```ts
child.get(Service);
// Error: No provider for [Config in injector1]!
// Resolution path: [Service in injector2 >> injector1] -> [Config in injector1]
```

`Resolution path` починається з пошуку `Service` в `injector2`, а потім продовжується в `injector1`. Оскільки цю помилку спричинив вираз `child.get(Service)`, можна догадатись, що `injector2` - це автоматичне ім'я, яке Ditsmod надав дочірньому інжектору. Відповідно - `injector1` - це батьківський інжектор. Пам'ятайте, що найвищій в ієрархії інжектор завжди матиме автоматичне ім'я `injector1`, і чим нижчий інжектор в ієрархії, тим більший номер буде в кінці його імені `injectorN`.

Але чи можна явно вказувати імена (чи рівні в ієрархії) інжекторів? - Так, можна, передаючи другий аргумент під час створення інжектора. Більше того, це навіть рекомендується робити завжди:

```ts {15,20}
import { injectable, Injector } from '@ditsmod/core';

class Config {
  one: any;
  two: any;
}

@injectable()
class Service {
  constructor(public config: Config) {}
}

const parent = Injector.resolveAndCreate(
  [Service],
  'parentInjector'
);

const child = parent.resolveAndCreateChild(
  [{ token: Config, useValue: { one: 11, two: 22 } }],
  'childInjector'
);

child.get(Service);
// Error: No provider for [Config in parentInjector]!
// Resolution path: [Service in childInjector >> parentInjector] -> [Config in parentInjector]
```

В такому разі, `Resolution path` стає більш зрозумілим:

1. спочатку `Service` шукється в `childInjector`, потім - у `parentInjector`;
2. і оскільки `Service` знайдено саме у `parentInjector`, його залежність - `Config` - теж буде шукатись у `parentInjector`.

Аналізуючи повідомлення помилки, можна здогадатись, що проблему можна вирішити двома способами:

1. потрібно або `Service` додати до `childInjector`, щоб він не піднімався до `parentInjector`;
2. або `Config` додати до `parentInjector`, щоб він міг вирішити залежність для `Service`.

Давайте скористаємось другим варіантом:

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

const parent = Injector.resolveAndCreate(
  [
    Service,
    { token: Config, useValue: { one: 1, two: 2 } }
  ],
  'parentInjector'
);

const child = parent.resolveAndCreateChild(
  [{ token: Config, useValue: { one: 11, two: 22 } }],
  'childInjector'
);
```

Тут батьківський інжектор має обидва необхідних провайдери, щоб створити інстанс `Service`. А як щодо дочірнього інжектора? З якою саме версією `Config` буде створено інстанс `Service` в наступному виразі?

```ts
child.get(Service);
```

Корисно спочатку подумати над цим самостійно, щоб краще закріпити дану особливість в пам'яті. Подумали? Ок, логіка в дочірнього інжектора буде наступною:

1. спочатку він прогляне масив своїх провайдерів і не знайде там провайдера з токеном `Service`;
2. потім він звернеться до батьківського інжектора і отримає від нього вже готовий інстанс `Service`, в якому `Config` матиме значення `{ one: 1, two: 2 }`.

Трохи неочікувано, правда ж? Мабуть дехто подумав, що дочірній інжектор для створення інстансу `Service` буде використовувати локальну версію `Config` (тобто `{ one: 11, two: 22 }`). Здогадуєтесь, що можна зробити, щоб при запиті `Service` у дочірнього інжектора, DI вирішував його залежність з використанням локальної версії провайдера з токеном `Config`? - Так, при створенні дочірнього інжектора, в масиві провайдерів ми можемо передати йому також `Service`:

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

```ts {14-15,18}
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
child.get(Service).config; // returns from parent injector: { one: 1, two: 2 }
child.pull(Service).config; // pulls Service in current injector: { one: 11, two: 22 }
```

Як бачите, якщо в даному випадку використовувати `child.get(Service)`, то `Service` створиться з тим `Config`, який є у батьківському інжекторі. Якщо ж використовувати `child.pull(Service)`, він спочатку зтягне потрібний провайдер у дочірній інжектор, а потім створить його значення в контексті дочірнього інжектора не додаючи його значення у кеш інжектора (тобто `child.pull(Service)` повертатиме кожен раз новий інстанс).

Але якщо запитуваний провайдер є у дочірньому інжекторі, то вираз `child.pull(Service)` буде працювати ідентично до виразу `child.get(Service)` (з додаванням значення провайдера у кеш інжектора):

```ts {15-16}
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
const child = parent.resolveAndCreateChild([
  Service,
  { token: Config, useValue: { one: 11, two: 22 } }
]);
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
import { Injector, Provider } from '@ditsmod/core';

const providersPerApp: Provider[] = [];
const providersPerMod: Provider[] = [];
const providersPerRou: Provider[] = [];
const providersPerReq: Provider[] = [];

const injectorPerApp = Injector.resolveAndCreate(providersPerApp);
const injectorPerMod = injectorPerApp.resolveAndCreateChild(providersPerMod);
const injectorPerRou = injectorPerMod.resolveAndCreateChild(providersPerRou);
const injectorPerReq = injectorPerRou.resolveAndCreateChild(providersPerReq);

injectorPerApp === injectorPerMod.parent; // true
```

Під капотом, Ditsmod робить аналогічну процедуру багато разів для різних модулів, роутів та HTTP-запитів. Використовуючи цей приклад, давайте закріпимо знання про ланцюжок залежностей на різних рівнях ієрархії інжекторів, і знову скористаємось знайомим класом `Service`, який залежить від `Config`:

```ts {16,23}
import { injectable, Injector, Provider } from '@ditsmod/core';

class Config {
  one: any;
  two: any;
}

@injectable()
class Service {
  constructor(public config: Config) {}
}

const providersPerApp: Provider[] = [];
const providersPerMod: Provider[] = [];
const providersPerRou: Provider[] = [];
const providersPerReq: Provider[] = [Service, Config];

const injectorPerApp = Injector.resolveAndCreate(providersPerApp, 'App');
const injectorPerMod = injectorPerApp.resolveAndCreateChild(providersPerMod, 'Mod');
const injectorPerRou = injectorPerMod.resolveAndCreateChild(providersPerRou, 'Rou');
const injectorPerReq = injectorPerRou.resolveAndCreateChild(providersPerReq, 'Req');

injectorPerReq.get(Service); // returns instance of Service
```

Цей приклад не кидає помилки, оскільки `Service` та `Config` передано в один і той же інжектор, причому саме у цього інжектора запитують `Service`. Якщо ми запитаємо `Service` чи `Config` з інжекторів на вищіх рівнях, то вони кидатимуть помилку, оскільки батьківські інжектори ніколи не звертаються до дочірніх інжекторів, щоб ті повертали їм будь-яке значення провайдерів. Наприклад, якщо замість `injectorPerReq.get(Service)` ми викличемо `injectorPerRou.get(Service)` або `injectorPerMod.get(Service)`, або `injectorPerApp.get(Service)` - усі вони кидатимуть помилку.

Ситуація змінюється, якщо провайдер з токеном `Config` буде не на тому самому рівні, що і провайдер з токеном `Service`. Щоб не зробити помилки, згадаємо правило: "**Якщо певний провайдер залежить від іншого провайдера, то цей інший провайдер не можна передавати на нижні рівні ієрархії — у дочірні інжектори**". Оскільки ми маємо ланцюжок залежностей - `Service -> Config` - отже `Config` завжди повинен бути вище в ієрархії інжекторів, відносно `Service`. В такому разі, дочірній інжектор спочатку спробує створити `Service`, побачить залежність від `Config`, не знайде його в поточному інжекторі і звернеться в один із батьківських інжекторів.

Зверніть увагу, що у попередньому прикладі інжекторам надаються скорочені назви рівнів ієрархії:

1. `App` - рівень застосунку;
2. `Mod` - рівень модуля;
3. `Rou` - рівень роуту;
4. `Req` - рівень запиту.

Це зроблено для кращої читабельності помилок:

```ts
injectorPerReq.get(Service);
// Error: No provider for [Config in Mod >> App]!
// Resolution path: [Service in Req >> Rou >> Mod] -> [Config in Mod >> App]
```

Хоча ми не бачимо усього коду, який спричинив цю помилку, але ми знаємо принаймні, що стек цієї помилки починається з виклику `injectorPerReq.get(Service)`. Також ми бачимо, що `Resolution path` починається з пошуку `Service` на трьох рівнях ієрархії інжекторів - `Req >> Rou >> Mod`. Але чому пошук не продовжився на рівні `App`? - Можна здогадатись, що під час створення інжекторів, `Service` було передано саме на рівень `Mod`. І якщо б на цьому рівні були усі необхідні провайдери, саме на цьому рівні створювався б інстанс `Service`. Потім пошук переключився на `Config`, від якого залежить `Service`, і стартував цей пошук з того самого рівня, на якому було знайдено `Service`. Завершився пошук `Config` на рівні `App`, інжектор якого і кинув помилку про те, що не може знайти провайдера для `Config`.

Виходить що ця помилка була спричинена тим, що не було дотримано правила передачі залежностей на різних рівнях ієрархії інжекторів. Судячи з `Resolution path`, провайдер з токеном `Service` було передано на рівні `Mod`, а провайдер з токеном `Config` взагалі не передавався в інжектори, або передавався в дочірні інжектори на рівні `Rou` чи `Req`.

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

Майте на увазі, що ви таким чином отримуєте інжектор, що створив інстанс даного сервіса. Рівень ієрархії цього інжектора залежить тільки від того, в масив якого інжектора передали `SecondService`.

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

По-суті, мульти-провайдери дозволяють створювати групи провайдерів, що мають спільний токен. Ця можливість зокрема використовується у `@ditsmod/rest` для створення групи `HTTP_INTERCEPTORS`.

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

## Сервіс `Context` {#context-service}

Коли ви будуєте застосунок, інколи є потреба передавати дані не напряму від функції до функції, а через посередника. Таким посередником часто виступає інжектор, коли через нього передають різного роду конфігурацію. Але проблема в тому, що передати дані у сам інжектор можна лише передаючи дані у масив провайдерів, причому до моменту створення інжектора. Після цього, він є імутабельним (незмінним), тому роль такого посередника потім вже потрібно передавати якомусь сервісу.

Саме таким сервісом є `Context`, його методи вміють підніматись вгору по ієрархії інжекторів щоб отримати певне значення для вказаного ключа:

```ts
import { Injector, Context } from '@ditsmod/core';

const parent = Injector.resolveAndCreate([Context], 'parent level');
const child = parent.resolveAndCreateChild([Context], 'child level');
const parentCtx = parent.get(Context) as Context;
const childCtx = child.get(Context) as Context;
parentCtx.set('key1', 'value1');
childCtx.set('key2', 'value2');

childCtx.get('key1'); // value1
childCtx.get('key2'); // value2
```

В цьому прикладі показано:

1. Створення батьківського та дочірнього інжектора, у кожен з яких передано `Context` у якості провайдера.
2. Потім показано як отримують інстанси `Context` з обох інжекторів, і встановлюють пари "ключ-значення".
3. І в самому кінці показано, як отримують ці обидва значення у дочірньому контексті. Тобто тут продемонстровано, що з дочірнього контексту можна також отриматит значення і батьківського контексту.

Сервіс `Context` використовують [інтерсептори][105], [ґарди][106], обробники-запитів, контролери та сервіси у `@ditsmod/rest`, коли контролери працюють у [request-scoped][3] режимі. Наприклад, ґард отримує HTTP-запит, зчитує певну auth-інформацію, можливо звертається до бази даних щоб витягнути інормацію про поточного користувача. Потім, замість того, щоб цю інформацію зберігати прямо в об'єкті запиту і передавати від функції до функції, він її централізовано зберігає у `Context`, звідки її можуть витягувати контролери чи будь-які сервіси, що знаходяться на тому ж рівні ієрархії інжекторів, або на нижніх рівнях.

Особливо просто і зручно користуватись сервісом `Context` у параметрах методів класів:

```ts {4}
import { Injector, Context, ctx, ctxProviders } from '@ditsmod/core';

class Service1 {
  method1(@ctx('key1') param1: any, @ctx('key2') param2: any) {
    return { param1, param2 };
  }
}

const injector = Injector.resolveAndCreate(
  [...ctxProviders, { token: 'token1', useFactory: [Service1, Service1.prototype.method1] }],
);

const context = injector.get(Context) as Context;
context.set('key1', 'value1');
context.set('key2', 'value2');

injector.get('token1'); // { param1: 'value1', param2: 'value2' }
```

В даному прикладі умовно показано ситуацію, коли значення для `Context` встановлюється в одному місці програми, а використовується це значення в іншому місці - у параметрах методу класу. Точно по цій схемі можна отримати значення контекста у параметрах контролера (якщо ви використовуєте `@ditsmod/rest`). Зверніть увагу, що в даному прикладі до провайдерів додається масив `ctxProviders`, де є усі необхідні провайдери, щоб ця схема працювала. В реальних же застосунках, якщо ви використовуєте `@ditsmod/rest`, там вже робиться реекспорт `CtxModule` з усіма необхідними провайдерами.

Реальний приклад встановлення значень для контексту можна знайти ось тут:

1. [BodyParserInterceptor][16];
2. [BearerGuard][17].

## Декоратори для параметрів методів {#method-parameter-decorators}

Ці декоратори використовуються для управління поведінкою інжектора під час пошуку значень для певного токена. Найчастіше використовуються `inject`, `input` та `optional`, дуже рідко - `fromSelf` та `skipSelf`.

### `inject` та `input` {#inject-and-input}

Як [раніше було сказано][2], декоратор `inject` дозволяє вказувати альтернативний токен у параметрах методів, і таким чином можна вказувати будь-які типи залежностей:

```ts
import { injectable, inject } from '@ditsmod/core';
import { InterfaceOfItem } from './types.js';
import { SOME_TOKEN } from './tokens.js';

@injectable()
export class Service1 {
  constructor(@inject(SOME_TOKEN) private someArray: InterfaceOfItem[]) {}
  // ...
}
```

Окрім цього, другим аргументом в `inject` також можна передати контекстні дані:

```ts {11}
import { injectable, inject, input, Injector } from '@ditsmod/core';

@injectable()
class Dependency1 {
  constructor(@input public inputParameter: string) {}
}

@injectable()
class Service1 {
  constructor(
    @inject(Dependency1, 'input-data') public dependency1: Dependency1,
  ) {}
}

const injector = Injector.resolveAndCreate([Service1, Dependency1]);
const service1 = injector.get(Service1) as Service1;
service1.dependency1.inputParameter; // input-data
```

Тут показано, що `Service1` залежить від `Dependency1`, а у конструкторі `Dependency1` перед параметром поставлено декоратор `@input` (без дужок!). Таким чином очікується, що DI перед створенням `Dependency1` передасть йому дані з `@inject(Dependency1, 'input-data')` до того параметру, перед яким розташовано `@input`. Тобто `Service1` намагається отримати інстанс `Dependency1` передаючи йому `input-data`.

Ви можете отримати "вхідні" дані у будь-якому провайдері, де можна вказати залежність. До речі, використовуючи декоратор ось так - `@input` - це скорочена версія від `@inject(input)`:

```ts {5,20}
import { injectable, inject, Injector, input, type FunctionFactoryProvider } from '@ditsmod/core';

@injectable()
class Service2 {
  constructor(@inject(input) public arg: string) { // Простіше використати "@input"
    console.log(arg); // print: input-data2
  }
}

@injectable()
class Service1 {
  constructor(
    @inject('token1', 'input-data1') public param1: string,
    @inject(Service2, 'input-data2') public param2: string,
  ) {}
}

const factoryProvider: FunctionFactoryProvider = {
  token: 'token1',
  deps: [input],
  useFactory: (arg) => console.log(arg), // print: input-data1
};

const injector = Injector.resolveAndCreate([Service1, Service2, factoryProvider]);

injector.get(Service1);
```

Що ми тут бачимо:

1. Провайдери з токенами `Service2` та `token1` вказують у якості залежності функцію `input`. Ця функція насправді призначена для використання її як декоратор параметра методу, але нам DI дозволяє її також використовувати як токен провайдера.
2. У `Service1` вказано залежність від провайдерів з токенами `Service2` та `token1`, причому другим аргументом у `@inject()` передано певні контекстні дані.
3. В інжектора запитується `Service1`, і щоб створити інстанс цього класу, спочатку DI передає провайдерам з токенами `Service2` та `token1` відповідні контекстні дані.

Майте на увазі, що коли до `@inject()` передається другий аргумент, інжектор не створює кеш для вказаної залежності.

### `optional` {#optional}

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

Але оскільки DI працює у JavaScript-коді, а не у TypeScript, він проігнорує цю опціональність і видасть помилку у разі відсутності провайдера з токеном `FirstService`. Щоб даний код працював, необхідно скористатись декоратором `optional`:

```ts {6}
import { injectable, optional } from '@ditsmod/core';
import { FirstService } from './first.service.js';

@injectable()
export class SecondService {
  constructor(@optional() private firstService?: FirstService) {}
  // ...
}
```

Оскільки в JavaScript немає позначки "опціональна властивість", лише завдяки декораторам можна це вказати.

### `fromSelf` {#fromSelf}

Декоратори `fromSelf` та `skipSelf` мають сенс у випадку, коли існує певна ієрархія інжекторів. Декоратор `fromSelf` використовується дуже рідко.

```ts {7}
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

child.get(Service2);
// Error: No provider for Service1!
// Resolution path: Service2 -> Service1
```

Як бачите, `Service2` залежить від `Service1`, причому декоратор `fromSelf` вказує DI: "При створенні інстансу `Service1` використовувати тільки той самий інжектор, який створить інстанс `Service2`, а до батьківського інжектора не потрібно звертатись". Коли створюється батьківський інжектор, йому передають обидва необхідні сервіси, тому при запиті токену `Service2` він успішно вирішить залежність та видасть інстанс цього класу.

А ось при створенні дочірнього інжектора, йому не передали `Service1`, тому при запиті токену `Service2` він не зможе вирішити залежність цього сервісу. Якщо прибрати декоратор `fromSelf` з конструктора, то дочірній іжектор успішно вирішить залежність `Service2`.

### `skipSelf` {#skipSelf}

Декоратор `skipSelf` використовується частіше, ніж `fromSelf`, але також рідко.

```ts {7}
import { injectable, skipSelf, Injector } from '@ditsmod/core';

class Service1 {}

@injectable()
class Service2 {
  constructor(@skipSelf() public service1: Service1) {}
}

const parent = Injector.resolveAndCreate([Service1, Service2]);
const child = parent.resolveAndCreateChild([Service2]);

const service2 = child.get(Service2) as Service2;
service2.service1 instanceof Service1; // true

parent.get(Service2);
// Error: No provider for Service1!
// Resolution path: Service2 -> Service1
```

Як бачите, `Service2` залежить від `Service1`, причому декоратор `skipSelf` вказує DI: "При створенні інстансу `Service1` пропустити той інжектор, який створить інстанс `Service2`, і зразу звертатись до батьківського інжектора". Коли створюється батьківський інжектор, йому передають обидва необхідні сервіси, але через `skipSelf` він не може використати значення для `Service1` з власного реєстру, тому він не зможе вирішити вказану залежність.

А при створенні дочірнього інжектора, йому не передали `Service1`, зате він може звернутись до батьківського інжектора за ним. Тому дочірній інжектор успішно вирішить залежність `Service2`.

[1]: https://uk.wikipedia.org/wiki/%D0%92%D0%BF%D1%80%D0%BE%D0%B2%D0%B0%D0%B4%D0%B6%D0%B5%D0%BD%D0%BD%D1%8F_%D0%B7%D0%B0%D0%BB%D0%B5%D0%B6%D0%BD%D0%BE%D1%81%D1%82%D0%B5%D0%B9
[2]: #short-and-long-forms-of-declaring-dependencies-in-class-methods
[3]: /rest-application/controllers-and-services/#what-is-a-rest-controller
[11]: https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types
[15]: https://uk.wikipedia.org/wiki/%D0%9E%D0%B4%D0%B8%D0%BD%D0%B0%D0%BA_(%D1%88%D0%B0%D0%B1%D0%BB%D0%BE%D0%BD_%D0%BF%D1%80%D0%BE%D1%94%D0%BA%D1%82%D1%83%D0%B2%D0%B0%D0%BD%D0%BD%D1%8F) "Singleton"
[16]: https://github.com/ditsmod/ditsmod/blob/3.0.0-next.12/packages/body-parser/src/body-parser.interceptor.ts#L16
[17]: https://github.com/ditsmod/ditsmod/blob/3.0.0-next.12/examples/14-auth-jwt/src/app/modules/services/auth/bearer.guard.ts#L25

[101]: ../../#installation
[102]: #injector-and-providers
[103]: #method-parameter-decorators
[104]: /basic-components/extensions/#group-of-extensions
[105]: /rest-application/http-interceptors/
[106]: /rest-application/guards/
[107]: /basic-components/modules/#export-import-append
[108]: /basic-components/decorators-and-reflector/
[121]: /basic-components/modules/#provider-collisions
