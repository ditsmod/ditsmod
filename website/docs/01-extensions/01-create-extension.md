---
sidebar_position: 1
---

# Створення розширення

Готовий простий приклад ви можете проглянути у теці [09-one-extension][1].

## Створення класу розширення

Створіть клас, що впроваджує інтерфейс `Extension`:

```ts
import { Injectable } from '@ts-stack/di';
import { Extension } from '@ditsmod/core';

@Injectable()
export class MyExtension implements Extension<void> {
  private data: boolean;

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

Для роботи розширення, усі необхідні дані ви можете отримати або через конструктор, або від іншого розширення через виклик його методу `init()`:

```ts
import { Injectable, Inject } from '@ts-stack/di';
import { Extension, MetadataPerMod1 } from '@ditsmod/core';

@Injectable()
export class Extension1 implements Extension<any> {
  private data: any;

  constructor(private metadataPerMod1: MetadataPerMod1) {}

  async init() {
    if (this.data) {
      return this.data;
    }
    // Щось хороше робите із this.metadataPerMod1.
    // ...
    this.data = result;
    return this.data;
  }
}

@Injectable()
export class Extension2 implements Extension<void> {
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

Як бачите, `Extension1` отримує дані для своєї роботи безпосередньо через конструктор. Після того, як воно виконало свою роботу, результат зберігається локально і видається при повторних викликах.

В `Extension2` теж враховано можливість повторного виклику `init()`, тому під час другого виклику, цей метод не буде робити повторну ініціалізацію. Окрім цього, `Extension2` залежить від даних, взятих з `Extension1`, тому в його конструкторі указано `Extension1`, а в тілі `init()` асинхронно викликається `this.extension1.init()`.

## Реєстрація розширення

Зареєструйте розширення в існуючій групі розширень, або створіть нову групу, навіть якщо у ній буде єдине розширення. Для нової групи вам потрібно буде створити новий DI токен.

### Для чого потрібні групи розширень

Групи розширень дозволяють:

- Упорядковувати послідовність роботи розширень, що виконують різні види робіт. Наприклад, одна група розширень може додавати роути, друга - HTTP-інтерсептори, третя - встановлювати метрики, і т.п.
- Додавати нові розширення у певну групу розширень, без необхідності змінювати код тих розширень, що вже є у даній групі розширень.

Наприклад, існує група `ROUTES_EXTENSIONS`, куди можуть входити два розширення, кожне із яких готуватиме дані для встановлення маршрутів для роутера. Але одне із розширень працюватиме із декоратором `@Route()`, що імпортується із `@ditsmod/core`, інше - працюватиме з декоратором `@OasRoute()`, що імпортується з `@ditsmod/openapi`. В такому разі ці розширення будуть зібрані в одну групу, оскільки їхні методи `init()` повертають дані з однаковим базовим інтерфейсом.

Ядро Ditsmod нічого не знає про розширення, імпортоване з `@ditsmod/openapi`, але воно знає, що потрібно дочекатись завершення ініціалізації усіх розширень із групи `ROUTES_EXTENSIONS`, і тільки тоді встановлювати маршрути для роутера. Якщо пізніше виникне необхідність, то в дану групу можна буде додати й інші розширення, що теж повертають дані з базовим інтерфейсом для даної групи.

### Створення токена нової групи

Токен групи розширень повинен бути інстансом класу `InjectionToken`.

Наприклад, щоб створити токен для групи `MY_EXTENSIONS`, необхідно зробити наступне:

```ts
import { InjectionToken } from '@ts-stack/di';
import { Extension } from '@ditsmod/core';

export const MY_EXTENSIONS = new InjectionToken<Extension<void>[]>('MY_EXTENSIONS');
```

Як бачите, кожна група розширень повинна указувати, що DI повертатиме масив інстансів розширень: `Extension<void>[]`. Це треба робити обов'язково, відмінність може бути хіба що в типі даних, що повертаються в результаті виклику їхніх методів `init()`:

```ts
import { InjectionToken } from '@ts-stack/di';
import { Extension } from '@ditsmod/core';

interface MyInterface {
  one: string;
  two: number;
}

export const MY_EXTENSIONS = new InjectionToken<Extension<MyInterface>[]>('MY_EXTENSIONS');
```

Тепер змінна `result` матиме тип даних `MyInterface[]`:

```ts
const result = await this.extensionsManager.init(MY_EXTENSIONS);
```

### Реєстрація розширення

В масив метаданих модуля `extensions` можуть передаватись масиви двох типів:

```ts
type ExtensionItem1 = [
  groupToken: InjectionToken<Extension<any>[]>,
  nextToken: InjectionToken<Extension<any>[]>,
  extension: ExtensionType,
  exported?: boolean
];

type ExtensionItem2 = [
  groupToken: InjectionToken<Extension<any>[]>,
  extension: ExtensionType,
  exported?: boolean
];
```

Перший тип масиву використовується, коли вашу групу розширень потрібно запускати перед іншою групою розширень:

```ts
import { Module, ROUTES_EXTENSIONS } from '@ditsmod/core';

import { MY_EXTENSIONS, MyExtension } from './my.extension';

@Module({
  extensions: [
    [MY_EXTENSIONS, ROUTES_EXTENSIONS, MyExtension, true]
  ],
})
export class SomeModule {}
```

Тобто в масиві на першому місці йде токен групи розширень `MY_EXTENSIONS`, до якої належить ваше розширення. На другому місці йде група розширень `ROUTES_EXTENSIONS`, перед якою потрібно запускати групу `MY_EXTENSIONS`. На третьому місці - клас розширення, а на четвертому - `true` - це індикатор того, чи потрібно експортувати дане розширення з поточного модуля.

Якщо ж для вашого розширення не важливо перед якою групою розширень воно працюватиме, можна використати другий тип масиву:

```ts
import { Module } from '@ditsmod/core';

import { MY_EXTENSIONS, MyExtension } from './my.extension';

@Module({
  extensions: [
    [MY_EXTENSIONS, MyExtension, true]
  ],
})
export class SomeModule {}
```

Тобто усе те саме, що і у масиві першого типу, але без групи розширень на першому місці, перед якою повинно стартувати ваше розширення.

## Використання ExtensionsManager

Для спрощення, [Створення класу розширення][2] містить приклад, де вказано залежність `Extension2` від `Extension1`, але рекомендується указувати залежність саме від групи розширень, а не безпосередньо від конкретного розширенння. В такому разі, вам не потрібно знати імена усіх розширень, що входять у групу розширень, достатньо знати лише інтерфейс даних, які повертаються з `init()`.

`ExtensionsManager` використовується для запуску груп розширень, він також корисний тим, що кидає помилки про циклічні залежності між розширеннями, і показує весь ланцюжок розширень, що призвів до зациклення.

Припустимо `MyExtension` повинно дочекатись завершення ініціалізації групи `OTHER_EXTENSIONS`. Щоб зробити це, у конструкторі треба указувати залежність від `ExtensionsManager`, а у `init()` викликати `init()` цього сервісу:

```ts
import { Injectable } from '@ts-stack/di';
import { Extension, ExtensionsManager } from '@ditsmod/core';

import { OTHER_EXTENSIONS } from './other.extensions';

@Injectable()
export class MyExtension implements Extension<void> {
  private inited: boolean;

  constructor(private extensionsManager: ExtensionsManager) {}

  async init() {
    if (this.inited) {
      return;
    }

    await this.extensionsManager.init(OTHER_EXTENSIONS);
    // Do something here.
    this.inited = true;
  }
}
```

`ExtensionsManager` буде послідовно викликати ініціалізацію усіх розширень з указаної групи, а результат їхньої роботи повертатиме у вигляді масиву. Якщо розширення повертатимуть масиви, вони будуть автоматично змерджені у єдиний результуючий масив. Цю поведінку можна змінити, якщо другим аргументом у `init()` передати `false`:

```ts
await this.extensionsManager.init(OTHER_EXTENSIONS, false);
```

Важливо пам'ятати, що запуск `init()` певного розширення обробляє дані лише в контексті поточного модуля. Наприклад, якщо `MyExtension` імпортовано у три різні модулі, то Ditsmod буде послідовно обробляти ці три модулі із трьома різними інстансами `MyExtension`. Це означає, що один інстанс розширення зможе збирати дані лише з одного модуля.

У випадку, коли вам потрібно накопичувати результати роботи певного розширення з усіх модулів, необхідно робити наступне:

```ts
import { Injectable } from '@ts-stack/di';
import { Extension, ExtensionsManager } from '@ditsmod/core';

import { OTHER_EXTENSIONS } from './other.extensions';

@Injectable()
export class MyExtension implements Extension<void | false> {
  private inited: boolean;

  constructor(private extensionsManager: ExtensionsManager) {}

  async init() {
    if (this.inited) {
      return;
    }

    const result = await this.extensionsManager.init(OTHER_EXTENSIONS, true, MyExtension);
    if (!result) {
      return false;
    }

    // Do something here.
    this.inited = true;
  }
}
```

Тобто коли вам потрібно щоб `MyExtension` отримало дані з групи `OTHER_EXTENSIONS` з усього застосунку, третім параметром тут потрібно передавати `MyExtension`:

```ts
const result = await this.extensionsManager.init(OTHER_EXTENSIONS, true, MyExtension);
```

Даний вираз буде повертати `false` до того часу, поки не буде викликано останній раз групу `OTHER_EXTENSIONS`. Наприклад, якщо група `OTHER_EXTENSIONS` працює у трьох різних модулях, то цей вираз у перших двох модулях повертатиме `false`, а у третьому - те значення, яке повинно повертати ця група розширень.

## Динамічне додавання провайдерів

Кожне розширення може вказати залежність від групи розширень `ROUTES_EXTENSIONS`, щоб динамічно додавати провайдери на рівні:

- модуля,
- роуту,
- запиту.

Наприклад так:

```ts
import { Injectable } from '@ts-stack/di';
import { Extension, ExtensionsManager, ROUTES_EXTENSIONS } from '@ditsmod/core';

@Injectable()
export class MyExtension implements Extension<void> {
  private inited: boolean;

  constructor(private extensionsManager: ExtensionsManager) {}

  async init() {
    if (this.inited) {
      return;
    }

    const rawRoutesMeta = await this.extensionsManager.init(ROUTES_EXTENSIONS);

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

Після роботи даного розширення, будь-який контролер чи сервіс (включаючи інтерсептори) може запитувати у себе в конструкторі `MyProviderPerMod`, `MyProviderPerRoute` чи `MyProviderPerReq`.

Звичайно ж, таке динамічне додавання провайдерів можливе лише перед стартом вебсервера.

[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/09-one-extension
[2]: #створення-класу-розширення
