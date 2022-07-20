---
sidebar_position: 2
---

# OpenAPI

To create a route according to the `OpenAPI` specification, you can use the `OasRoute` decorator, imported from `@ditsmod/openapi`.

## Parameters

The easiest way to pass parameters is to use the `getParams()` function. The following example describes the optional `page` parameter in `query`:

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

In this case, the data type for the `page` parameter is undefined. To fix this, you need specify a class that is a data model:

```ts
import { Controller } from '@ditsmod/core';
import { OasRoute, getParams, Column } from '@ditsmod/openapi';

// This is a parameter model
class Params {
  @Column({ minimum: 1, maximum: 100, description: 'Page number.' })
  page: number;
  @Column({ description: 'Another parameter.' })
  otherParam: string;
}

// This is a controller that uses a parameter model
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

It is enough to have single model for the whole project.

If you need to pass parameters to `OasRoute` via data models for automatic validation, this is done using the `VALIDATION_ARGS` constant:

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

If the parameter name changes in the parameter model, TypeScript shows an error within `OasRoute`. It is true that this error is difficult to understand, but first check the presence of the specified parameter in the parameter model.

The `getParams()` function is not intended to be simultaneously used for both - mandatory and optional parameters. It is also not possible to transmit a parameter description that differs from the parameter description in the parameter model. For such purposes, you can use the class `Parameters`:

```ts
import { Controller } from '@ditsmod/core';
import { OasRoute, Parameters } from '@ditsmod/openapi';

import { Params } from '@models/params';

@Controller()
export class SomeController {
  // ...
  @OasRoute('GET', '', {
    parameters: new Parameters()
      .required('query', Params, 'otherParam').describe('Some other description')
      .optional('query', Params, 'page')
      .getParams()
  })
  async getSome() {
    // ...
  }
}
```

## requestBody and responses content

To describe the content of the `requestBody` or the `responses` for the `OpenAPI` specification, you can use the `getContent()` function:

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
        description: 'Description of content with this status',
        content: getContent({ mediaType: '*/*', model: SomeModel })
      },
    },
  })
  async getSome() {
    // ...
  }
}
```

The `getContent()` function takes an short version of the data when you want to describe a single `mediaType`. If you need to describe more `mediaType`, you can use the `Content` class:

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
          .get()
      },
    },
  })
  async getSome() {
    // ...
  }
}
```

## OpenAPI options at the module level

Tags and parameters can be passed at the module level:

```ts
@Module({
  // ...
  extensionsMeta: {
    oasOptions: {
      tags: ['i18n'],
      paratemers: new Parameters()
                    .optional('query', Params, 'lcl').describe('Localization')
                    .getParams(),
    } as OasOptions,
  },
})
export class I18nModule {}
```