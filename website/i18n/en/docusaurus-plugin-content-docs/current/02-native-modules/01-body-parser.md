---
sidebar_position: 1
---

# @ditsmod/body-parser

This module adds an interceptor for parsing the request body to all routes that have the HTTP methods specified in `bodyParserConfig.acceptMethods`, by default it is:

- `POST`
- `PUT`
- `PATCH`

The following data types are supported:

- `application/json`
- `application/x-www-form-urlencoded`
- `text/plain`
- `text/html`

This module does not parse the request body when uploading files, for this you can use the third-party module [multiparty][2].

## Installation

```bash
yarn add @ditsmod/body-parser
```

## Importing

To enable `@ditsmod/body-parser` globally, you need to import and export `BodyParserModule` in the root module:

```ts
import { rootModule } from '@ditsmod/core';
import { BodyParserModule } from '@ditsmod/body-parser';

@rootModule({
  imports: [
    BodyParserModule,
    // ...
  ],
  exports: [BodyParserModule]
})
export class AppModule {}
```

In this case, the default settings will work. If you need to change some options, you can do it as follows:

```ts
import { rootModule } from '@ditsmod/core';
import { BodyParserModule } from '@ditsmod/body-parser';

const moduleWithBodyParserConfig = BodyParserModule.withParams({ maxBodySize: 1024 * 1024 });

@rootModule({
  imports: [
    moduleWithBodyParserConfig,
    // ...
  ],
  exports: [moduleWithBodyParserConfig]
})
export class AppModule {}
```

Another option for passing the configuration:

```ts
import { rootModule, Providers } from '@ditsmod/core';
import { BodyParserModule, BodyParserConfig } from '@ditsmod/body-parser';

@rootModule({
  imports: [
    BodyParserModule,
    // ...
  ],
  providersPerApp: [
    ...new Providers()
      .useValue<BodyParserConfig>(BodyParserConfig,  { maxBodySize: 1024*1024 })
  ],
  exports: [BodyParserModule]
})
export class AppModule {}
```

## Usage

The result of the interceptor can be obtained by `HTTP_BODY` token:

```ts
import { controller, Res, route, inject } from '@ditsmod/core';
import { HTTP_BODY } from '@ditsmod/body-parser';

interface Body {
  one: number;
}

@controller()
export class SomeController {
  @route('POST')
  ok(@inject(HTTP_BODY) body: Body, res: Res) {
    res.sendJson(body);
  }
}
```



[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/06-body-parser
[2]: https://www.npmjs.com/package/@ts-stack/multiparty
