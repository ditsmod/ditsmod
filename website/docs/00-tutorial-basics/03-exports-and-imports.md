---
sidebar_position: 3
---

# Експорт та імпорт

## Експорт провайдерів із некореневого модуля

Експортуючи провайдери з певного модуля, ви тим самим декларуєте, що вони є доступними для
використання в інших модулях, які імпортуватимуть цей модуль:

```ts
import { Module } from '@ditsmod/core';

import { SomeService } from './some.service';

@Module({
  providersPerMod: [SomeService],
  exports: [SomeService],
})
export class SomeModule {}
```

Зверніть увагу, що відбувається не лише додавання `SomeService` в масив `exports`, одночасно цей
провайдер оголошується на рівні `providersPerMod`. При експорті, _оголошення_ провайдера на
певному рівні є обов'язковим.

Експортувати провайдери можна лише ті, що оголошені:

1. або на рівні модуля (тобто в масиві `providersPerMod`);
2. або на рівні роута (тобто в масиві `providersPerRou`);
3. або на рівні HTTP-запиту (тобто в масиві `providersPerReq`).

Експортувати провайдери, що оголошені на рівні застосунку (тобто в масиві `providersPerApp`)
не має сенсу, оскільки _оголошення_ їх на рівні застосунку вже має на увазі _експорт_ їх
на цьому рівні.

Також не має сенсу експортувати контролери, оскільки експорт стосується виключно провайдерів.

## Експорт провайдерів із кореневого модуля

Експорт провайдерів із кореневого модуля означає, що ці провайдери стають доступними для
будь-якого сервіса чи контролера у всьому застосунку, причому їхній рівень оголошення зберігається:

```ts
import { RootModule } from '@ditsmod/core';

import { SomeService } from './some.service';

@RootModule({
  providersPerMod: [SomeService],
  exports: [SomeService],
})
export class AppModule {}
```

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

Який у цьому сенс? - Тепер, якщо ви зробите імпорт `SecondModule` у якийсь інший модуль, ви
фактично матимете імпортованим ще й `FirstModule`.

## Імпорт модуля

Імпортувати окремий провайдер в модуль Ditsmod не можна, але можна імпортувати цілий модуль
із усіма провайдерами, що експортуються в ньому:

```ts
import { Module } from '@ditsmod/core';

import { FirstModule } from './first.module';
import { SecondModule } from './second.module';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [
    FirstModule,
    { prefix: 'some-prefix', guards: [AuthGuard], module: SecondModule }
  ]
})
export class ThridModule {}
```

Якщо у `FirstModule` експортується, наприклад, `SomeService`, то тепер цей сервіс можна
використовувати у `ThridModule` у будь-якому його сервісі чи контролері.

Зверніть увагу, що при імпорті рівень оголошення провайдера залишається таким самим, яким він
був при експорті. Наприклад, якщо `SomeService` було оголошено на рівні модуля, то і при імпорті
залишиться цей же рівень.

Як бачите, масив `imports` приймає окрім класів модулів, ще й об'єкт, він має наступний інтерфейс:

```ts
interface ModuleWithParams<M extends AnyObj = AnyObj, E extends AnyObj = AnyObj> {
  id?: string;
  module: ModuleType<M>;
  prefix?: string;
  guards?: GuardItem[];
  providersPerApp?: ServiceProvider[];
  providersPerMod?: ServiceProvider[];
  providersPerRou?: ServiceProvider[];
  providersPerReq?: ServiceProvider[];
  extensionsMeta?: E;
}
```

Такий об'єкт дозволяє передавати окрім самого модуля, ще й певні аргументи для перерахованих
параметрів.

Також ви повинні мати на увазі, що у поточному модулі не забороняється повторно оголошувати рівень провайдера,
що написаний і вже оголошений у зовнішньому модулі. Але це рекомендується робити, тільки якщо ви
вирішуєте [колізію експортованих провайдерів][121]. Якщо вам потрібен провайдер
із зовнішнього модуля, імпортуйте цей зовнішній модуль повністю.

І якщо ви хочете використовувати провайдер, що не експортується із зовнішнього модуля, то це
також не рекомендується робити, оскільки ви будете опиратись на непублічний API, що може змінитись
у будь-який момент без попередження.


[121]: ./providers-collisions