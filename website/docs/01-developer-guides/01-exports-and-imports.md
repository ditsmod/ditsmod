---
sidebar_position: 1
---

# Експорт, імпорт, прикріплення

Модуль, де ви декларуєте певні [провайдери][4], називається **модулем-хостом** для цих провайдерів. А коли ви використовуєте дані провайдери у зовнішньому модулі, то цей зовнішній модуль називається **модулем-споживачем** даних провайдерів.

Для того, щоб модуль-споживач міг використовувати провайдери з модуля-хоста, спочатку необхідно експортувати провайдери з модуля-хоста. Робиться це у метаданих, які передаються у декоратор `featureModule` або `rootModule`.

## Експорт провайдерів з `featureModule`

У метадані модуля-хоста, у властивість `exports` можна передавати лише [токени][5] провайдерів. Тобто у властивість `exports` не можна безпосередньо передавати провайдери у формі об'єкта:

```ts {9}
import { featureModule } from '@ditsmod/core';

import { FirstService } from './first.service.js';
import { SecondService } from './second.service.js';
import { ThirdService } from './third.service.js';

@featureModule({
  providersPerMod: [FirstService, { token: SecondService, useClass: ThirdService }],
  exports: [SecondService],
})
export class SomeModule {}
```

В даному разі, у властивість `exports` передається `SecondService`, тому Ditsmod знайде провайдер у формі об'єкта: `{ token: SecondService, useClass: ThirdService }` в масиві `providersPerMod` і зробить його експорт.

Майте на увазі, що експортувати провайдери можна лише ті, що передаються в наступні масиви:

- `providersPerMod`;
- `providersPerRou`;
- `providersPerReq`.

Експортувати провайдери, що передаються у `providersPerApp`, не має сенсу, оскільки з цього масиву буде сформовано [інжектор][1] на рівні застосунку. Тобто провайдери з масиву `providersPerApp` будуть доступними для будь-якого модуля, на будь-якому рівні, і без експорту.

Також майте на увазі, що з модуля-хоста потрібно експортувати лише ті сервіси, які безпосередньо будуть використовуватись у модулях-споживачах. У прикладі вище, `SecondService` може залежати від `FirstService`, але `FirstService` не потрібно експортувати, якщо він безпосередньо не використовується у модулі-споживачу. Таким чином забезпечується інкапсуляція модулів.

Експортувати контролери не має сенсу, оскільки експорт стосується тільки провайдерів.

## Експорт провайдерів з `rootModule`

Експорт провайдерів з кореневого модуля означає, що ці провайдери будуть автоматично додаватись до кожного модуля, що є в застосунку:

```ts {9}
import { rootModule } from '@ditsmod/core';

import { SomeService } from './some.service.js';
import { OtherModule } from './other.module.js';

@rootModule({
  imports: [OtherModule],
  providersPerRou: [SomeService],
  exports: [SomeService, OtherModule],
})
export class AppModule {}
```

В даному випадку, `SomeService` буде додаватись абсолютно до усіх модулів застосунку на рівні роуту. Як бачите, експортувати можна також і цілі модулі. В даному разі, усі провайдери, що експортуються з `OtherModule`, також будуть додаватись до кожного модуля застосунку.

## Імпорт модуля

Імпортувати окремий провайдер в модуль Ditsmod не можна, але можна імпортувати цілий модуль з усіма провайдерами та [розширеннями][2], що експортуються в ньому:

```ts {7}
import { featureModule } from '@ditsmod/core';

import { FirstModule } from './first.module.js';

@featureModule({
  imports: [
    FirstModule
  ]
})
export class SecondModule {}
```

Якщо у `FirstModule` експортується, наприклад, `SomeService`, то тепер цей сервіс можна використовувати у `SecondModule` у сервісах та контролерах. Разом з тим, якщо `FirstModule` має контролери, у такій формі імпорту вони будуть ігноруватись. Щоб Ditsmod брав до уваги контролери з імпортованого модуля, цей модуль потрібно імпортувати з префіксом, що передається у `path`:

```ts {4}
// ...
@featureModule({
  imports: [
    { path: '', module: FirstModule }
  ]
})
export class SecondModule {}
```

Хоча тут `path` має порожній рядок, але для Ditsmod наявність `path` означає:

1. що потрібно брати до уваги також і контролери з імпортованого модуля;
2. використовувати `path` у якості префіксу для усіх контролерів, що імпортуються з `FirstModule`.

Як бачите, у попередньому прикладі імпортується на цей раз і не провайдер, і не модуль, а об'єкт. Цей об'єкт має наступний інтерфейс:

<a id="ModuleWithParams"></a>

```ts
interface ModuleWithParams<M extends AnyObj = AnyObj, E extends AnyObj = AnyObj> {
  id?: string;
  module: ModuleType<M>;
  path?: string;
  guards?: GuardItem[];
  /**
   * List of modules, `ModuleWithParams` or tokens of providers exported by this
   * module.
   */
  exports?: any[];
  providersPerApp?: Provider[];
  providersPerMod?: Provider[];
  providersPerRou?: Provider[];
  providersPerReq?: Provider[];
  /**
   * This property allows you to pass any information to extensions.
   *
   * You must follow this rule: data for one extension - one key in `extensionsMeta` object.
   */
  extensionsMeta?: E;
}
```

Зверніть увагу, що в даному інтерфейсі обов'язковим є лише властивість `module`.

Щоб скоротити довжину запису при імпорті об'єкту з цим типом, інколи доцільно написати статичний метод у модулі, який імпортується. Щоб наочно побачити це, давайте візьмемо знову попередній приклад:

```ts {4}
// ...
@featureModule({
  imports: [
    { path: '', module: FirstModule }
  ]
})
export class SecondModule {}
```

Якщо б ви писали `FirstModule` і знали, що цей модуль є сенс імпортувати багато разів в різні модулі з різними префіксами, в такому разі в даному класі можна написати статичний метод, що повертає об'єкт, спеціально призначений для імпорту:

```ts
// ...
export class FirstModule {
  static withPrefix(path: string) {
    return {
      module: this,
      path
    }
  }
}
```

Тепер об'єкт, що повертає цей метод, можна імпортувати наступним чином:

```ts {4}
// ...
@featureModule({
  imports: [
    FirstModule.withPrefix('some-prefix')
  ]
})
export class SecondModule {}
```

В даному разі, скорочення запису майже не відбулось у порівнянні з попереднім прикладом, коли ми імпортували безпосередньо об'єкт, та ще й погіршилась читабельність. Тому коли пишете статичні методи для імпорту, зважуйте чи спрощують вони код.

Щоб TypeScript контролював, що саме повертає статичний метод для імпорту, рекомендується використовувати інтерфейс `ModuleWithParams`:

```ts
import { ModuleWithParams } from '@ditsmod/core';
// ...
export class SomeModule {
  static withParams(someParams: SomeParams): ModuleWithParams<SomeModule> {
    return {
      module: this,
      // ...
    }
  }
}
```

### Імпортуються класи чи інстанси класів?

Давайде розглянемо конкретну ситуацію. В наступному прикладі кожен із провайдерів є класом. Зверніть увагу, в які масиви передаються ці провайдери, і що саме експортується.

```ts
// ...
@featureModule({
  providersPerMod: [Provider1],
  providersPerRou: [Provider2],
  providersPerReq: [Provider3],
  exports: [Provider1, Provider2, Provider3],
})
export class Module1 {}
```

Припустимо ми цей модуль будемо імпортувати у `Module2`, в якого своїх провайдерів немає:

```ts
// ...
@featureModule({
  imports: [Module1]
  // ...
})
export class Module2 {}
```

В результаті такого імпорту, `Module2` тепер матиме три провайдери на тих самих рівнях, на яких вони були оголошені у `Module1`. Під час роботи з цими провайдерами, їхні інстанси будуть створюватись окремо в обох модулях. Між модулями може бути спільним [одинак][3], тільки якщо його провайдер оголошено на рівні застосунку. В нашому прикладі провайдери оголошені на рівні модуля, роута та запиту, тому у `Module1` та `Module2` інстанси класів не будуть спільними на жодному із рівнів.

Отже можна стверджувати, що імпортуються класи, а не їхні інстанси.

### Імпорт та інкапсуляція

Давайте розглянемо ситуацію, при якій з `Module1` експортується тільки `Provider3`, оскільки тільки цей провайдер використовується у зовнішніх модулях безпосередньо:

```ts
// ...
@featureModule({
  providersPerMod: [Provider1],
  providersPerRou: [Provider2],
  providersPerReq: [Provider3],
  exports: [Provider3],
})
export class Module1 {}
```

Припустимо, що `Provider3` має залежність від `Provider1` та `Provider2`. Як буде діяти Ditsmod при імпорті даного модуля в інші модулі? Ditsmod імпортуватиме усі три провайдери, оскільки `Provider3` зележить від двох інших провайдерів.

## Прикріплення модуля

Якщо вам не потрібно імпортувати провайдери та [розширення][2] в поточний модуль, а потрібно всього лиш прикріпити зовнішній модуль до префікса поточного модуля, можна скористатись масивом `appends`:

```ts {6}
import { featureModule } from '@ditsmod/core';

import { FirstModule } from './first.module.js';

@featureModule({
  appends: [FirstModule]
})
export class SecondModule {}
```

В даному випадку, якщо `SecondModule` має  префікс, він буде використовуватись у якості префіксу для усіх маршрутів, що є у `FirstModule`. Прикріплятись можуть лише ті модулі, що мають контролери. 

Також можна закріпити додатковий префікс за `FirstModule`:

```ts {3}
// ...
@featureModule({
  appends: [{ path: 'some-path', module: FirstModule }]
})
export class SecondModule {}
```

У даному прикладі був використаний об'єкт, в якому передається модуль для закріплення, він має наступний інтерфейс:

```ts
interface AppendsWithParams<T extends AnyObj = AnyObj> {
  id?: string;
  path: string;
  module: ModuleType<T>;
  guards?: GuardItem[];
}
```

## Реекспорт модуля

Окрім імпорту певного модуля, цей же модуль можна одночасно й експортувати:

```ts
import { featureModule } from '@ditsmod/core';

import { FirstModule } from './first.module.js';

@featureModule({
  imports: [FirstModule],
  exports: [FirstModule],
})
export class SecondModule {}
```

Який у цьому сенс? - Тепер, якщо ви зробите імпорт `SecondModule` у якийсь інший модуль, ви фактично матимете імпортованим ще й `FirstModule`.

Зверніть увагу! Якщо під час реекспорту ви імпортуєте об'єкт з інтерфейсом `ModuleWithParams`, цей же об'єкт потрібно й експортувати:

```ts
import { featureModule, ModuleWithParams } from '@ditsmod/core';

import { FirstModule } from './first.module.js';

const firstModuleWithParams: ModuleWithParams = { path: 'some-path', module: FirstModule };

@featureModule({
  imports: [firstModuleWithParams],
  exports: [firstModuleWithParams],
})
export class SecondModule {}
```


[1]: /components-of-ditsmod-app/dependency-injection#інжектор
[2]: /components-of-ditsmod-app/extensions
[3]: https://uk.wikipedia.org/wiki/%D0%9E%D0%B4%D0%B8%D0%BD%D0%B0%D0%BA_(%D1%88%D0%B0%D0%B1%D0%BB%D0%BE%D0%BD_%D0%BF%D1%80%D0%BE%D1%94%D0%BA%D1%82%D1%83%D0%B2%D0%B0%D0%BD%D0%BD%D1%8F) "Singleton"
[4]: /components-of-ditsmod-app/dependency-injection/#провайдери
[5]: /components-of-ditsmod-app/dependency-injection/#токен-залежності
