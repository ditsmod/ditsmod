---
sidebar_position: 1
title: OpenAPI-документація
---

# @ditsmod/openapi

Щоб створити документацію за специфікацією [OpenAPI][0], можна використовувати модуль `@ditsmod/openapi`.

## Встановлення

```bash
yarn add @ditsmod/openapi
```

## Створення документації

Щоб створювати окремі маршрути, користуйтесь декоратором `OasRoute`, в якому четвертим або третім параметром (якщо немає ґардів) йде так званий [Operation Object][1]:

```ts
import { Controller } from '@ditsmod/core';
import { OasRoute } from '@ditsmod/openapi';

@Controller()
export class SomeController {
  // ...
  @OasRoute('GET', 'users/:username', {
    parameters: [
      {
        name: 'username',
        in: 'path',
        required: true,
        description: 'Username of the profile to get',
        schema: {
          type: 'string',
        },
      },
    ],
  })
  async getSome() {
    // ...
  }
}
```

Ditsmod має хорошу підтримку TypeScript-моделей для OpenAPI v3.1.0, зокрема й Operation Object, але вручну прописувати весь Operation Object прямо в коді до кожного роуту - не обов'язково. Краще скористатись хелперами, які за вас згенерують необхідний код, та ще й зменшать кількість помилок за рахунок ще кращої пітримки TypeScript. Ditsmod має декілька таких хелперів: `getParams()`, `getContent()`, `Parameters`, `Content`. Усі вони імпортуються з модуля `@ditsmod/openapi`.

## Передача параметрів Operation Object

В наступному прикладі за допомогою хелпера `getParams()` записано майже усе те, що у попередньому прикладі ми прописали вручну для `parameters`:

```ts
import { Controller } from '@ditsmod/core';
import { OasRoute, getParams } from '@ditsmod/openapi';

@Controller()
export class SomeController {
  // ...
  @OasRoute('GET', 'users/:username', {
    parameters: getParams('path', true, 'username'),
  })
  async getSome() {
    // ...
  }
}
```

Тут не вистачає ще вказання типу даних для параметра `username` та його опису. Рекомендуємо використовувати TypeScript-клас у якості моделі, щоб потім можна було на нього посилатись за допомогою хелперів, які вміють читати його метадані і повертати готові JSON-об'єкти.

## Створення TypeScript-моделей

В наступному прикладі показано модель з трьома параметрами:

```ts
import { Property } from '@ditsmod/openapi';

class Params {
  @Property({ description: 'Username of the profile to get.' })
  username: string;

  @Property({ minimum: 1, maximum: 100, description: 'Page number.' })
  page: number;

  @Property()
  hasName: boolean;
}
```

Як бачите, щоб закріпити метадані за моделлю, використовується декоратор `@Property()`, куди ви можете передавати першим аргументом [Schema Object][3].

Зверніть увагу, що в даному разі властивість `type` не прописується у метаданих, оскільки указані тут типи автоматично читаються хелперами. Щоправда не усі наявні у TypeScript типи можуть читатись. Наприклад, хелпери не зможуть автоматично побачити який тип масиву ви передаєте. Це саме стосується `enum`. Також хелпери не бачать чи є властивість об'єкта опціональною чи ні.

Тип масиву чи `enum` можна передати другим параметром в декоратор `@Property()`:

```ts
import { Property } from '@ditsmod/openapi';

enum NumberEnum {
  one,
  two,
  three,
}

class Params {
  @Property({}, { enum: NumberEnum })
  property1: NumberEnum;

  @Property({}, { array: String })
  property2: string[];

  @Property({}, { array: [String, Number] })
  property3: (string | number)[];

  @Property({}, { array: [[String]] }) // Масив в масиві
  property4: string[][];
}
```

Посилання одних моделей на інші теж досить добре читаються. В наступному прикладі `Model2` має посилання на `Model1`:

```ts
import { Property } from '@ditsmod/openapi';

export class Model1 {
  @Property()
  property1: string;
}

export class Model2 {
  @Property()
  model1: Model1;

  @Property({}, Model1)
  arrModel1: Model1[];
}
```

## Використання TypeScript-моделей

Хелпер `getParams()` дозволяє використовувати моделі, і якщо ви зробите помилку у назві параметра, TypeScript скаже вам про це:

```ts
import { Controller } from '@ditsmod/core';
import { OasRoute, getParams } from '@ditsmod/openapi';

import { Params } from './params';

@Controller()
export class SomeController {
  // ...
  @OasRoute('GET', '', {
    parameters: getParams('path', true, Params, 'username'),
  })
  async getSome() {
    // ...
  }
}
```

Але хелпер `getParams()` не призначений щоб його використовували одночасно для обов'язкових та необов'язкових параметрів. Також через нього не можна передавати опис параметрів, який відрізняється від опису параметрів у моделі параметрів. Для таких цілей можна скористатись іншим хелпером - `Parameters`:

```ts
import { Controller } from '@ditsmod/core';
import { OasRoute, Parameters } from '@ditsmod/openapi';

import { Params } from './params';

@Controller()
export class SomeController {
  // ...
  @OasRoute('GET', '', {
    parameters: new Parameters()
      .required('path', Params, 'username')
      .optional('query', Params, 'page', 'hasName')
      .getParams(),
  })
  async getSome() {
    // ...
  }
}
```

### requestBody та responses content

Моделі даних також використовуються щоб описати контент `requestBody`, але тут є одна невелика відмінність. По дефолту, усі властивості моделі є необов'язковими, і щоб позначити певну властивість обов'язковою, необхідно скористатись константою `REQUIRED`:

```ts
import { Property, REQUIRED } from '@ditsmod/openapi';

class Model1 {
  @Property()
  property1: string;
  @Property({ [REQUIRED]: true })
  property2: number;
}
```

Якщо дана модель буде використовуватись для опису `requestBody`, то `property2` в ній буде обов'язковою. Але якщо цю модель використовувати для опису параметрів, маркер `REQUIRED` буде ігноруватись:

```ts
class SomeController {
  // ...
  @OasRoute('GET', 'users', {
    parameters: getParams('query', false, Model1, 'property2'),
  })
  async getSome() {
    // ...
  }
}
```

Для опису контента в `requestBody` та `responses` існує також хелпер `getContent()`:

```ts
import { Controller, Status } from '@ditsmod/core';
import { OasRoute, getContent } from '@ditsmod/openapi';

import { SomeModel } from './some-model';

@Controller()
export class SomeController {
  // ...
  @OasRoute('GET', '', {
    requestBody: {
      description: 'All properties are taken from Model1.',
      content: getContent({ mediaType: 'application/json', model: Model1 }),
    },
  })
  async getSome() {
    // ...
  }
}
```

Хелпер `getContent()` приймає скорочену версію даних, коли потрібно описати єдиний варіант `mediaType`. Якщо ж вам потрібно описати більшу кількість `mediaType`, можна скористатись класом `Content`:

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
          .get(),
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
import { OasOptions } from '@ditsmod/openapi';

@Module({
  // ...
  extensionsMeta: {
    oasOptions: {
      tags: ['i18n'],
      paratemers: new Parameters()
        .optional('query', Params, 'lcl')
        .describe('Internalization')
        .getParams(),
    } as OasOptions,
  },
})
export class I18nModule {}
```

## Хелпери, що повертають цілий Operation Object

У попередніх прикладах були показані хелпери, що повертають частини [Operation Object][2], але, звичайно ж, ви можете створити власні хелпери, які повертають цілі Operation Object. Один із прикладів використання таких хелперів показаний в репозиторії [RealWorld][4].

## Спеціальний декоратор для ґардів

Модуль `@ditsmod/openapi` має спеціальний декоратор `OasGuard`, що дозволяє закріпити метадані OpenAPI за ґардами:

```ts
import { CanActivate } from '@ditsmod/core';
import { OasGuard } from '@ditsmod/openapi';

@OasGuard({
  tags: ['withBasicAuth'],
  securitySchemeObject: {
    type: 'http',
    scheme: 'basic',
    description:
      'Enter username: `demo`, password: `p@55w0rd`. For more info see ' +
      '[Authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication)',
  },
  responses: {
    [Status.UNAUTHORIZED]: {
      $ref: '#/components/responses/UnauthorizedError',
    },
  },
})
export class BasicGuard implements CanActivate {
  // ...
}
```

На даний момент декоратор `OasGuard` приймає наступний тип даних:

```ts
interface OasGuardMetadata {
  securitySchemeObject: XSecuritySchemeObject;
  responses?: XResponsesObject;
  tags?: string[];
}
```

Де `securitySchemeObject` має тип [Security Scheme Object][5], а `responses` - [Responses Object][6].

Використовуються такі ґарди точно так само, як і "звичайні" ґарди:

```ts
import { Controller } from '@ditsmod/core';
import { OasRoute } from '@ditsmod/openapi';

@Controller()
export class SomeController {
  // ...
  @OasRoute('GET', 'users/:username', [BasicGuard])
  async getSome() {
    // ...
  }
}
```





[0]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md
[1]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#operationObject
[2]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#referenceObject
[3]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#schemaObject
[4]: https://github.com/ditsmod/realworld/blob/e8947f8767/packages/server/src/app/modules/routed/profiles/profiles.controller.ts#L24-L30
[5]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#securitySchemeObject
[6]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#responsesObject
