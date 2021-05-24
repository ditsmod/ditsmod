---
sidebar_position: 0
---

# Модулі

## Некореневий модуль Ditsmod

Якщо говорити дуже узагальнено, модуль повинен об'єднувати у собі набір класів, що мають вузьку
спеціалізацію. Добре оформлений модуль не повинен бути "універсальним комбайном".

Наприклад, модуль системи безпеки має вузьку спеціалізацію - безпека доступу та безпека управління
застосунком. Тут не повинні оголошуватись класи, наприклад, що перекладають
повідомлення різними мовами, що відправляють пошту, що пишуть логи і т.п.

Коли конкретний модуль прив'язаний до певного URL - це теж хороша практика, і це теж можна вважати
"вузькою спеціалізацією". Наприклад, один модуль може обробляти усі HTTP-запити за адресою
`/api/users`, інший модуль - за адресою `/api/posts`.

TypeScript клас стає модулем Ditsmod завдяки декоратору `Module`:

```ts
import { Module } from '@ditsmod/core';

@Module()
export class SomeModule {}
```

Загалом, в декоратор `Module` можна передавати об'єкт із такими властивостями:

```ts
import { Module } from '@ditsmod/core';

@Module({
  imports: [], // Імпорт модулів
  controllers: [],
  providersPerApp: [], // Провайдери на рівні застосунку
  providersPerMod: [], // Провайдери на рівні модуля
  providersPerRou: [], // Провайдери на рівні роуту
  providersPerReq: [], // Провайдери на рівні запиту
  exports: [], // Експорт модулів та провайдерів із поточного модуля
  extensions: [], // Розширення
  extensionsMeta: {} // Дані для роботи розширень
})
export class SomeModule {}
```

## Кореневий модуль Ditsmod

До кореневого модуля підв'язуються інші модулі, він є єдиним на увесь застосунок, а його клас
рекомендовано називати `AppModule`. TypeScript клас стає кореневим модулем Ditsmod
завдяки декоратору `RootModule`:

```ts
import { RootModule } from '@ditsmod/core';

@RootModule()
export class AppModule {}
```

Він може містити інформацію як для HTTP-сервера так і для самого модуля.
Загалом, в декоратор `RootModule` можна передавати об'єкт із такими властивостями:

```ts
import * as http from 'http';
import { RootModule } from '@ditsmod/core';

@RootModule({
  // Дані для HTTP-сервера
  httpModule: http,
  listenOptions: { host: 'localhost', port: 8080 },
  serverName: 'Node.js',
  serverOptions: {},

  // Дані для модуля, плюс - префікс, що додаватиметься до усіх маршрутів
  prefixPerApp: 'api',
  imports: [],
  controllers: [],
  providersPerApp: [],
  providersPerMod: [],
  providersPerRou: [],
  providersPerReq: [],
  exports: [],
  extensions: []
})
export class AppModule {}
```

## Префікси маршрутів

Якщо некореневий модуль імпортувати з префіксом, даний префікс буде додаватись до усіх маршрутів
(роутів), в межах цього модуля:

```ts
import { Module } from '@ditsmod/core';

import { FirstModule } from './first.module';
import { SecondModule } from './second.module';

@Module({
  imports: [
    { prefix: 'some-prefix', module: FirstModule }
    { prefix: 'other-prefix/:pathParam', module: SecondModule }
  ]
})
export class ThridModule {}
```

Тут під записом `:pathParam` мається на увазі не просто текст, а саме параметр - змінна частина
в URL перед query параметрами.

Якщо ж в кореневому модулі указати `prefixPerApp`, цей префікс буде додаватись до усіх маршрутів
в усьому застосунку:

```ts
import { RootModule } from '@ditsmod/core';

import { SomeModule } from './some.module';

@RootModule({
  prefixPerApp: 'api',
  imports: [SomeModule]
})
export class AppModule {}
```

Для повноцінної роботи, щоб можна було обробляти певні URL маршрути, потрібні контролери.

