## Що являє собою розширення Ditsmod

Ditsmod має спеціальне API (покищо експериментальне) для розширення функціональності
`@ditsmod/core`. Щоб скористатись ним, необхідно імпортувати константу `edk`
(скорочення від "Extensions Development Kit"):

```ts
import { edk } from '@ditsmod/core';
```

Ця константа використовується як namespace для утримання у ній типів та даних, призначених для
розширень.

У Ditsmod **розширенням** називається клас, що впроваджує інтерфейс `Extension`:

```ts
interface Extension<T = any> {
  init(): T | Promise<T>;
}
```

Коли розширення зареєстровано і відбувся запуск застосунку, йде наступний процес:

1. збираються метадані з усіх декораторів (з `@RootModule`, `@Module`, `@Controller`,
   `@Route`...);
2. зібрані метадані передаються в інжектор DI з токеном `EXTENSIONS_MAP`, а отже, будь-яке
   розширення може отримати ці метадані у себе в конструкторі;
3. автоматично запускаються усі зареєстровані розширення, точніше - викликаються їхні методи
   `init()` без аргументів;
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

## Два кроки для створення розширення

Готовий простий приклад ви можете проглянути у теці [9-one-extension](../../examples/9-one-extension).

### Крок перший

Створіть провайдера, що впроваджує інтерфейс `Extension`:

```ts
import { Injectable } from '@ts-stack/di';
import { edk } from '@ditsmod/core';

@Injectable()
export class MyExtension implements edk.Extension {
  async init() {
    // ... Do something here
  }
}
```

Для роботи розширення, усі необхідні дані ви можете отримати або через конструктор, або від іншого
розширення через виклик `init()`:

```ts
import { Injectable, Inject } from '@ts-stack/di';
import { edk } from '@ditsmod/core';

@Injectable()
export class Extension1 implements edk.Extension {
  #data: any;

  constructor(@Inject(edk.EXTENSIONS_MAP) private extensionsMap: edk.ExtensionsMap) {}

  async init() {
    if (this.#data) {
      return this.#data;
    }
    // Do something with `this.extensionsMap` here.
    // ...
    this.#data = result;
    return this.#data;
  }
}

@Injectable()
export class Extension2 implements edk.Extension {
  #inited: boolean;

  constructor(private extension1: Extension1) {}

  async init() {
    if (this.#inited) {
      return;
    }

    const data = await this.extension1.init();
    // Do something here.
    this.#inited = true;
  }
}
```

Як бачите, `Extension1` отримує дані для своєї роботи безпосередньо через конструктор. Після того,
як воно виконало свою роботу, результат зберігає локально, і при повторних викликах, віддає його.

В `Extension2` теж враховано можливість повторного виклику `init()`, тому під час другого виклику,
цей метод не буде робити повторну ініціалізацію. Окрім цього, `Extension2` залежить від даних,
взятих з `Extension1`, тому в його конструкторі указано `Extension1`, а в тілі `init()` асинхронно
викликається `this.extension1.init()`.

### Крок другий

Зареєструйте розширення в існуючій групі розширень, або створіть нову групу, навіть якщо у ній
буде єдине розширення.

#### Реєстрація розширення в існуючій групі розширень

На даний момент, із коробки, Ditsmod має дві групи розширень:

- `ROUTES_EXTENSIONS` - тут реєструються усі розширення, що генерують дані з інтерфейсом
  `PreRouteMeta[]` для маршрутизатора;
- `DEFAULT_EXTENSIONS` - тут реєструються усі розширення, що не повертають жодних даних (наприклад,
  тут зареєстровано розширення, що встановлює маршрути).

Реєстрація розширень в будь-якій групі відбувається за допомогою мульти-провайдерів:

```ts
import { Module, edk } from '@ditsmod/core';

import { MyExtension } from './my-extension';

@Module({
  // ...
  providersPerApp: [{ provide: edk.DEFAULT_EXTENSIONS, useClass: MyExtension, multi: true }],
  extensions: [edk.DEFAULT_EXTENSIONS],
})
export class SomeModule {}
```

Тут використовується токен групи `DEFAULT_EXTENSIONS`, і указується він у масиві `extensions`,
а також у мульти-провайдері, переданому в масив `providersPerApp` (хоча можна передавати і у
`providersPerMod`).

#### Використання ExtensionsManager

Для спрощення, [Крок перший](#крок-перший) містить приклад, де вказано залежність `Extension2` від
`Extension1`, але рекомендується указувати залежність саме від групи розширень, а не безпосередньо
від конкретного розширенння. В такому разі, вам не потрібно знати імена усіх розширень, що входять
у групу розширень, достатньо знати лише інтерфейс даних, які повертаються з `init()`.

Припустимо `Extension1` (тут не показано) зареєстровано у групі `DEFAULT_EXTENSIONS`, а
`Extension2` повинно дочекатись завершення ініціалізації цієї групи розширень. Щоб зробити це, у
конструкторі треба указувати залежність від `ExtensionsManager`, а у `init()` викликати `init()`
цього сервісу:

```ts
import { Injectable, Inject } from '@ts-stack/di';
import { edk } from '@ditsmod/core';

@Injectable()
export class Extension2 implements edk.Extension {
  #inited: boolean;

  constructor(private extensionsManager: edk.ExtensionsManager) {}

  async init() {
    if (this.#inited) {
      return;
    }

    await this.extensionsManager.init(edk.DEFAULT_EXTENSIONS);
    // Do something here.
    this.#inited = true;
  }
}
```

`ExtensionsManager` буде послідовно викликати ініціалізацію усіх розширення з указаної групи,
а результат їхньої роботи повертатиме у вигляді масиву. Якщо розширення повертатимуть масиви,
вони будуть автоматично змерджені у єдиний результуючий масив. Цю поведінку можна змінити,
якщо другим аргументом у `init()` передати `false`:

```ts
await this.extensionsManager.init(edk.DEFAULT_EXTENSIONS, false);
```

#### Створення токена для нової групи

Кожен токен для групи розширень повинен бути інстансом класу `InjectionToken`. Наприклад, щоб
створити токен для групи `MY_EXTENSIONS`, необхідно зробити наступне:

```ts
import { InjectionToken } from '@ts-stack/di';
import { edk } from '@ditsmod/core';

export const MY_EXTENSIONS = new InjectionToken<edk.Extension[]>('MY_EXTENSIONS');
```
