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

This module does not parse the request body when uploading files, for this you can use the third-party module [@ts-stack/multiparty][2].

## Installation

```bash
npm i @ditsmod/body-parser
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

```ts {4}
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

Depending on whether the controller is [singleton][3] or not, the result of the interceptor can be obtained in two ways:

1. If the controller is non-singleton, the result can be obtained using the `HTTP_BODY` token:

  ```ts {11}
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
2. If the controller is singleton, the result can be obtained from the context:

  ```ts {6}
  import { controller, route, SingletonRequestContext } from '@ditsmod/core';

  @controller({ isSingleton: true })
  export class SomeController {
    @route('POST')
    ok(ctx: SingletonRequestContext) {
      const bodyStr = JSON.stringify(ctx.body);
      ctx.nodeRes.end(bodyStr);
    }
  }
  ```

[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/06-body-parser
[2]: https://www.npmjs.com/package/@ts-stack/multiparty
[3]: /components-of-ditsmod-app/controllers-and-services/#what-is-a-controller
