---
sidebar_position: 2
---

# Dependency Injection

## Для чого потрібен DI?

Давайте спочатку ознайомимось із загальною картиною роботи [Dependency Injection][1] (або просто DI), а потім в деталях розглянемо кожен важливий компонент окремо.

Мабуть найпростіше зрозуміти, що саме робить DI, на прикладах. В даному разі, нам потрібен метод `doSomething()`, який буде використовуватись у багатьох місцях нашої програми:

```ts {11-13}
// services.ts
export class Service1 {}

export class Service2 {
  constructor(service1: Service1) {}
}

export class Service3 {
  constructor(service2: Service2) {}

  doSomething(param1: any) {
    // ...
  }
}
```

Покищо `service3.doSomething()` використовується досить просто:

```ts {5-8}
import { Service1, Service2, Service3 } from './services.js';

export class SomeService {
  method1() {
    const service1 = new Service1();
    const service2 = new Service2(service1);
    const service3 = new Service3(service2);
    service3.doSomething(123);
  }
}
```

Тепер уявіть задачу, яка вимагає щоб конструктор `Service3` приймав два параметри. Також уявіть, що `Service3` використовується у 20 інших файлах нашої програми. Нам прийдеться обійти усі ці файли, щоб внести відповідні корективи.

Усієї цієї роботи могло і не бути, якщо б ми не опирались на конкретну реалізацію створення інстансу `Service3`. По-суті, нам не важливо скільки параметрів має конструктор `Service3`, головне для нас - це використання інстансу цього класу.

Наступний приклад майже не відрізняється від попереднього прикладу, де ми також оголошували клас `Service3`, але тут ми дописали декоратор `injectable` над кожним класом, який має конструктор з параметрами:

```ts {6,11}
// services.ts
import { injectable } from '@ditsmod/core';

export class Service1 {}

@injectable()
export class Service2 {
  constructor(service1: Service1) {}
}

@injectable()
export class Service3 {
  constructor(service2: Service2) {}

  doSomething(param1: any) {
    // ...
  }
}
```

Покищо можна і не знати що саме робить декоратор `injectable`, зараз важливіше дізнатись, як тепер ми можемо запитувати інстанс `Service3` у будь-якому місці нашої програми:

```ts {4,6,9}
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

Щоправда, щоб DI зміг створити інстанс класу `Service3`, до реєстру DI потрібно передати усі необхідні класи в масиві (про це буде йти мова пізніше). DI має змогу проглядати параметри конструкторів кожного з цих класів, тому він може створювати та автоматично підставляти відповідні інстанси класів.

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

Давайте спробуємо розібратись, як саме DI отримує повну інформацію про параметри конструктора класу. В наступному прикладі показано клас, в конструкторі якого є три параметра, кожен із яких має свій TypeScript-тип:

```ts
// ...
class MyService {
  constructor(
    private one: One,
    private two: Two,
    private three: Three,
  ) {
    // ...
  }
}
```

А тепер давайте подивимось, який вигляд матиме цей клас після компіляції у JavaScript-код:

```ts
// ...
class MyService {
  one;
  two;
  three;

  constructor(one, two, three) {
    this.one = one;
    this.two = two;
    this.three = three;
  }
}
```

Тобто, TypeScript-типи зникають з параметрів конструктора у JavaScript-коді. Отже, під час компіляції TypeScript повинен згенерувати спеціальну функцію, яка дозволить зберегти TypeScript-типи, які ми передаємо у параметри конструктора. Ця функція може бути, наприклад, такою:

```ts
function setConstructorTokens(tokens) {
  MyService.staticProperty = tokens;
}

setConstructorTokens([One, Two, Three]);
```

Приблизно так воно насправді і працює. Подібні функції TypeScript-компілятор автоматично генерує у кожному файлі, де є класи з декораторами. Очевидно, що в нашому прикладі функція `setConstructorTokens` може працювати тільки з JavaScript-значеннями, вона не зможе прийняти в якості аргументів такі типи, які у TypeScript-коді ми оголошуємо з ключовими словами `interface`, `type` і т.п., бо їх не існує у JavaScript-коді.

JavaScript-значення, які приймає `setConstructorTokens`, називаються **токенами**. Передати токен можна у короткій або довгій формі вказання залежності. Давайте знову розглянемо попередній приклад:

```ts {6}
import { injectable } from '@ditsmod/core';
import { FirstService } from './first.service.js';

@injectable()
export class SecondService {
  constructor(private firstService: FirstService) {}
  // ...
}
```

Це **коротка форма** вказання залежності, вона має суттєві обмеження, бо таким чином можна вказати залежність лише від певного _класу_. В даному разі `FirstService` використовується одночасно і як тип змінної, і в якості токену.

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

Коли використовується `inject`, DI бере до уваги лише переданий в нього токен. В даному разі DI ігнорує тип змінної - `InterfaceOfItem[]`, використовуючи в якості токена текстовий рядок `some-string`. Таким чином, DI дає можливість розділяти токен та тип змінної, тому в конструкторі можна отримати будь-який тип залежності, включаючи різні типи масивів чи enum.

Токеном може бути референс на клас, об'єкт чи функцію, також у якості токену можна використовувати примітивні значення, окрім `undefined`. Для довгої форми вказання залежностей, у якості токена рекомендуємо використовувати інстанс класу `InjectionToken<T>`, оскільки клас `InjectionToken<T>` має параметризований тип `T`, за допомогою якого можна вказати тип даних, який асоціюється з даним токеном:

```ts {5,14}
// tokens.ts
import { InjectionToken } from '@ditsmod/core';
import { InterfaceOfItem } from './types.js';

const SOME_TOKEN = new InjectionToken<InterfaceOfItem[]>('InterfaceOfItem');

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

DI створює значення у реєстрі для кожного токена використовуючи так звані **провайдери**. Отже, щоб DI міг вирішити певну залежність, спочатку необхідно передати відповідний провайдер до реєстру DI, а потім DI буде видавати значення цього провайдера по його токену. Тому якщо ви вказали певну залежність у класі, але не передали відповідного провайдера, DI не зможе вирішити дану залежність. Про те, як саме можна передавати провайдери до DI, йдеться [в наступному розділі][100]. Провайдер може бути або класом, або об'єктом:

```ts {3-8}
import { Class } from '@ditsmod/core';

type Provider = Class<any> |
{ token: any, useClass: Class<any>, multi?: boolean } |
{ token: any, useValue: any, multi?: boolean } |
{ token?: any, useFactory: (...args: any[]) => any, deps: any[], multi?: boolean } |
{ token?: any, useFactory: [Class<any>, Class<any>.prototype.methodName], multi?: boolean } |
{ token: any, useToken: any, multi?: boolean }
```

Зверніть увагу, що токен для провайдера з властивістю `useFactory` є опціональним, оскільки DI може використати функцію чи метод вказаного класу у якості токена.


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
  - **Перша форма** передбачає, що до `useFactory` можна передавати функцію, яка може мати параметри - тобто може мати залежність. Цю залежність необхідно додатково вручну вказувати у властивості `deps` у вигляді масиву токенів, причому порядок передачі токенів важливий:
    ```ts {6}
    function fn1(service1: Service1, service2: Service2) {
      // ...
      return 'some value';
    }

    { token: 'token3', useFactory: fn1, deps: [Service1, Service2] }
    ```

    Зверніть увагу, що у властивість `deps` передаються саме _токени_ провайдерів, і DI їх сприймає саме як токени, а не як провайдери. Тобто для цих токенів до реєстру DI ще треба буде [передати відповідні провайдери][100]. Також зверніть увагу, що у `deps` не передаються декоратори для параметрів (зокрема такі як `fromSelf` та `skipSelf`). Якщо для вашої фабрики необхідні декоратори параметрів - вам потрібно скористатись другою формою передачі аргументів до `useFactory`.

  - **Друга форма** передбачає, що до `useFactory` передається [tuple][11], де на першому місці повинен бути клас, а на другому місці - метод цього класу, який повинен повернути якесь значення для вказаного токена. Наприклад, якщо клас буде таким:

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

  таким чином ви говорите DI: "Коли споживачі провайдерів запитують токен `SecondService`, потрібно використати значення для токена `FirstService`". Іншими словами, ця директива робить аліас `SecondService`, який вказує на `FirstService`.

Тепер, коли ви вже ознайомились з поняттям **провайдер**, можна уточнити, що під **залежністю** розуміють залежність саме від **значення провайдера**. Таку залежність мають **споживачі** значень провайдерів або в конструкторах сервісів, або в конструкторах чи методах контролерів, або в методі `get()` [інжекторів][102] (про це буде згадано пізніше).

## Інжектор

Вище було згадано за так званий **реєстр DI**. Тепер же, коли ви знаєте для чого DI використовує даний реєстр, саме час дізнатись, що ці реєстри знаходяться в інжекторах, і таких інжекторів в Ditsmod-застосунку може бути багато. Але спочатку давайте розберемось як працюють інжектори.

Якщо сильно спростити схему роботи DI, можна сказати що DI приймає масив провайдерів на вході, а на виході видає інжектор, який вміє створювати значення для кожного переданого провайдера. Це має приблизно наступну картину:

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

Метод `Injector.resolveAndCreate()` на вході приймає масив провайдерів, а на виході видає певний об'єкт, що якраз і називається **інжектором**. Цей інжектор очевидно вміє видавати значення кожного провайдера по його токену за допомогою методу `injector.get()`, з урахуванням усього ланцюжка залежностей (`Service3` -> `Service2` -> `Service1`).

Що робить `injector.get()`:

- коли у нього запитують `Service3`, він проглядає конструктор цього класу, бачить залежність від `Service2`;
- потім проглядає конструктор у `Service2`, бачить залежність від `Service1`;
- потім проглядає конструктор у `Service1`, не знаходить там залежності, і тому першим створює інстанс `Service1`;
- потім створює інстанс `Service2` використовуючи інстанс `Service1`;
- і останнім створює інстанс `Service3` використовуючи інстанс `Service2`;
- якщо пізніше будуть запитувати повторно інстанс `Service3`, метод `injector.get()` буде повертати раніше створений інстанс `Service3` з кешу даного інжектора.

Інколи останній пункт (коли інстанс `Service3` повертається з кешу інжектора), є небажаним. В такому разі ви можете скористатись методом `injector.resolveAndInstantiate()`, який приймає провайдер, резолвить його в контексті поточного інжектора, і кожен раз повертає новий інстанс даного провайдера.

Під час автоматичного вирішення залежності класу (коли інжектор не використовується напряму), Ditsmod під капотом використовує метод `injector.get()`.

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

Нагадаємо, що вищі в ієрархії інжектори не мають доступу до нижчих в ієрархії інжекторів. Це означає, що **при передачі класу у певний інжектор, потрібно враховувати мінімальний рівень ієрархії його залежностей**.

Наприклад, якщо ви напишете клас, що має залежність від HTTP-запиту, ви зможете його передати тільки у масив `providersPerReq`, бо тільки з цього масиву формується інжектор, до якого Ditsmod буде автоматично додавати провайдер з об'єктом HTTP-запиту. З іншого боку, інстанс цього класу матиме доступ до усіх своїх батьківських інжекторів: на рівні роуту, модуля, та застосунку. Тому даний клас може залежати від провайдерів на будь-якому рівні.

Також ви можете написати певний клас і передати його в масив `providersPerMod`, в такому разі він може залежати тільки від провайдерів на рівні модуля, або на рівні застосунку. Якщо він буде залежати від провайдерів, які ви передали в масив `providersPerRou` чи `providersPerReq`, ви отримаєте помилку про те, що ці провайдери не знайдені.

### Ієрархія інжекторів контролера

Будь-який контролер, окрім свого власного інжектора на рівні запиту, має ще й три батьківські інжектори: на рівні роута, модуля та застосунка. Ці інжектори також формуються на основі провайдерів, які ви передаєте в наступні масиви:

- `providersPerApp`;
- `providersPerMod`;
- `providersPerRou`;
- `providersPerReq` (<-- це масив, з якого формується інжектор для контролера).

Тобто контролер може залежати від сервісів на будь-якому рівні.

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

По-суті, мульти-провайдери дозволяють створювати групи провайдерів, що мають спільний токен. Ця можливість зокрема використовується для створення групи `HTTP_INTERCEPTORS`, а також для створення різних груп розширень.

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

1. спочатку передавайте мультипровайдер в масив для формування інжектора та використовуйте властивість `useToken`;
2. потім передавайте клас який ви хочете підмінити;
3. ну і в кінець масиву передавайте клас, який підмінює потрібний вам клас.

```ts
import { Injector } from '@ditsmod/core';

import { HTTP_INTERCEPTORS } from './constants.js';
import { DefaultInterceptor } from './default.interceptor.js';
import { MyInterceptor } from './my.interceptor.js';

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

Як бачите, `Service2` залежить від `Service1`, причому декоратор `skipSelf` вказує DI: "При створенні інстансу `Service1` пропустити той інжектор, який створить інстанс `Service2`, і зразу звертатись до батьківського інжектора". Коли створюється батьківський інжектор, йому передають обидва необхідні сервіси, але через `skipSelf` він не зможе звернутись до батьківського інжектора, бо його у нього немає. Тому батьківський інжектор не зможе вирішити залежність.

А при створенні дочірнього інжектора, йому не передали `Service1`, зате він може звернутись до батьківського інжектора за ним. Тому дочірній інжектор успішно вирішить залежність `Service2`.

## Коли DI не може знайти потрібного провайдера

Пам'ятайте, що коли DI не може знайти потрібного провайдера, існує всього три можливі причини:

1. ви не передали потрібний провайдер до DI в метадані модуля чи контролера (ну або у випадку тестування - у `Injector.resolveAndCreate()`);
2. ви не імпортували модуль, де передається потрібний вам провайдер, або ж цей провайдер не експортується;
3. ви запитуєте у батьківському інжекторі провайдер з дочірнього інжектора.


[1]: https://uk.wikipedia.org/wiki/%D0%92%D0%BF%D1%80%D0%BE%D0%B2%D0%B0%D0%B4%D0%B6%D0%B5%D0%BD%D0%BD%D1%8F_%D0%B7%D0%B0%D0%BB%D0%B5%D0%B6%D0%BD%D0%BE%D1%81%D1%82%D0%B5%D0%B9
[11]: https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types
[12]: https://github.com/ditsmod/ditsmod/blob/core-2.51.1/packages/core/tsconfig.json#L30
[13]: https://github.com/ditsmod/ditsmod/blob/core-2.51.1/packages/core/package.json#L52
[14]: https://github.com/tc39/proposal-decorators

[107]: /developer-guides/exports-and-imports
[121]: /components-of-ditsmod-app/providers-collisions
[100]: #передача-провайдерів-в-реєстр-di
[101]: #ієрархія-інжекторів
[102]: #інжектор
