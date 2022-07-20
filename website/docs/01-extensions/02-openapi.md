---
sidebar_position: 2
---

# OpenAPI

Щоб створити маршрут за специфікацією `OpenAPI`, можна використовувати декоратор `OasRoute`, що імпортується з `@ditsmod/openapi`.

## Parameters

Для передачі параметрів, найпростіше скористатись функцією `getParams()`. В наступному прикладі описується необов'язковий параметр `page`, що міститься у `query`:

```ts
import { Controller } from '@ditsmod/core';
import { OasRoute, getParams } from '@ditsmod/openapi';

@Controller()
export class SomeController {
  // ...
  @OasRoute('GET', '', {
    parameters: getParams('query', false, 'page')
  })
  async getSome() {
    // ...
  }
}
```

В такому разі тип даних для параметра `page` є невизначеним, і щоб виправити це, потрібно вказати клас, що представляє собою модель даних:

```ts
import { Controller } from '@ditsmod/core';
import { OasRoute, getParams, Column } from '@ditsmod/openapi';

// Це модель параметрів
class Params {
  @Column({ minimum: 1, maximum: 100, description: 'Номер сторінки.' })
  page: number;
  @Column({ description: 'Інший параметр.' })
  otherParam: string;
}

// Це контролер, де використовується модель параметрів
@Controller()
export class SomeController {
  // ...
  @OasRoute('GET', '', {
    parameters: getParams('query', false, Params, 'page', 'otherParam')
  })
  async getSome() {
    // ...
  }
}
```

Таку модель достатньо мати одну на весь проект.

Якщо для автоматичної валідації необхідно передавати параметри до `OasRoute` через моделі даних, робиться це за допомогою константи `VALIDATION_ARGS`:

```ts
/**
 * This OAS property contains validation error arguments.
 */
export const VALIDATION_ARGS = 'x-validation-args';

export class Params {
  // ...
  @Column({
    minLength: config.sizeEmailToken * 2,
    maxLength: config.sizeEmailToken * 2,
    [VALIDATION_ARGS]: [new ServerMsg().invalidEmailToken],
  })
  // ...
}
```

Якщо назва параметра змінюється у моделі параметрів, TypeScript видає помилку в межах `OasRoute`. Щоправда таку помилку важко зрозуміти, але першим ділом перевірте наявність указаного параметра у моделі параметрів.

Функція `getParams()` не призначена щоб її використовували одночасно для обов'язкових та необов'язкових параметрів. Також через неї не можна передавати опис параметрів, який відрізняється від опису параметрів у моделі параметрів. Для таких цілей можна скористатись класом `Parameters`:

```ts
import { Controller } from '@ditsmod/core';
import { OasRoute, Parameters } from '@ditsmod/openapi';

import { Params } from '@models/params';

@Controller()
export class SomeController {
  // ...
  @OasRoute('GET', '', {
    parameters: new Parameters()
      .required('query', Params, 'otherParam').describe('Якийсь інший опис')
      .optional('query', Params, 'page')
      .getParams()
  })
  async getSome() {
    // ...
  }
}
```

## requestBody and responses content

Щоб описати контент запиту `requestBody` чи відповіді сервера `responses` по специфікації `OpenAPI`, можна скористатись функцією `getContent()`:

```ts
import { Controller, Status } from '@ditsmod/core';
import { OasRoute, getContent } from '@ditsmod/openapi';

class SomeModel {
  @Column()
  property1: number;
  @Column()
  property2: string;
}

@Controller()
export class SomeController {
  // ...
  @OasRoute('GET', '', {
    responses: {
      [Status.OK]: {
        description: 'Опис контенту із даним статусом',
        content: getContent({ mediaType: '*/*', model: SomeModel })
      },
    },
  })
  async getSome() {
    // ...
  }
}
```

Функція `getContent()` приймає скорочену версію даних, коли потрібно описати єдиний варіант `mediaType`. Якщо ж вам потрібно описати більшу кількість `mediaType`, можна скористатись класом `Content`:

```ts
import { Controller, Status } from '@ditsmod/core';
import { OasRoute, Content } from '@ditsmod/openapi';

import { SomeModel } from '@models/some';

@Controller()
export class SomeController {
  // ...
  @OasRoute('GET', '', {
    responses: {
      [Status.OK]: {
        description: 'Опис контенту із даним статусом',
        content: new Content()
          .set({ mediaType: 'application/xml', model: SomeModel })
          .set({ mediaType: 'application/json', model: SomeModel })
          .get()
      },
    },
  })
  async getSome() {
    // ...
  }
}
```

## OpenAPI опції на рівні модуля

Теги та параметри можна передавати на рівні модуля:

```ts
@Module({
  // ...
  extensionsMeta: {
    oasOptions: {
      tags: ['i18n'],
      paratemers: new Parameters()
                    .optional('query', Params, 'lcl').describe('Локалізація')
                    .getParams(),
    } as OasOptions,
  },
})
export class I18nModule {}
```