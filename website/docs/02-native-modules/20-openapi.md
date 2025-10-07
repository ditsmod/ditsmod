---
sidebar_position: 20
---

# @ditsmod/openapi

Щоб створити документацію за специфікацією [OpenAPI][0], можна використовувати модуль `@ditsmod/openapi`.

## Встановлення та підключення {#installation-and-setup}

```bash
npm i @ditsmod/openapi
```

Щоб підключити `OpenapiModule` з дефолтними налаштуваннями, достатньо імпортувати його у будь-який модуль:

```ts {5}
import { featureModule } from '@ditsmod/core';
import { OpenapiModule } from '@ditsmod/openapi';

@featureModule({
  imports: [{ absolutePath: '', module: OpenapiModule }],
  // ...
})
export class SomeModule {}
```

В такому разі, документація буде створюватись з усього застосунку за URL-адресою, яка буде залежати від path-префікса на рівні застосунку. Наприклад, якщо path-префікс на рівні застосунку буде `/api`, значить OpenAPI-документація буде за адресою `/api/openapi`.

Також можна використовувати статичний метод `OpenapiModule.withParams` щоб вказати додаткові параметри для імпорту `OpenapiModule`:

```ts {11,14}
import { featureModule } from '@ditsmod/core';
import { OpenapiModule, SwaggerOAuthOptions } from '@ditsmod/openapi';
import { oasObject } from './oas-object.js';

const swaggerOAuthOptions: SwaggerOAuthOptions = {
  appName: 'Swagger UI Demo',
  // See https://demo.duendesoftware.com/ for configuration details.
  clientId: 'implicit',
};

const moduleWithParams = OpenapiModule.withParams(oasObject, 'absolute-path', swaggerOAuthOptions);

@featureModule({
  imports: [moduleWithParams],
  // ...
})
export class SomeModule {}
```

Де `oasObject` - це кореневий документ OpenAPI-документації, в якому можна указати деякі загальні метадані:

```ts
import { XOasObject, openapi } from '@ts-stack/openapi-spec';

export const oasObject: XOasObject = {
  openapi,
  info: { title: 'Testing @ditsmod/openapi', version: '1.0.0' },
  tags: [
    {
      name: 'NonOasRoutes',
      description:
        'Routes that used `@route()` decorator. If you want to change this description, ' +
        '[use tags](https://swagger.io/docs/specification/grouping-operations-with-tags/) ' +
        'for `@oasRoute()` imported from @ditsmod/openapi.',
    },
    {
      name: 'withParameter',
      description: 'Parameter in path.',
    },
    {
      name: 'withBasicAuth',
      description: 'Here you need username and password.',
    },
  ],
  components: {
    responses: {
      UnauthorizedError: {
        description: 'Authentication information is missing or invalid',
        headers: {
          WWW_Authenticate: {
            schema: { type: 'string' },
            description:
              'Taken from [swagger.io](https://swagger.io/docs/specification/authentication/basic-authentication/)',
          },
        },
      },
    },
  },
};
```

## Створення документації {#creation-of-documentation}

Щоб створювати окремі маршрути, користуйтесь декоратором `oasRoute`, в якому четвертим або третім параметром (якщо немає ґардів) йде так званий [Operation Object][1]:

```ts {8-18}
import { controller } from '@ditsmod/core';
import { oasRoute } from '@ditsmod/openapi';

@controller()
export class SomeController {
  // ...
  @oasRoute('GET', 'users/:username', {
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

## Передача параметрів Operation Object {#passing-operation-object-parameters}

В наступному прикладі за допомогою хелпера `getParams()` записано майже усе те, що у попередньому прикладі ми прописали вручну для `parameters`:

```ts {8}
import { controller } from '@ditsmod/core';
import { oasRoute, getParams } from '@ditsmod/openapi';

@controller()
export class SomeController {
  // ...
  @oasRoute('GET', 'users/:username', {
    parameters: getParams('path', true, 'username'),
  })
  async getSome() {
    // ...
  }
}
```

Тут не вистачає ще вказання типу даних для параметра `username` та його опису. Рекомендуємо використовувати TypeScript-клас у якості моделі, щоб потім можна було на нього посилатись за допомогою хелперів, які вміють читати його метадані і повертати готові JSON-об'єкти.

## Створення TypeScript-моделей {#creation-of-typescript-models}

В наступному прикладі показано модель з трьома параметрами:

```ts
import { property } from '@ditsmod/openapi';

class Params {
  @property({ description: 'Username of the profile to get.' })
  username: string;

  @property({ minimum: 1, maximum: 100, description: 'Page number.' })
  page: number;

  @property()
  hasName: boolean;
}
```

Як бачите, щоб закріпити метадані за моделлю, використовується декоратор `@property()`, куди ви можете передавати першим аргументом [Schema Object][3].

Зверніть увагу, що в даному разі властивість `type` не прописується у метаданих, оскільки указані тут типи автоматично читаються хелперами. Щоправда не усі наявні у TypeScript типи можуть читатись. Наприклад, хелпери не зможуть автоматично побачити який тип масиву ви передаєте. Це саме стосується `enum`. Також хелпери не бачать чи є властивість об'єкта опціональною чи ні.

Тип масиву чи `enum` можна передати другим параметром в декоратор `@property()`:

```ts
import { property } from '@ditsmod/openapi';

enum NumberEnum {
  one,
  two,
  three,
}

class Params {
  @property({}, { enum: NumberEnum })
  property1: NumberEnum;

  @property({}, { array: String })
  property2: string[];

  @property({}, { array: [String, Number] })
  property3: (string | number)[];

  @property({}, { array: [[String]] }) // Масив в масиві
  property4: string[][];
}
```

Посилання одних моделей на інші добре читаються. В наступному прикладі `Model2` має посилання на `Model1`:

```ts
import { property } from '@ditsmod/openapi';

export class Model1 {
  @property()
  property1: string;
}

export class Model2 {
  @property()
  model1: Model1;

  @property({}, { array: Model1 })
  arrModel1: Model1[];
}
```

## Використання TypeScript-моделей {#using-typescript-models}

Хелпер `getParams()` дозволяє використовувати моделі, і якщо ви зробите помилку у назві параметра, TypeScript скаже вам про це:

```ts {10}
import { controller } from '@ditsmod/core';
import { oasRoute, getParams } from '@ditsmod/openapi';

import { Params } from './params.js';

@controller()
export class SomeController {
  // ...
  @oasRoute('GET', '', {
    parameters: getParams('path', true, Params, 'username'),
  })
  async getSome() {
    // ...
  }
}
```

Тут `Params` - це клас, який використовується у якості моделі параметрів.

Але хелпер `getParams()` не призначений щоб його використовували одночасно для обов'язкових та необов'язкових параметрів. Також через нього не можна передавати опис параметрів, який відрізняється від опису параметрів у моделі параметрів. Для таких цілей можна скористатись іншим хелпером - `Parameters`:

```ts {10-13}
import { controller } from '@ditsmod/core';
import { oasRoute, Parameters } from '@ditsmod/openapi';

import { Params } from './params.js';

@controller()
export class SomeController {
  // ...
  @oasRoute('GET', '', {
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

### requestBody та responses content {#requestbody-and-responses-content}

Моделі даних також використовуються щоб описати контент `requestBody`, але тут є одна невелика відмінність у порівнянні з параметрами. По дефолту, усі властивості моделі є необов'язковими, і щоб позначити певну властивість обов'язковою, необхідно скористатись константою `REQUIRED`:

```ts
import { property, REQUIRED } from '@ditsmod/openapi';

class Model1 {
  @property()
  property1: string;
  @property({ [REQUIRED]: true })
  property2: number;
}
```

Якщо дана модель буде використовуватись для опису `requestBody`, то `property2` в ній буде обов'язковою. Але якщо цю модель використовувати для опису параметрів, маркер `REQUIRED` буде ігноруватись:

```ts {4}
class SomeController {
  // ...
  @oasRoute('GET', 'users', {
    parameters: getParams('query', false, Model1, 'property2'),
  })
  async getSome() {
    // ...
  }
}
```

Для опису контента в `requestBody` та `responses` існує також хелпер `getContent()`:

```ts {12}
import { controller, Status } from '@ditsmod/core';
import { oasRoute, getContent } from '@ditsmod/openapi';

import { SomeModel } from '#models/some.js';

@controller()
export class SomeController {
  // ...
  @oasRoute('POST', '', {
    requestBody: {
      description: 'All properties are taken from Model1.',
      content: getContent({ mediaType: 'application/json', model: Model1 }),
    },
  })
  async postSome() {
    // ...
  }
}
```

Хелпер `getContent()` приймає скорочену версію даних, коли потрібно описати єдиний варіант `mediaType`. Якщо ж вам потрібно описати більшу кількість `mediaType`, можна скористатись класом `Content`:

```ts {10-18}
import { controller, Status } from '@ditsmod/core';
import { oasRoute, Content } from '@ditsmod/openapi';

import { SomeModel } from '#models/some.js';

@controller()
export class SomeController {
  // ...
  @oasRoute('GET', '', {
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

## OpenAPI опції на рівні модуля {#openapi-module-level-options}

Теги та параметри можна передавати на рівні модуля:

```ts
import { OasOptions } from '@ditsmod/openapi';

@featureModule({
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

## Хелпери, що повертають цілий Operation Object {#helpers-that-return-an-entire-operation-object}

У попередніх прикладах були показані хелпери, що повертають частини [Operation Object][1], але, звичайно ж, ви можете створити власні хелпери, які повертають цілі Operation Object. Один із прикладів використання таких хелперів показаний в репозиторії [RealWorld][4].

## Спеціальний декоратор для ґардів {#special-decorator-for-guards}

Модуль `@ditsmod/openapi` має спеціальний декоратор `oasGuard`, що дозволяє закріпити метадані OpenAPI за ґардами:

```ts
import { CanActivate } from '@ditsmod/rest';
import { oasGuard } from '@ditsmod/openapi';

@oasGuard({
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

На даний момент декоратор `oasGuard` приймає наступний тип даних:

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
import { controller } from '@ditsmod/core';
import { oasRoute } from '@ditsmod/openapi';

@controller()
export class SomeController {
  // ...
  @oasRoute('GET', 'users/:username', [BasicGuard])
  async getSome() {
    // ...
  }
}
```





[0]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md
[1]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#operation-object
[2]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#reference-object
[3]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#schema-object
[4]: https://github.com/ditsmod/realworld/blob/e8947f8767/packages/server/src/app/modules/routed/profiles/profiles.controller.ts#L24-L30
[5]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#security-scheme-object
[6]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#responses-object
