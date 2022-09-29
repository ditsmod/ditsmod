---
sidebar_position: 2
title: OpenAPI validation
---

# @ditsmod/openapi-validation

To provide automatic metadata-based validation in Ditsmod applications for OpenAPI, you can use the `@ditsmod/openapi-validation` module. Under the hood, this module has an integration with the [ajv][1] library, which directly performs the validation just mentioned.

Currently, automatic validation only works for HTTP requests that have a media type of `application/json` and do not refer to [Reference Object][3].

## Installation

After you create [OpenAPI documentation][2], you need to import two modules for automatic validation based on it:

```bash
yarn add @ditsmod/openapi-validation @ditsmod/i18n
```

## Enable validation and set options

To enable automatic validation in a specific module, it is enough to import `ValidationModule` there. You can also pass `ValidationOptions` and `AJV_OPTIONS`:

```ts
import { Module, Providers, Status } from '@ditsmod/core';
import { ValidationModule, ValidationOptions, AJV_OPTIONS } from '@ditsmod/openapi-validation';
import { Options } from 'ajv';

@Module({
  imports: [ValidationModule],
  providersPerApp: [
    ...new Providers()
      .useValue<ValidationOptions>(ValidationOptions, { invalidStatus: Status.UNPROCESSABLE_ENTRY })
      .useValue<Options>(AJV_OPTIONS, { allErrors: true })
  ]
  // ...
})
export class SomeModule {}
```


[1]: https://ajv.js.org/guide/getting-started.html
[2]: ./01-openapi.md
[3]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#referenceObject
