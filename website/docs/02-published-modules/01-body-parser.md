---
sidebar_position: 1
title: Парсер тіла запиту
---

# @ditsmod/body-parser

Цей модуль додає інтерсептор для парсінгу тіла запиту до усіх роутів, що мають HTTP-методи вказані у `bodyParserConfig.acceptMethods`, по-дефолту це:

- `POST`
- `PUT`
- `PATCH`

Підтримуються наступні типи даних:

- `application/json`
- `application/x-www-form-urlencoded`
- `text/plain`
- `text/html`

Даний модуль не парсить тіло запиту при завантаженні файлів, для цього можете скористатись стороннім модулем [multiparty][2].

## Встановлення

```bash
yarn add @ditsmod/body-parser
```

## Підключення

Щоб глобально підключити `@ditsmod/body-parser`, потрібно імпортувати та експортувати `BodyParserModule` в кореневому модулі:

```ts
import { RootModule } from '@ditsmod/core';
import { BodyParserModule } from '@ditsmod/body-parser';

@RootModule({
  imports: [
    BodyParserModule,
    // ...
  ],
  exports: [BodyParserModule]
})
export class AppModule {}
```

В такому разі будуть працювати дефолтні налаштування. Якщо ж вам потрібно змінити деякі опції, можете це зробити наступним чином:

```ts
import { RootModule } from '@ditsmod/core';
import { BodyParserModule } from '@ditsmod/body-parser';

const moduleWithBodyParserConfig = BodyParserModule.withParams({ maxBodySize: 1024 * 1024 });

@RootModule({
  imports: [
    moduleWithBodyParserConfig,
    // ...
  ],
  exports: [moduleWithBodyParserConfig]
})
export class AppModule {}
```

Ще один варіант передачі конфігурації:

```ts
import { RootModule, Providers } from '@ditsmod/core';
import { BodyParserModule, BodyParserConfig } from '@ditsmod/body-parser';

@RootModule({
  imports: [
    BodyParserModule,
    // ...
  ],
  providersPerApp: [
    ...new Providers()
      .useValue<BodyParserConfig>(BodyParserConfig,  { maxBodySize: 1024*1024 })
  ],
  exports: [BodyParserModule]
})
export class AppModule {}
```

## Використання

Результат роботи інтерсептора можна отримати у `this.req.body`:

```ts
import { controller, Req, Res, Route } from '@ditsmod/core';

@controller()
export class SomeController {
  constructor(private req: Req, private res: Res) {}

  @Route('POST')
  ok() {
    this.res.sendJson(this.req.body);
  }
}
```



[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/06-body-parser
[2]: https://www.npmjs.com/package/@ts-stack/multiparty
