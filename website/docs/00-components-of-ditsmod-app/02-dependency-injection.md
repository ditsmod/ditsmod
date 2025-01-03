---
sidebar_position: 2
---

# Dependency Injection

## Для чого потрібен DI?

Давайте спочатку ознайомимось із загальною картиною роботи [Dependency Injection][1] (або просто DI), а потім в деталях розглянемо кожен важливий її компонент окремо.

Мабуть найпростіше зрозуміти, що саме робить DI, на прикладах. Почнемо з прикладів, де не використовується DI. В даному разі нам потрібен інстанс класу `Service3` та його метод `doSomething()`:

```ts {12-14} title='./services.ts'
export class Service1 {}

export class Service2 {
  constructor(private service1: Service1) {}
  // ...
  // Використання this.service1 у якомусь із методів.
}

export class Service3 {
  constructor(private service2: Service2) {}

  doSomething(param1: any) {
    // Використання this.service2 у даному методі.
  }
}

export function getService3() {
  const service1 = new Service1();
  const service2 = new Service2(service1);
  return new Service3(service2);
}
```

Як бачите, `Service3` залежить від `Service2`, який, у свою чергу, залежить від `Service1`. Покищо інстанс `Service3` отримати досить просто:

```ts {5} title='./some.service.ts'
import { getService3 } from './services.js';

export class SomeService {
  method1() {
    const service3 = getService3();
    service3.doSomething(123);
  }
}
```

У функції `getService3` захардкоджено створення інстансу `Service3`, і це є проблемою, тому що писати юніт-тести для цієї функції проблематично, особливо в контексті EcmaScript Module, оскільки ви не зможете підмінити `Service1` та `Service2` моками. Ще один серйозний мінус функції `getService3` в тому, що в реальному застосунку вона може стати досить складною через потребу враховувати конфігурацію кожної із залежностей. Тобто, наприклад, в одному випадку в тілі `getService3` може очікуватись, що вона буде створювати кожен раз нові інстанси `Service1` та `Service2`, в другому випадку - потрібно щоб вони були [одинаками][15] для усього застосунку, а в третьому - що тільки один із них повинен бути одинаком...

В наступному прикладі вже використовується DI, хоча цей приклад майже не відрізняється від попереднього прикладу, де ми також оголошували клас `Service3`, але тут ми дописали декоратор `injectable` над кожним класом, який має конструктор з параметрами, і не стали створювати функцію `getService3`:

```ts {5,12} title='./services.ts'
import { injectable } from '@ditsmod/core';

export class Service1 {}

@injectable()
export class Service2 {
  constructor(private service1: Service1) {}
  // ...
  // Використання this.service1 у якомусь із методів.
}

@injectable()
export class Service3 {
  constructor(private service2: Service2) {}

  doSomething(param1: any) {
    // Використання this.service2 у даному методі.
  }
}
```

Важливо розуміти, що декоратор `injectable` потрібний лише через те, що у JavaScript-коді не існує можливості вказати тип параметра в конструкторі, як це зроблено у TypeScript-коді. Роль декоратора `injectable` дуже проста - його наявність говорить TypeScript-компілятору, що потрібно переносити у JavaScript-код ті метадані, які знаходяться у TypeScript-коді у конструкторах класів. Наприклад, наявність декоратора `injectable` над класом `Service2` буде сигналізувати TypeScript-компілятору, що треба запам'ятати `Service1` у якості першого параметра у конструкторі. Ці метадані вивантажуються у JavaScript-код за допомогою TypeScript-компілятора і зберігаються за допомогою методів класу `Reflect` з бібліотеки `reflect-metadata`.

Пізніше, коли [ми передамо до DI класи зі збереженими метаданими](#передача-провайдерів-в-реєстр-di), ці метадані DI зможе зчитувати та використовувати для автоматичної підстановки відповідних інстансів класів, тому ми зможемо запитувати інстанс `Service3` у конструкторі будь-якого класу у нашій програмі:

```ts {4,6,9} title='./some.service.ts'
import { injectable } from '@ditsmod/core';
import { Service3 } from './services.js';

@injectable()
export class SomeService {
  constructor(private service3: Service3) {}

  method1() {
    this.service3.doSomething(123);
  }
}
```

Як бачите, ми більше не створюємо інстансу `Service3` за допомогою оператора `new`, натомість цим займається DI і передає у конструктор готовий інстанс. Навіть якщо згодом у конструкторі `Service3` параметри будуть змінюватись, нічого не прийдеться змінювати у тих місцях, де використовується `Service3`.

## "Магія" роботи з метаданими

З точки зору JavaScript-розробника, в тому, що DI якимось чином може проглядати параметри конструкторів класів і бачити там інші класи - це можна назвати "магією". Якщо проглянути репозиторій `@ditsmod/core`, можна побачити що:

1. у файлі `tsconfig.json` вказано ["emitDecoratorMetadata": true][12];
2. у файлі `package.json` вказано залежність від бібліотеки [reflect-metadata][13];
3. є цілий ряд декоратораторів (`rootModule`, `featureModule`, `controller`, `injectable`...).

Усі ці складові якраз і забезпечують "магію" зчитування та збереження метаданих, які ви прописуєте у своїх класах за допомогою декораторів. Вам можна глибоко і не розбиратись як саме працює ця "магія", але варто пам'ятати хоча б які саме складові вона має.

Варто також зазначити, що Ditsmod не використовує [нові декоратори][14], оскільки вони покищо не мають API для роботи з параметрами методів.

## Залежність

Якщо для створення інстанса даного класа вам потрібно спочатку створити інстанси інших класів - значить даний клас має залежності. Наприклад, якщо в конструкторі сервісу ви прописуєте ось таке:

```ts {6}
import { injectable } from '@ditsmod/core';
import { FirstService } from './first.service.js';

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

Якщо ви забудете написати (або навмисно видалите) декоратор `injectable` перед класом, що має залежності в конструкторі, DI кине помилку про те, що він не може вирішити залежність даного класа. Це відбувається через те, що `injectable` бере участь у зчитуванні та збереженні метаданих класу.

### Опціональна залежність

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

## Токен залежності

У попередніх прикладах ви вже багато разів бачили токен залежності, але формально покищо ми його не представили. Давайте знову розглянемо попередній приклад:

```ts {6}
import { injectable } from '@ditsmod/core';
import { FirstService } from './first.service.js';

@injectable()
export class SecondService {
  constructor(private firstService: FirstService) {}
  // ...
}
```

Тут мається на увазі, що `FirstService` є класом, і через це він може одночасно використовуватись і у якості TypeScript-типу, і у якості **токену**. По-суті, токен - це ідентифікатор, який асоціюється із відповідною залежністю. Дуже важливо розуміти, що сам механізм використання токенів потрібний для JavaScript-runtime, тому у якості токенів не можна використовувати такі типи, які у TypeScript-коді ви оголошуєте з ключовими словами `interface`, `type`, `enum` і т.п., бо їх не існує у JavaScript-коді.

На відміну від класу, масив не може одночасно використовуватись і у якості TypeScript-типу, і у якості токену. З іншого боку, токен може мати зовсім нерелевантний тип даних відносно залежності, з якою він асоціюється, тому, наприклад, рядковий тип токена може асоціюватись із залежністю, що має будь-який TypeScript-тип, включаючи масиви, інтерфейси, enum і т.д.

Передати токен можна у короткій або довгій формі вказання залежності. В останньому прикладі використовується **коротка форма** вказання залежності, вона має суттєві обмеження, бо таким чином можна вказати залежність лише від певного _класу_.

А ще існує **довга форма** вказання залежності за допомогою декоратора `inject`, вона дозволяє використовувати альтернативний токен:

```ts {6}
import { injectable, inject } from '@ditsmod/core';
import { InterfaceOfItem } from './types.js';

@injectable()
export class SecondService {
  constructor(@inject('some-string') private someArray: InterfaceOfItem[]) {}
  // ...
}
```

Коли використовується `inject`, DI бере до уваги лише переданий в нього токен. В даному разі DI ігнорує тип змінної - `InterfaceOfItem[]`, використовуючи в якості токена текстовий рядок `some-string`. Іншими словами, DI використовує `some-string` як ключ для пошуку відповідного значення для залежності, що має тип `InterfaceOfItem[]`. Таким чином, DI дає можливість розділяти токен та тип змінної, тому в конструкторі можна отримати будь-який тип залежності, включаючи різні типи масивів чи enum.

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
export class SecondService {
  constructor(@inject(SOME_TOKEN) private someArray: InterfaceOfItem[]) {}
  // ...
}
```

## Провайдери

У DI є реєстр, який по-суті є мапінгом між токеном та значенням, яке потрібно видавати для цього токена. Схематично цей реєстр можна показати так:

```
токен1 -> значення15
токен2 -> значення100
...
```

Як можна здогадатись, при вирішенні залежності, DI братиме токени з параметрів конструктора певного класа, і шукатиме для них значення у реєстрі DI. Якщо усі необхідні токени у реєстрі знайшлись, значить їхні значення передаються у конструктор, і таким чином успішно вирішується залежність даного класа.

DI створює значення у реєстрі для кожного токена використовуючи так звані **провайдери**. Провайдер може бути або класом, або об'єктом:

```ts {3-8}
import { Class } from '@ditsmod/core';

type Provider = Class<any> |
{ token: NonNullable<unknown>, useClass: Class<any>, multi?: boolean } |
{ token: NonNullable<unknown>, useValue?: any, multi?: boolean } |
{ token?: NonNullable<unknown>, useFactory: [Class<any>, Class<any>.prototype.methodName], multi?: boolean } |
{ token?: NonNullable<unknown>, useFactory: (...args: any[]) => any, deps: any[], multi?: boolean } |
{ token: NonNullable<unknown>, useToken: any, multi?: boolean }
```

*_зверніть увагу, що токен для провайдера з властивістю `useFactory` є опціональним, оскільки DI може використати функцію чи метод вказаного класу у якості токена._

Отже, щоб DI міг вирішити певну залежність, спочатку необхідно передати відповідний провайдер до реєстру DI, а потім DI буде видавати значення цього провайдера по його токену. Тому якщо ви вказали певну залежність у класі, але не передали відповідного провайдера, DI не зможе вирішити дану залежність. Про те, як саме можна передавати провайдери до DI, йдеться [в наступному розділі][100].

Якщо провайдер представлено у вигляді об'єкта, у його властивості можуть передаватись наступні значення:

- `useClass` - сюди передається клас, чий інстанс буде використано як значення цього провайдера. Приклад такого провайдера:

  ```ts
  { token: 'token1', useClass: SomeService }
  ```
- `useValue` - сюди передається будь-яке значення, окрім `undefined`, DI його видаватиме без змін. Приклад такого провайдера:

  ```ts
  { token: 'token2', useValue: 'some value' }
  ```
- `useFactory` - сюди можна передавати аргументи у двох формах.

  - **Перша форма** (рекомендована, через свою кращу інкапсуляцію) передбачає, що до `useFactory` передається [tuple][11], де на першому місці повинен бути клас, а на другому місці - метод цього класу, який повинен повернути якесь значення для вказаного токена. Наприклад, якщо клас буде таким:

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

  - **Друга форма** передбачає, що до `useFactory` можна передавати функцію, яка може мати параметри - тобто може мати залежність. Цю залежність необхідно додатково вручну вказувати у властивості `deps` у вигляді масиву токенів, причому порядок передачі токенів важливий:
    ```ts {6}
    function fn1(service1: Service1, service2: Service2) {
      // ...
      return 'some value';
    }

    { token: 'token3', useFactory: fn1, deps: [Service1, Service2] }
    ```

    Зверніть увагу, що у властивість `deps` передаються саме _токени_ провайдерів, і DI їх сприймає саме як токени, а не як провайдери. Тобто для цих токенів до реєстру DI ще треба буде [передати відповідні провайдери][100]. Також зверніть увагу, що у `deps` не передаються декоратори для параметрів (наприклад `optional`, `skipSelf` і т.д.). Якщо для вашої фабрики необхідні декоратори параметрів - вам потрібно скористатись першою формою передачі аргументів до `useFactory`.

- `useToken` - в цю властивість провайдера передається інший токен. Якщо ви записуєте таке:

  ```ts
  { token: SecondService, useToken: FirstService }
  ```

  таким чином ви говорите DI: "Коли споживачі провайдерів запитують токен `SecondService`, потрібно використати значення для токена `FirstService`". Іншими словами, ця директива робить аліас `SecondService`, який вказує на `FirstService`.

Тепер, коли ви вже ознайомились з поняттям **провайдер**, можна уточнити, що під **залежністю** розуміють залежність саме від **значення провайдера**. Таку залежність мають **споживачі** значень провайдерів або в конструкторах сервісів, або в конструкторах чи методах контролерів, або в методі `get()` [інжекторів][102] (про це буде згадано пізніше).

## Інжектор

В описі провайдерів було згадано за _реєстри DI_, тепер давайте розберемось як формуються ці реєстри, і де саме вони знаходяться.

Якщо сильно спростити схему роботи DI, можна сказати що DI приймає масив провайдерів на вході, а на виході видає **інжектор**, який вміє створювати значення для кожного переданого провайдера. Тобто, реєстри DI формуються на основі масивів провайдерів, які передаються в інжектор:

```ts {15}
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

Як бачите, метод `Injector.resolveAndCreate()` на вході приймає масив провайдерів, а на виході видає інжектор, який вміє видавати значення кожного провайдера по його токену за допомогою методу `injector.get()`, з урахуванням усього ланцюжка залежностей (`Service3` -> `Service2` -> `Service1`).

Що робить `injector.get()`:

- коли у нього запитують `Service3`, він проглядає конструктор цього класу, бачить залежність від `Service2`;
- потім проглядає конструктор у `Service2`, бачить залежність від `Service1`;
- потім проглядає конструктор у `Service1`, не знаходить там залежності, і тому першим створює інстанс `Service1`;
- потім створює інстанс `Service2` використовуючи інстанс `Service1`;
- і останнім створює інстанс `Service3` використовуючи інстанс `Service2`;
- якщо пізніше будуть запитувати повторно інстанс `Service3`, метод `injector.get()` буде повертати раніше створений інстанс `Service3` з кешу даного інжектора.

Інколи останній пункт (коли інстанс `Service3` повертається з кешу інжектора), є небажаним. В такому разі ви можете скористатись методом `injector.resolveAndInstantiate()`, який приймає провайдер, резолвить його в контексті поточного інжектора, і кожен раз повертає новий інстанс даного провайдера.

Під час автоматичного вирішення залежності класу (коли інжектор не використовується напряму), Ditsmod під капотом використовує метод `injector.get()`.

Використовуючи DI, вам можна і не знати весь ланцюжок залежностей `Service3`, довірте цю роботу інжектору, головне - передайте в реєстр DI усі необхідні класи. Майте на увазі, що таким чином можна писати unit-тести для окремо-взятих класів.

## Ієрархія та інкапсуляція інжекторів  {#hierarchy-and-encapsulation-of-injectors}

DI надає можливість створювати ще й ієрархію та інкапсуляцію інжекторів, в якій беруть участь батьківські та дочірні інжектори. Саме завдяки ієрархії та інкапсуляції - і будується структура та модульність застосунку. З іншого боку, якщо є інкапсуляція, існують правила, які треба вивчити, щоб орієнтуватись, коли один сервіс може отримати доступ до певного провайдера, а коли - ні.

Давайте розглянемо наступну ситуацію. Уявіть, що вам треба створити дефолтну конфігурацію для усього застосунку, і кастомну конфігурацію для певних модулів. Це означає, що на рівні деяких модулів ви будете змінювати конфігурацію, і вам треба, щоб вона не впливала на дефолтне значення та інші модулі. Наступний псевдо-код показує базову концепцію, яка забезпечує таку поведінку:

```ts
// Батьківський інжектор
class InjectorPerApplication {
  locale = 'en'
  token1 = 'value1'
  token2 = 'value2'
  // ...
}

// Дочірній інжектор
class InjectorPerModule {
  injectorPerApp: InjectorPerApplication;
  locale = 'uk'
}
```

Дочірній інжектор може звертатись до батьківського інжектора, оскільки має відповідну змінну з інстансом батьківського інжектора. З іншого боку, батьківський інжектор не має доступу до дочірнього інжектора, тому він може знайти лише значення для тих провайдерів, які передали безпосередньо йому.

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

Як бачите, при створенні дочірнього інжектора, йому не передали `Service1`, тому при запиті інстансу цього класу він звернеться до батька. До речі, тут є один неочевидний, але дуже важливий момент: через метод `get()` дочірні інжектори тільки запитують у батьківських інжекторів певні інстанси класів, а самостійно вони їх не створюють. Саме тому цей вираз повертає `true`:

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

### Ієрархія інжекторів контролера

Контролер [в режимі injector-scoped][103], окрім свого власного інжектора на рівні запиту, має ще й три батьківські інжектори: на рівні роута, модуля та застосунка. Ці інжектори також формуються на основі провайдерів, які ви передаєте в наступні масиви:

- `providersPerApp`;
- `providersPerMod`;
- `providersPerRou`;
- `providersPerReq` (це масив, з якого формується інжектор для контролера в режимі injector-scoped).

Тобто контролер в режимі injector-scoped може залежати від сервісів на будь-якому рівні.

Якщо ж контролер є [в режимі context-scoped][103], його власний інжектор знаходиться на рівні модуля, і він має один батьківський інжектор на рівні застосунку:

- `providersPerApp`;
- `providersPerMod` (це масив, з якого формується інжектор для контролера в режимі context-scoped).

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

### Метод `injector.pull()`

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

### Поточний інжектор

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

## Мульти-провайдери

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
import { Injector } from '@ditsmod/core';
import { LOCAL } from './tokens.js';

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

### Підміна мультипровайдерів

Щоб стала можливою підміна конкретного мультипровайдера, можна зробити так:

1. передайте певний клас в об'єкт мультипровайдера використовуючи властивість `useToken`;
2. потім даний клас передайте у якості звичайного провайдера;
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

## Передача провайдерів в реєстр DI

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
import { controller } from '@ditsmod/core';

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

## Повторне додавання провайдерів

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

## Редагування значень в реєстрі DI

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

## Декоратори fromSelf та skipSelf

Ці декоратори використовуються для управління поведінкою інжектора під час пошуку значень для певного токена. Вони мають сенс у випадку, коли існує певна ієрархія інжекторів.

### fromSelf

Декоратор `fromSelf` використовується дуже рідко.

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

### skipSelf

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

## Коли DI не може знайти потрібного провайдера

Пам'ятайте, що коли DI не може знайти потрібного провайдера, існує всього три можливі причини:

1. ви не передали потрібний провайдер до DI в метадані модуля чи контролера (ну або у випадку тестування - у `Injector.resolveAndCreate()`);
2. ви не імпортували модуль, де передається потрібний вам провайдер, або ж цей провайдер не експортується;
3. ви запитуєте у батьківському інжекторі провайдер з дочірнього інжектора.


[1]: https://uk.wikipedia.org/wiki/%D0%92%D0%BF%D1%80%D0%BE%D0%B2%D0%B0%D0%B4%D0%B6%D0%B5%D0%BD%D0%BD%D1%8F_%D0%B7%D0%B0%D0%BB%D0%B5%D0%B6%D0%BD%D0%BE%D1%81%D1%82%D0%B5%D0%B9
[11]: https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types
[12]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/tsconfig.json#L31
[13]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/package.json#L53
[14]: https://github.com/tc39/proposal-decorators
[15]: https://uk.wikipedia.org/wiki/%D0%9E%D0%B4%D0%B8%D0%BD%D0%B0%D0%BA_(%D1%88%D0%B0%D0%B1%D0%BB%D0%BE%D0%BD_%D0%BF%D1%80%D0%BE%D1%94%D0%BA%D1%82%D1%83%D0%B2%D0%B0%D0%BD%D0%BD%D1%8F) "Singleton"
[16]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/body-parser/src/body-parser.interceptor.ts#L15
[17]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/examples/14-auth-jwt/src/app/modules/services/auth/bearer.guard.ts#L24

[107]: /developer-guides/exports-and-imports
[121]: /components-of-ditsmod-app/providers-collisions
[100]: #передача-провайдерів-в-реєстр-di
[101]: #hierarchy-and-encapsulation-of-injectors
[102]: #інжектор
[103]: /components-of-ditsmod-app/controllers-and-services/#what-is-a-controller
[104]: /components-of-ditsmod-app/extensions/#групи-розширень
[105]: /components-of-ditsmod-app/http-interceptors/
[106]: /components-of-ditsmod-app/guards/
