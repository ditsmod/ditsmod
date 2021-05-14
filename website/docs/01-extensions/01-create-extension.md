---
sidebar_position: 1
---

# Створення розширення

Готовий простий приклад ви можете проглянути у теці [9-one-extension][1].

## Створення провайдера розширення

Створіть провайдер, що впроваджує інтерфейс `Extension`:

```ts
import { Injectable } from '@ts-stack/di';
import { edk } from '@ditsmod/core';

@Injectable()
export class MyExtension implements edk.Extension<void> {
  private inited: boolean;

  async init() {
    if (this.data) {
      return this.data;
    }
    // ...
    // Щось хороше робите
    // ...
    this.data = result;
    return this.data;
  }
}
```

Для роботи розширення, усі необхідні дані ви можете отримати або через конструктор, або від іншого
розширення через виклик `init()`:

```ts
import { Injectable, Inject } from '@ts-stack/di';
import { edk } from '@ditsmod/core';

@Injectable()
export class Extension1 implements edk.Extension<any> {
  private data: any;

  constructor(@Inject(edk.APP_METADATA_MAP) private appMetadataMap: edk.AppMetadataMap) {}

  async init() {
    if (this.data) {
      return this.data;
    }
    // Щось хороше робите із `this.appMetadataMap`.
    // ...
    this.data = result;
    return this.data;
  }
}

@Injectable()
export class Extension2 implements edk.Extension<void> {
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

## Реєстрація розширення

Зареєструйте розширення в існуючій групі розширень, або створіть нову групу, навіть якщо у ній
буде єдине розширення.

### Що являє собою група розширень

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

### Створення токена для нової групи

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

### Реєстрація розширення

Мульти-провайдери груп розширень можуть передаватись тільки в масив `providersPerApp`, і ні в який
інший масив, а їхні токени передаються в масив `extensions`:

```ts
import { Module } from '@ditsmod/core';

import { MY_EXTENSIONS, MyExtension } from './my.extension';

@Module({
  providersPerApp: [{ provide: MY_EXTENSIONS, useClass: MyExtension, multi: true }],
  extensions: [MY_EXTENSIONS],
})
export class SomeModule {}
```

Коли ви передаєте `MY_EXTENSIONS` в масив `extensions`, тим самим ви даєте знати ядру Ditsmod, що
існує така група, і її треба "ставити в чергу" для ініціалізації. А коли ви передаєте провайдери в
масив `providersPerApp`, тим самим ви інструктуєте DI які саме інстанси розширень будуть в цій
групі.

Якщо одне й те саме розширення ви додасте багато разів, то DI створить багато інстансів цього
розширення. Наприклад:

```ts
import { Module } from '@ditsmod/core';

import { MY_EXTENSIONS, MyExtension } from './my.extension';

@Module({
  providersPerApp: [
    { provide: MY_EXTENSIONS, useClass: MyExtension, multi: true },
    { provide: MY_EXTENSIONS, useClass: MyExtension, multi: true },
    { provide: MY_EXTENSIONS, useClass: MyExtension, multi: true },
  ],
  extensions: [MY_EXTENSIONS],
})
export class SomeModule {}
```

В даному разі буде створено три окремі інстанси `MyExtension`, причому не важливо які саме токени
використовуються у властивості `provide`. Щоправда, це станеться тільки якщо ви використовуєте
`useClass` для DI-провайдера.

Це важливий момент для розуміння специфіки роботи DI із мульти-провайдерами, оскільки, можливо, ви
захочете додати своє розширення ще й у групу, що має текстовий токен у форматі
`BEFORE ${<InjectionToken>}`. Такий токен призначається для вже існуючих груп, коли вам
потрібно щоб ваше розширення було проініціалізоване перед ініціалізацією іншого розширення.

Реєстрація розширення в групі із текстовим типом токену відрізняється у трьох моментах:

1. текстовий токен `BEFORE ${<InjectionToken>}` не потрібно передавати в масив `extensions`;
2. у мульти-провайдері використовуйте властивість `useExisting`;
3. `MyExtension` потрібно додатково передавати безпосередньо у масив `providersPerApp`:

```ts
import { Module } from '@ditsmod/core';

import { MyExtension } from './my.extension';
import { OTHER_EXTENSIONS } from './other.extension';

@Module({
  providersPerApp: [
    MyExtension, // <-- Це потрібно робити тільки якщо ви використовуєте `BEFORE ${<InjectionToken>}`
    { provide: MY_EXTENSIONS, useExisting: MyExtension, multi: true },
    { provide: `BEFORE ${OTHER_EXTENSIONS}`, useExisting: MyExtension, multi: true }
  ],
  extensions: [MY_EXTENSIONS], // <-- Сюди не передається токен у форматі `BEFORE ${<InjectionToken>}`
})
export class SomeModule {}
```

В даному прикладі, розширення `MyExtension` буде запускатись перед запуском групи розширень
`OTHER_EXTENSIONS`. Використовуючи властивість `useExisting`, ви інструктуєте DI, що потрібно
створити єдиний інстанс `MyExtension`, не зважаючи на те, що це розширення передалось у дві різні
групи.

## Використання ExtensionsManager

Для спрощення, [Крок перший](#крок-перший) містить приклад, де вказано залежність `Extension2` від
`Extension1`, але рекомендується указувати залежність саме від групи розширень, а не безпосередньо
від конкретного розширенння. В такому разі, вам не потрібно знати імена усіх розширень, що входять
у групу розширень, достатньо знати лише інтерфейс даних, які повертаються з `init()`.

`ExtensionsManager` також корисний тим, що кидає помилки про циклічні залежності між розширеннями,
і показує весь ланцюжок розширень, що призвів до зациклення.

Припустимо `Extension1` (тут не показано) зареєстровано у групі `MY_EXTENSIONS`, а
`Extension2` повинно дочекатись завершення ініціалізації цієї групи розширень. Щоб зробити це, у
конструкторі треба указувати залежність від `ExtensionsManager`, а у `init()` викликати `init()`
цього сервісу:

```ts
import { Injectable } from '@ts-stack/di';
import { edk } from '@ditsmod/core';

@Injectable()
export class Extension2 implements edk.Extension<void> {
  private inited: boolean;

  constructor(private extensionsManager: edk.ExtensionsManager) {}

  async init() {
    if (this.inited) {
      return;
    }

    await this.extensionsManager.init(MY_EXTENSIONS);
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
await this.extensionsManager.init(MY_EXTENSIONS, false);
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
export class MyExtension implements edk.Extension<void> {
  private inited: boolean;

  constructor(private extensionsManager: edk.ExtensionsManager) {}

  async init() {
    if (this.inited) {
      return;
    }

    const rawRoutesMeta = await this.extensionsManager.init(edk.ROUTES_EXTENSIONS);

    rawRoutesMeta.forEach((meta) => {
      // ... Створіть тут нові провайдері і їхні значення, а потім:
      const { providersPerMod, providersPerRou, providersPerReq } = meta;
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


[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/09-one-extension