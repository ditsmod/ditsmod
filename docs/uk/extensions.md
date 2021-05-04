## Що являє собою розширення Ditsmod

Ditsmod має спеціальний API для розширення функціональності `@ditsmod/core`. Щоб скористатись
ним, необхідно імпортувати константу `edk` (скорочення від "Extensions Development Kit"):

```ts
import { edk } from '@ditsmod/core';
```

Ця константа використовується як namespace для утримання у ній типів та даних, призначених для
розширень.

У Ditsmod **розширенням** називається клас, що впроваджує інтерфейс `Extension`:

```ts
interface Extension<T> {
  init(): Promise<T>;
}
```

Кожне розширення потрібно реєструвати, про це буде згадано пізніше, а зараз припустимо, що
така реєстрація відбулася, застосунок запущено, після чого йде наступний процес:

1. збираються метадані з усіх декораторів (`@RootModule`, `@Module`, `@Controller`,
   `@Route`...);
2. зібрані метадані передаються в DI з токеном `APP_METADATA_MAP`, і отже - будь-який
   сервіс, контролер чи розширення може отримати ці метадані у себе в конструкторі;
3. послідовно запускаються усі зареєстровані розширення, точніше - викликаються їхні
   методи `init()` без аргументів;
4. стартує вебсервер, і застосунок починає працювати у звичному режимі, обробляючи HTTP-запити.

Тут варто врахувати, що порядок запуску розширень можна вважати "випадковим", тому кожне розширення
повинно прописувати залежність від іншого розширення (якщо таке є) у своїх конструкторах, а також у
методах `init()`. В такому разі, не залежно від порядку запуску, усі розширення працюватимуть
коректно:

```ts
async init() {
  await this.otherExtention.init();
  // Робота поточного розширення відбувається після завершення ініціалізації іншого розширення.
}
```

Це означає, що метод `init()` певного розширення може викликатись стільки разів, скільки разів
він прописаний у тілі інших розширень, які залежать від роботи даного розширення. Цю особливість
необхідно обов'язково враховувати, щоб не відбувалась зайва ініціалізація:

```ts
async init() {
  if (this.inited) {
    return;
  }
  // Щось хороше робите.
  this.inited = true;
}
```

### Яку корисну роботу може робити розширення

Сама головна відмінність розширення від звичайного сервісу в тому, що розширення може виконувати
свою роботу перед стартом вебсервера, і при цьому воно може динамічно додавати провайдери на рівні
конкретного модуля, роута чи запиту.

Наприклад, модуль `@ditsmod/openapi` дозволяє створювати OpenAPI-документацію за допомогою власного
декоратора `@OasRoute`. Без роботи розширень, метадані, передані у цей новий декоратор, були б
незрозумілими для `@ditsmod/core`.

## Два кроки для створення розширення

Готовий простий приклад ви можете проглянути у теці [9-one-extension](../../examples/09-one-extension).

### Крок перший

Створіть провайдер, що впроваджує інтерфейс `Extension`:

```ts
import { Injectable } from '@ts-stack/di';
import { edk } from '@ditsmod/core';

@Injectable()
export class MyExtension implements edk.Extension {
  private inited: boolean;

  if (this.inited) {
    return;
  }
  // ...
  // Щось хороше робите.
  // ...
  this.inited = true;
}
```

Для роботи розширення, усі необхідні дані ви можете отримати або через конструктор, або від іншого
розширення через виклик `init()`:

```ts
import { Injectable, Inject } from '@ts-stack/di';
import { edk } from '@ditsmod/core';

@Injectable()
export class Extension1 implements edk.Extension {
  private data: any;

  constructor(@Inject(edk.APP_METADATA_MAP) private appMetadataMap: edk.AppMetadataMap) {}

  async init() {
    if (this.data) {
      return this.data;
    }
    // Do something with `this.appMetadataMap` here.
    // ...
    this.data = result;
    return this.data;
  }
}

@Injectable()
export class Extension2 implements edk.Extension {
  private inited: boolean;

  constructor(private extension1: Extension1) {}

  async init() {
    if (this.inited) {
      return;
    }

    const data = await this.extension1.init();
    // Do something here.
    this.inited = true;
  }
}
```

Як бачите, `Extension1` отримує дані для своєї роботи безпосередньо через конструктор. Після того,
як воно виконало свою роботу, результат зберігається локально і видається при повторних викликах.

В `Extension2` теж враховано можливість повторного виклику `init()`, тому під час другого виклику,
цей метод не буде робити повторну ініціалізацію. Окрім цього, `Extension2` залежить від даних,
взятих з `Extension1`, тому в його конструкторі указано `Extension1`, а в тілі `init()` асинхронно
викликається `this.extension1.init()`.

### Крок другий

Зареєструйте розширення в існуючій групі розширень, або створіть нову групу, навіть якщо у ній
буде єдине розширення.

#### Що являє собою група розширень

Групи створюються в DI за допомогою так званих "мульти-провайдерів". Цей вид провайдерів
відрізняється від звичайних DI-провайдерів наявністю властивості `multi: true`. Окрім цього, в DI
можна передавати декілька провайдерів з однаковим токеном, і DI поверне таку саму кількість
інстансів в одному масиві:

```ts
[
  { provide: MY_EXTENSIONS, useClass: MyExtension1, multi: true },
  { provide: MY_EXTENSIONS, useClass: MyExtension2, multi: true },
  { provide: MY_EXTENSIONS, useClass: MyExtension3, multi: true },
];
```

Групи розширень дозволяють:

- запускати нові розширення, навіть якщо про них нічого не знає ядро Ditsmod;
- упорядковувати послідовність роботи різних розширень.

Наприклад, існує група `ROUTES_EXTENSIONS`, куди входять два розширення, кожне із яких готує дані
для встановлення маршрутів для роутера. Але одне із розширень працює із декоратором `@Route()`, що
імпортується із `@ditsmod/core`, інше - працює з декоратором `@OasRoute()`, що імпортується з
`@ditsmod/openapi`. Ці розширення зібрані в одну групу, оскільки їхні методи `init()` повертають
дані з однаковим базовим інтерфейсом.

Ядро Ditsmod нічого не знає про розширення, імпортоване з `@ditsmod/openapi`, але воно знає, що
потрібно дочекатись завершення ініціалізації усіх розширень із групи `ROUTES_EXTENSIONS`, і
тільки потім встановлювати маршрути для роутера.

#### Створення токена для нової групи

На даний момент існує два типи токенів для груп розширень:

1. токен, що є інстансом класу `InjectionToken`;
2. текстовий токен, що створюється на базі вже існуючого токена із пункту 1, по шаблону
   `BEFORE ${<InjectionToken>}`.

Наприклад, щоб створити перший тип токенів для групи `MY_EXTENSIONS`, необхідно зробити наступне:

```ts
import { InjectionToken } from '@ts-stack/di';
import { edk } from '@ditsmod/core';

export const MY_EXTENSIONS = new InjectionToken<edk.Extension<void>[]>('MY_EXTENSIONS');
```

Як бачите, кожна група розширень повинна указувати, що DI повертатиме масив інстансів
розширень: `Extension<void>[]`. Це треба робити обов'язково, відмінність може бути хіба що в інтерфейсі
даних, що повертаються в результаті виклику їхніх методів `init()`:

```ts
import { InjectionToken } from '@ts-stack/di';
import { edk } from '@ditsmod/core';

interface MyInterface {
  one: string;
  two: number;
}

export const MY_EXTENSIONS = new InjectionToken<edk.Extension<MyInterface>[]>('MY_EXTENSIONS');
```

Тепер змінна `result` матиме тип даних `MyInterface[]`:

```ts
const result = await this.extensionsManager.init(MY_EXTENSIONS);
```

#### Реєстрація розширення

Мульти-провайдери груп розширень передаються в масив `providersPerApp`, а їхні токени передаються
в масив `extensions`:

```ts
import { Module } from '@ditsmod/core';

import { MY_EXTENSIONS, MyExtension } from './my-extension';

@Module({
  providersPerApp: [{ provide: MY_EXTENSIONS, useClass: MyExtension, multi: true }],
  extensions: [MY_EXTENSIONS],
})
export class SomeModule {}
```

Реєстрація розширення в групі із текстовим типом токену відрізняється лише тим, що цей токен
не потрібно передавати в масив `extensions`:

```ts
import { Module } from '@ditsmod/core';

import { MY_EXTENSIONS, MyExtension } from './my-extension';

@Module({
  providersPerApp: [{ provide: `BEFORE ${MY_EXTENSIONS}`, useClass: MyExtension, multi: true }],
  extensions: [],
})
export class SomeModule {}
```

Текстовий токен групи розширень - це спеціальний тип токену. В даному прикладі, розширення
`MyExtension` буде запускатись перед запуском групи розширень `MY_EXTENSIONS`.

#### Використання ExtensionsManager

Для спрощення, [Крок перший](#крок-перший) містить приклад, де вказано залежність `Extension2` від
`Extension1`, але рекомендується указувати залежність саме від групи розширень, а не безпосередньо
від конкретного розширенння. В такому разі, вам не потрібно знати імена усіх розширень, що входять
у групу розширень, достатньо знати лише інтерфейс даних, які повертаються з `init()`.
`ExtensionsManager` також корисний тим, що кидає помилки про циклічні залежності між розширеннями,
і показує весь ланцюжок розширень, що призвів до зациклення.

Припустимо `Extension1` (тут не показано) зареєстровано у групі `PRE_ROUTER_EXTENSIONS`, а
`Extension2` повинно дочекатись завершення ініціалізації цієї групи розширень. Щоб зробити це, у
конструкторі треба указувати залежність від `ExtensionsManager`, а у `init()` викликати `init()`
цього сервісу:

```ts
import { Injectable } from '@ts-stack/di';
import { edk } from '@ditsmod/core';

@Injectable()
export class Extension2 implements edk.Extension {
  inited: boolean;

  constructor(private extensionsManager: edk.ExtensionsManager) {}

  async init() {
    if (this.inited) {
      return;
    }

    await this.extensionsManager.init(edk.PRE_ROUTER_EXTENSIONS);
    // Do something here.
    this.inited = true;
  }
}
```

`ExtensionsManager` буде послідовно викликати ініціалізацію усіх розширення з указаної групи,
а результат їхньої роботи повертатиме у вигляді масиву. Якщо розширення повертатимуть масиви,
вони будуть автоматично змерджені у єдиний результуючий масив. Цю поведінку можна змінити,
якщо другим аргументом у `init()` передати `false`:

```ts
await this.extensionsManager.init(edk.PRE_ROUTER_EXTENSIONS, false);
```

## Динамічне додавання провайдерів

Кожне розширення може вказати залежність від групи розширень `ROUTES_EXTENSIONS`, щоб
динамічно додавати провайдери на рівні:

- модуля - у масив `providersPerMod`,
- роуту - у масив `providersPerRou`,
- чи запиту - у масив `providersPerReq`.

Наприклад так:

```ts
import { Injectable } from '@ts-stack/di';
import { edk } from '@ditsmod/core';

@Injectable()
export class MyExtension implements edk.Extension {
  inited: boolean;

  constructor(private extensionsManager: edk.ExtensionsManager) {}

  async init() {
    if (this.inited) {
      return;
    }

    const rawRoutesMeta = await this.extensionsManager.init(edk.ROUTES_EXTENSIONS);

    rawRouteMeta.forEach((data) => {
      // ... Створіть тут нові провайдері і їхні значення, а потім:
      const { providersPerMod, providersPerRou, providersPerReq } = data;
      providersPerMod.push({ provide: MyProviderPerMod, useValue: myValue1 });
      providersPerRou.push({ provide: MyProviderPerRoute, useValue: myValue1 });
      providersPerReq.push({ provide: MyProviderPerReq, useValue: myValue2 });
    });

    this.inited = true;
  }
}
```

Після роботи даного розширення, будь-який контролер чи сервіс (включаючи інтерсептори) може
запитувати у себе в конструкторі `MyProviderPerMod`, `MyProviderPerRoute` чи `MyProviderPerReq`.

Звичайно ж, таке динамічне додавання провайдерів можливе лише перед стартом вебсервера.

## В якому саме масиві потрібно оголошувати групу розширень

На даний момент, групу розширень можна оголошувати тільки в масиві `providersPerApp`.
