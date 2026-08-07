---
sidebar_position: 21
---

# @holu/openapi-validation

To provide automatic metadata-based validation in Holu applications for OpenAPI, you can use the `@holu/openapi-validation` module. Under the hood, this module has an integration with the [ajv][1] library, which directly performs the validation just mentioned.

Currently, automatic validation only works for HTTP requests that have a media type of `application/json` and do not refer to [Reference Object][3]. Automatic validation works for parameters in:
- path
- query
- cookie
- header
- request's body.

## Installation {#installation}

After you create [OpenAPI documentation][2], you need to import two modules for automatic validation based on it:

```bash
npm i @holu/openapi-validation @holu/i18n
```

## Enable validation and set options {#enable-validation-and-set-options}

To enable automatic validation in a specific module, it is enough to import `ValidationModule` there. You can also pass `ValidationOptions` and `AJV_OPTIONS`:

```ts
import { ProviderBuilder, HttpStatus } from '@holu/core';
import { restModule } from '@holu/rest';
import { ValidationModule, ValidationOptions, AJV_OPTIONS } from '@holu/openapi-validation';
import { Options } from 'ajv';

@restModule({
  imports: [ValidationModule],
  providersPerApp: new ProviderBuilder()
    .useValue<ValidationOptions>(ValidationOptions, { invalidStatus: HttpStatus.UNPROCESSABLE_ENTRY })
    .useValue<Options>(AJV_OPTIONS, { allErrors: true }),
  // ...
})
export class SomeModule {}
```

## Substituting of validation interceptors {#substituting-of-validation-interceptors}

The `ParametersInterceptor` and `RequestBodyInterceptor` classes are responsible for validating the request body and request parameters. They can be substituted in the `providersPerReq` array at the module or controller level:

```ts
import { restModule } from '@holu/rest';
import { ParametersInterceptor } from '@holu/openapi-validation';

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

Before writing your interceptor for validation, you can first review how is written, for example [ParametersInterceptor][4].


[1]: https://ajv.js.org/guide/getting-started.html
[2]: /rest-application/native-modules/openapi
[3]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#referenceObject
[4]: https://github.com/holu/holu/blob/3.0.0-next.15/packages/openapi-validation/src/parameters.interceptor.ts