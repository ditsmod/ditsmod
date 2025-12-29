---
sidebar_position: 20
---

# @ditsmod/openapi

You can use the `@ditsmod/openapi` module to create [OpenAPI][0] documentation.

## Installation and Setup {#installation-and-setup}

```bash
npm i @ditsmod/openapi
```

To get `OpenapiModule` with default settings, simply import it into any module:

```ts {5}
import { OpenapiModule } from '@ditsmod/openapi';
import { restModule } from '@ditsmod/rest';

@restModule({
  imports: [{ absolutePath: '', module: OpenapiModule }],
  // ...
})
export class SomeModule {}
```

In this case, the documentation will be generated for the entire application at a URL that depends on the application's path prefix. For example, if the application's path prefix is `/api`, the OpenAPI documentation will be available at `/api/openapi`.

You can also use the static method `OpenapiModule.withParams` to specify additional parameters for importing `OpenapiModule`:

```ts {11,14}
import { restModule } from '@ditsmod/rest';
import { OpenapiModule, SwaggerOAuthOptions } from '@ditsmod/openapi';
import { oasObject } from './oas-object.js';

const swaggerOAuthOptions: SwaggerOAuthOptions = {
  appName: 'Swagger UI Demo',
  // See https://demo.duendesoftware.com/ for configuration details.
  clientId: 'implicit',
};

const moduleWithParams = OpenapiModule.withParams(oasObject, 'absolute-path', swaggerOAuthOptions);

@restModule({
  imports: [moduleWithParams],
  // ...
})
export class SomeModule {}
```

Here, `oasObject` is the root OpenAPI documentation object where some general metadata can be specified:

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

## Creation of documentation {#creation-of-documentation}

To create individual routes, use the `oasRoute` decorator, in which the fourth or third parameter (if there are no guards) is the so-called [Operation Object][1]:

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

Ditsmod has good support for TypeScript models for OpenAPI v3.1.0, including Operation Object, but it is not necessary to manually write the entire Operation Object directly in the code for each route. It is better to use helpers that will generate the necessary code for you, and also reduce the number of errors due to even better TypeScript support. Ditsmod has several such helpers: `getParams()`, `getContent()`, `Parameters`, `Content`. They are all imported from the `@ditsmod/openapi` module.

## Passing Operation Object parameters {#passing-operation-object-parameters}

In the following example, with the helper `getParams()`, almost everything that we wrote manually for `parameters` in the previous example is recorded:

```ts {8}
import { controller } from '@ditsmod/rest';
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

The data type for the `username` parameter and its description are missing here. We recommend using a TypeScript class as a model so that you can then refer to it using helpers that can read its metadata and return ready-made JSON objects.

## Creation of TypeScript models {#creation-of-typescript-models}

The following example shows a model with three parameters:

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

As you can see, to attach metadata to the model, the `@property()` decorator is used, where you can pass [Schema Object][3] as the first argument.

Note that in this case the `type` property is not specified in the metadata, as the types specified here are automatically read by helpers. However, not all types available in TypeScript can be read. For example, helpers will not be able to automatically see what type of array you are passing. This is exactly the case with `enum`. Also, helpers do not see whether an object's property is optional or not.

The array type or `enum` can be passed as the second parameter to the `@property()` decorator:

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

  @property({}, { array: [[String]] }) // Array in array
  property4: string[][];
}
```

References of some models to others are quite readable. In the following example, `Model2` has a reference to `Model1`:

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

## Using TypeScript models {#using-typescript-models}

The `getParams()` helper allows you to use models, and if you make a mistake in a parameter name, TypeScript will tell you about it:

```ts {10}
import { controller } from '@ditsmod/rest';
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

Here `Params` is a class used as a parameter model.

But the helper `getParams()` is not intended to be used simultaneously for mandatory and optional parameters. It also cannot pass a parameter description that differs from the parameter description in the parameter model. For such purposes, you can use another helper - `Parameters`:

```ts {10-13}
import { controller } from '@ditsmod/rest';
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

### requestBody and responses content {#requestbody-and-responses-content}

Data models are also used to describe the content of `requestBody`, but there is one slight difference compared to parameters. By default, all model properties are optional, and to mark a particular property as required, you need to use the `REQUIRED` constant:

```ts
import { property, REQUIRED } from '@ditsmod/openapi';

class Model1 {
  @property()
  property1: string;
  @property({ [REQUIRED]: true })
  property2: number;
}
```

If this model will be used to describe `requestBody`, then `property2` in it will be required. But if this model is used to describe parameters, the `REQUIRED` marker will be ignored:

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

To describe the content in `requestBody` and `responses`, there is also a helper `getContent()`:

```ts {12}
import { controller } from '@ditsmod/rest';
import { oasRoute, getContent } from '@ditsmod/openapi';

import { SomeModel } from '#models/some.js';

@controller()
export class SomeController {
  // ...
  @oasRoute('POST', '', {
    requestBody: {
      description: 'All properties are taken from SomeModel.',
      content: getContent({ mediaType: 'application/json', model: SomeModel }),
    },
  })
  async postSome() {
    // ...
  }
}
```

The `getContent()` helper accepts a shortened version of the data when describing a single `mediaType` variant. If you need to describe a larger number of `mediaType`, you can use the `Content` class:

```ts {11-19}
import { Status } from '@ditsmod/core';
import { controller } from '@ditsmod/rest';
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

## OpenAPI module-level options {#openapi-module-level-options}

Tags and parameters can be passed at the module level:

```ts
import { OasOptions, Parameters } from '@ditsmod/openapi';
import { restModule } from '@ditsmod/rest';

import { Params } from './params.js';

@restModule({
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

## Helpers that return an entire Operation Object {#helpers-that-return-an-entire-operation-object}

The previous examples showed helpers that return parts of the [Operation Object][1], but of course you can create your own helpers that return the entire Operation Object. One of the examples of the use of such helpers is shown in the [RealWorld][4] repository.

## Special decorator for guards {#special-decorator-for-guards}

The `@ditsmod/openapi` module has a special `oasGuard` decorator that allows you to attach OpenAPI metadata behind guards:

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

At the moment, the `oasGuard` decorator accepts the following data type:

```ts
interface OasGuardMetadata {
  securitySchemeObject: XSecuritySchemeObject;
  responses?: XResponsesObject;
  tags?: string[];
}
```

Where `securitySchemeObject` is of type [Security Scheme Object][5] and `responses` is of type [Responses Object][6].

This guards are used in exactly the same way as "normal" guards:

```ts
import { controller } from '@ditsmod/rest';
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
