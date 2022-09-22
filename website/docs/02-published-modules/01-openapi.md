---
sidebar_position: 1
title: OpenAPI-документація
---

# @ditsmod/openapi

Щоб створити маршрут за специфікацією [OpenAPI][0], можна використовувати декоратор `OasRoute`, що імпортується з `@ditsmod/openapi`. У цьому декораторі четвертим або третім параметром (якщо немає ґардів) йде так званий [Operation Object][1]:

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
import { Column } from '@ditsmod/openapi';

class Params {
  @Column({ description: 'Username of the profile to get.' })
  username: string;

  @Column({ minimum: 1, maximum: 100, description: 'Page number.' })
  page: number;

  @Column()
  hasName: boolean;
}
```

Як бачите, щоб закріпити метадані за моделлю, використовується декоратор `@Column()`, куди ви можете передавати першим аргументом [Schema Object][3].

Зверніть увагу, що в даному разі властивість `type` не прописується у метаданих, оскільки указані тут типи автоматично читаються хелперами. Щоправда не усі наявні у TypeScript типи можуть читатись. Наприклад, хелпери не зможуть автоматично побачити який тип масиву ви передаєте, в такому разі необхідно передавати підказку у якості другого аргументу в декоратор `@Column()`:

```ts
import { Column } from '@ditsmod/openapi';

class Params {
  @Column({}, String)
  usernames: string[];
}
```

Хоча посилання одних моделей на інші теж досить добре читаються. В наступному прикладі `Model2` має посилання на `Model1`:

```ts
import { Column } from '@ditsmod/openapi';

export class Model1 {
  @Column()
  property1: string;
}

export class Model2 {
  @Column()
  model1: Model1;

  @Column({}, Model1)
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

Щоб описати контент запиту `requestBody` чи відповіді сервера `responses` по специфікації `OpenAPI`, можна скористатись хелпером `getContent()`:

```ts
import { Controller, Status } from '@ditsmod/core';
import { OasRoute, getContent } from '@ditsmod/openapi';

import { SomeModel } from './some-model';

@Controller()
export class SomeController {
  // ...
  @OasRoute('GET', '', {
    responses: {
      [Status.OK]: {
        description: 'Опис контенту із даним статусом',
        content: getContent({ mediaType: '*/*', model: SomeModel }),
      },
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

[0]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md
[1]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#operationObject
[2]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#referenceObject
[3]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#schemaObject
