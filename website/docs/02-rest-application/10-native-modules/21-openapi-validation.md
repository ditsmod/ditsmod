---
sidebar_position: 21
---

# @ditsmod/openapi-validation

Щоб забезпечити автоматичну валідацію в застосунках Ditsmod на основі метаданих для OpenAPI, можна скористатись модулем `@ditsmod/openapi-validation`. Під капотом цей модуль має інтеграцію з бібліотекою [ajv][1], яка безпосередньо виконує щойно згадану валідацію.

На даний момент, автоматична валідація працює тільки для HTTP-запитів, що мають медіа-тип `application/json` і не посилаються на [Reference Object][3]. Автоматична валідація працює для параметрів у:
- path
- query
- cookie
- header
- тілі запиту.

## Встановлення {#installation}

Після того, як ви створите [OpenAPI-документацію][2], необхідно доставити два модулі для автоматичної валідації на її основі:

```bash
npm i @ditsmod/openapi-validation @ditsmod/i18n
```

## Підключення валідації та встановлення опцій {#enable-validation-and-set-options}

Щоб підключити автоматичну валідацію у певному модулі, достатньо імпортувати туди `ValidationModule`. Також ви можете передати `ValidationOptions` та `AJV_OPTIONS`:

```ts
import { Providers, Status } from '@ditsmod/core';
import { restModule } from '@ditsmod/rest';
import { ValidationModule, ValidationOptions, AJV_OPTIONS } from '@ditsmod/openapi-validation';
import { Options } from 'ajv';

@restModule({
  imports: [ValidationModule],
  providersPerApp: new Providers()
    .useValue<ValidationOptions>(ValidationOptions, { invalidStatus: Status.UNPROCESSABLE_ENTRY })
    .useValue<Options>(AJV_OPTIONS, { allErrors: true }),
  // ...
})
export class SomeModule {}
```

## Підміна інтерсепторів валідації {#substituting-of-validation-interceptors}

Класи `ParametersInterceptor` та `RequestBodyInterceptor` відповідають за валідацію параметрів запиту та тіла запиту. Їх можна підмінити в масиві `providersPerReq` на рівні модуля чи контролера:

```ts
import { restModule } from '@ditsmod/rest';
import { ParametersInterceptor } from '@ditsmod/openapi-validation';

import { MyInterceptor } from './my.interceptor.js';

@restModule({
  // ...
  providersPerReq: [
    { token: ParametersInterceptor, useClass: MyInterceptor }
  ]
  // ...
})
export class SomeModule {}
```

Перед написанням свого інтерсептора для валідації, можете спочатку проглянути як написано, наприклад, [ParametersInterceptor][4].


[1]: https://ajv.js.org/guide/getting-started.html
[2]: /rest-application/native-modules/openapi
[3]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#referenceObject
[4]: https://github.com/ditsmod/ditsmod/blob/main/packages/openapi-validation/src/parameters.interceptor.ts
