---
sidebar_position: 2
title: OpenAPI-валідація
---

# @ditsmod/openapi-validation

Щоб забезпечити автоматичну валідацію в застосунках Ditsmod на основі метаданих для OpenAPI, можна скористатись модулем `@ditsmod/openapi-validation`. Під капотом цей модуль має інтеграцію з бібліотекою [ajv][1], яка безпосередньо виконує щойно згадану валідацію.

На даний момент, автоматична валідація відбувається тільки для HTTP-запитів, що мають медіа-тип `application/json`.

## Встановлення

Після того, як ви створите [OpenAPI-документацію][2], необхідно доставити два модулі для автоматичної валідації на її основі:

```bash
yarn add @ditsmod/openapi-validation @ditsmod/i18n
```

## Підключення валідації та встановлення опцій

Щоб підключити автоматичну валідацію у певному модулі, достатньо імпортувати туди `ValidationModule`. Також ви можете передати `ValidationOptions` та `AJV_OPTIONS`:

```ts
import { Module, Providers, Status } from '@ditsmod/core';
import { ValidationModule, ValidationOptions, AJV_OPTIONS } from '@ditsmod/openapi-validation';
import { Options } from 'ajv';

@Module({
  imports: [ValidationModule],
  providersPerApp: [
    ...new Providers()
      .useValue(ValidationOptions, { invalidStatus: Status.UNPROCESSABLE_ENTRY })
      .useValue<Options>(AJV_OPTIONS, { allErrors: true })
  ]
  // ...
})
export class SomeModule {}
```


[1]: https://ajv.js.org/guide/getting-started.html
[2]: ./01-openapi.md
