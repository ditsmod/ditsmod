---
sidebar_position: 5
---

# Експорт та імпорт

## Експорт провайдерів із некореневого модуля

Експортуючи провайдери з певного модуля, ви тим самим декларуєте, що вони є доступними для використання в інших модулях, які імпортуватимуть цей модуль:

```ts
import { Module } from '@ditsmod/core';

import { SomeService } from './some.service';

@Module({
  providersPerMod: [SomeService],
  exports: [SomeService],
})
export class SomeModule {}
```

Зверніть увагу, що відбувається не лише додавання `SomeService` в масив `exports`, одночасно цей провайдер передається на рівні `providersPerMod`. При експорті, _передача_ провайдера до інжектора на певному рівні є обов'язковою.

Експортувати провайдери можна лише ті, що передаються:

1. або на рівні модуля (тобто в масиві `providersPerMod`);
2. або на рівні роута (тобто в масиві `providersPerRou`);
3. або на рівні HTTP-запиту (тобто в масиві `providersPerReq`).

Експортувати провайдери, що передається на рівні застосунку (тобто в масиві `providersPerApp`) не має сенсу, оскільки _передача_ їх на рівні застосунку вже має на увазі _експорт_ їх на цьому рівні.

Також не має сенсу експортувати контролери, оскільки експорт стосується тільки провайдерів.

## Експорт провайдерів із кореневого модуля

Експорт провайдерів із кореневого модуля означає, що ці провайдери стають доступними для будь-якого сервіса чи контролера у всьому застосунку, причому їхній рівень передачі зберігається:

```ts
import { RootModule } from '@ditsmod/core';

import { SomeService } from './some.service';
import { OtherModule } from './other.module';

@RootModule({
  imports: [OtherModule],
  providersPerMod: [SomeService],
  exports: [SomeService, OtherModule],
})
export class AppModule {}
```

Як бачите, окрім експорту окремих провайдерів, що передаються в інжектори кореневого модуля, можна також експортувати цілі модулі.

## Імпорт модуля

Імпортувати окремий провайдер в модуль Ditsmod не можна, але можна імпортувати цілий модуль із усіма провайдерами, що експортуються в ньому:

```ts
import { Module } from '@ditsmod/core';

import { FirstModule } from './first.module';

@Module({
  imports: [
    FirstModule
  ]
})
export class ThridModule {}
```

Якщо у `FirstModule` експортується, наприклад, `SomeService`, то тепер цей сервіс можна використовувати у `ThridModule` у будь-якому його сервісі чи контролері.

Зверніть увагу, що при імпорті рівень передачі провайдера залишається таким самим, яким він був при експорті. Наприклад, якщо `SomeService` було передано на рівні модуля, то і при імпорті залишиться цей же рівень.

Разом із тим, якщо `FirstModule` має контролери, у такій формі імпорту вони будуть ігноруватись. Щоб Ditsmod брав до уваги контролери з імпортованого модуля, потрібно використовувати об'єкт, що має інтерфейс `ModuleWithParams`:

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

Такий інтерфейс дозволяє передавати окрім самого модуля, ще й певні аргументи для перерахованих параметрів:

```ts
import { Module } from '@ditsmod/core';

import { FirstModule } from './first.module';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [
    { path: '', guards: [AuthGuard], module: FirstModule }
  ]
})
export class ThridModule {}
```

Хоча тут `path` має порожній рядок, але для Ditsmod наявність `path` означає:

1. що потрібно брати до уваги також і контролери з імпортованого модуля;
2. використовувати `path` у якості префіксу для усіх контролерів, що імпортуються з `FirstModule`.

Також ви повинні мати на увазі, що для інжекторів поточного модуля не забороняється передавати провайдери, які знаходяться у зовнішньому модулі, але це не рекомендується робити. Якщо вам потрібен провайдер із зовнішнього модуля, імпортуйте даний модуль повністю.

І якщо ви хочете використовувати провайдер, що не експортується із зовнішнього модуля, то це також не рекомендується робити, оскільки ви будете опиратись на непублічний API, що може змінитись у будь-який момент без попередження.

## Реекспорт модуля

Окрім імпорту певного модуля, цей же модуль можна одночасно й експортувати:

```ts
import { Module } from '@ditsmod/core';

import { FirstModule } from './first.module';

@Module({
  imports: [FirstModule],
  exports: [FirstModule],
})
export class SecondModule {}
```

Який у цьому сенс? - Тепер, якщо ви зробите імпорт `SecondModule` у якийсь інший модуль, ви фактично матимете імпортованим ще й `FirstModule`.


[121]: ./providers-collisions