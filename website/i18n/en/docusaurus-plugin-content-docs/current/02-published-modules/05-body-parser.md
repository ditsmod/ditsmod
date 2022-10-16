---
sidebar_position: 5
title: Body parser
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
import { RootModule } from '@ditsmod/core';
import { BodyParserModule } from '@ditsmod/body-parser';

@RootModule({
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
import { RootModule } from '@ditsmod/core';
import { BodyParserModule } from '@ditsmod/body-parser';

const moduleWithBodyParserConfig = BodyParserModule.withParams({ maxBodySize: 1024 * 1024 });

@RootModule({
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
import { RootModule, Providers } from '@ditsmod/core';
import { BodyParserModule, BodyParserConfig } from '@ditsmod/body-parser';

@RootModule({
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

The result of the interceptor can be obtained in `this.req.body`:

```ts
import { Controller, Req, Res, Route } from '@ditsmod/core';

@Controller()
export class SomeController {
  constructor(private req: Req, private res: Res) {}

  @Route('POST')
  ok() {
    this.res.sendJson(this.req.body);
  }
}
```



[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/06-body-parser
[2]: https://www.npmjs.com/package/@ts-stack/multiparty
