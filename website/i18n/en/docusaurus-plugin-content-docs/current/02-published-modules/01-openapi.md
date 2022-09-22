---
sidebar_position: 1
title: OpenAPI-документація
---

# @ditsmod/openapi

To create a route according to the [OpenAPI][0] specification, you can use the `OasRoute` decorator imported from `@ditsmod/openapi`. In this decorator, the fourth or third parameter (if there are no guards) is the so-called [Operation Object][1]:

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

Ditsmod has good support for TypeScript models for OpenAPI v3.1.0, including Operation Object, but it is not necessary to manually write the entire Operation Object directly in the code for each route. It is better to use helpers that will generate the necessary code for you, and also reduce the number of errors due to even better TypeScript support. Ditsmod has several such helpers: `getParams()`, `getContent()`, `Parameters`, `Content`. They are all imported from the `@ditsmod/openapi` module.

## Passing Operation Object parameters

In the following example, with the helper `getParams()`, almost everything that we wrote manually for `parameters` in the previous example is recorded:

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

The data type for the `username` parameter and its description are missing here. We recommend using a TypeScript class as a model so that you can then refer to it using helpers that can read its metadata and return ready-made JSON objects.

## Creation of TypeScript models

The following example shows a model with three parameters:

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

As you can see, to attach metadata to the model, the `@Column()` decorator is used, where you can pass [Schema Object][3] as the first argument.

Note that in this case the `type` property is not specified in the metadata, as the types specified here are automatically read by helpers. However, not all types available in TypeScript can be read. For example, helpers will not be able to automatically see what type of array you are passing, in which case you need to pass a hint as the second argument to the `@Column()` decorator:

```ts
import { Column } from '@ditsmod/openapi';

class Params {
  @Column({}, String)
  usernames: string[];
}
```

Although the links of some models to others are also quite readable. In the following example, `Model2` has a reference to `Model1`:

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

## Using TypeScript models

The `getParams()` helper allows you to use models, and if you make a mistake in a parameter name, TypeScript will tell you about it:

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

But the helper `getParams()` is not intended to be used simultaneously for mandatory and optional parameters. It also cannot pass a parameter description that differs from the parameter description in the parameter model. For such purposes, you can use another helper - `Parameters`:

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

### requestBody and responses content

To describe the content of the request `requestBody` or server `responses` according to the `OpenAPI` specification, you can use the `getContent()` helper:

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
        description: 'Description of content with this status',
        content: getContent({ mediaType: '*/*', model: SomeModel }),
      },
    },
  })
  async getSome() {
    // ...
  }
}
```

The `getContent()` helper accepts a shortened version of the data when describing a single `mediaType` variant. If you need to describe a larger number of `mediaType`, you can use the `Content` class:

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
        description: 'Description of content with this status',
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

## OpenAPI module-level options

Tags and parameters can be passed at the module level:

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

## Helpers that return an entire Operation Object

The previous examples showed helpers that return parts of the [Operation Object][2], but of course you can create your own helpers that return the entire Operation Object. One of the examples of the use of such helpers is shown in the [RealWorld][4] repository.

[0]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md
[1]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#operationObject
[2]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#referenceObject
[3]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#schemaObject
[4]: https://github.com/ditsmod/realworld/blob/e8947f8767/packages/server/src/app/modules/routed/profiles/profiles.controller.ts#L24-L30
