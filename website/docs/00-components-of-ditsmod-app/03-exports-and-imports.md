---
sidebar_position: 3
---

# Експорт, імпорт, прикріплення

## Експорт провайдерів з некореневого модуля

Експортуючи провайдери з певного модуля, ви тим самим декларуєте, що вони є доступними для використання в інших модулях, які імпортуватимуть цей модуль:

```ts {8}
import { featureModule } from '@ditsmod/core';

import { FirstService } from './first.service';
import { SecondService } from './second.service';

@featureModule({
  providersPerMod: [FirstService, SecondService],
  exports: [SecondService],
})
export class SomeModule {}
```

З конкретного модуля потрібно експортувати лише ті сервіси, які безпосередньо будуть використовуватись у зовнішніх модулях. В даному разі, `SecondService` може залежити від `FirstService`, але `FirstService` не потрібно експортувати, якщо він безпосередньо не використовується у зовнішньому модулі. Таким чином забезпечується інкапсуляція модулів.

Експортувати провайдери можна лише ті, що передаються в наступні масиви:

- `providersPerMod`;
- `providersPerRou`;
- `providersPerReq`.

Експортувати провайдери, що передаються в `providersPerApp`, не має сенсу, оскільки з цього масиву буде сформовано [інжектор][1] на рівні застосунку. Тобто провайдери з цього масиву будуть доступними для будь-якого модуля, на будь-якому рівні, і без експорту.

Також не має сенсу експортувати контролери, оскільки експорт стосується тільки провайдерів.

## Експорт провайдерів з кореневого модуля

Експорт провайдерів з кореневого модуля означає, що ці провайдери будуть автоматично додаватись до кожного модуля, що є в застосунку:

```ts {9}
import { rootModule } from '@ditsmod/core';

import { SomeService } from './some.service';
import { OtherModule } from './other.module';

@rootModule({
  imports: [OtherModule],
  providersPerRou: [SomeService],
  exports: [SomeService, OtherModule],
})
export class AppModule {}
```

В даному випадку, `SomeService` буде додаватись абсолютно до усіх модулів застосунку на рівні роуту. Як бачите, експортувати можна також і цілі модулі. В даному разі, усі провайдери, що експортуються з `OtherModule`, будуть додаватись до кожного модуля застосунку.

## Імпорт модуля

Імпортувати окремий провайдер в модуль Ditsmod не можна, але можна імпортувати цілий модуль з усіма провайдерами та [розширеннями][2], що експортуються в ньому:

```ts {7}
import { featureModule } from '@ditsmod/core';

import { FirstModule } from './first.module';

@featureModule({
  imports: [
    FirstModule
  ]
})
export class SecondModule {}
```

Якщо у `FirstModule` експортується, наприклад, `SomeService`, то тепер цей сервіс можна використовувати у `SecondModule` у будь-якому його сервісі чи контролері. Разом з тим, якщо `FirstModule` має контролери, у такій формі імпорту вони будуть ігноруватись. Щоб Ditsmod брав до уваги контролери з імпортованого модуля, цей модуль потрібно імпортувати з префіксом, що передається у `path`:

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

Як бачите, у попередньому прикладі імпортується на цей раз і не сервіс, і не модуль, а об'єкт. Цей об'єкт має наступний інтерфейс:

```ts
interface ModuleWithParams<M extends AnyObj = AnyObj, E extends AnyObj = AnyObj> {
  id?: string;
  module: ModuleType<M>;
  path?: string;
  guards?: GuardItem[];
  providersPerApp?: ServiceProvider[];
  providersPerMod?: ServiceProvider[];
  providersPerRou?: ServiceProvider[];
  providersPerReq?: ServiceProvider[];
  extensionsMeta?: E;
}
```

Зверніть увагу, що в даному інтерфейсі обов'язковим є лише властивість `module`.

Імпортуючи об'єкт з цим типом, можна передавати в скороченій формі модуль з певними опціями/параметрами. Щоб наочно побачити це, давайте візьмемо знову попередній приклад:

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

## Прикріплення модуля

Якщо вам не потрібно імпортувати провайдери та [розширення][2] в поточний модуль, а потрібно всього лиш прикріпити зовнішній модуль до префікса поточного модуля, можна скористатись масивом `appends`:

```ts {6}
import { featureModule } from '@ditsmod/core';

import { FirstModule } from './first.module';

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

import { FirstModule } from './first.module';

@featureModule({
  imports: [FirstModule],
  exports: [FirstModule],
})
export class SecondModule {}
```

Який у цьому сенс? - Тепер, якщо ви зробите імпорт `SecondModule` у якийсь інший модуль, ви фактично матимете імпортованим ще й `FirstModule`.


[1]: /components-of-ditsmod-app/dependency-injection#інжектор
[2]: /components-of-ditsmod-app/extensions
