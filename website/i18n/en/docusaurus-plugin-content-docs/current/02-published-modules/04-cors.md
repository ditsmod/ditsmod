---
sidebar_position: 4
title: OPTIONS and CORS
---

# @ditsmod/cors

If your application needs to use the [OPTIONS][1] HTTP method or the [CORS][2] or [CORS preflight][3] mechanisms, you can use the `@ditsmod/cors` module.

## Install

```bash
yarn add @ditsmod/cors
```

## Work with default settings

A finished example from `@ditsmod/cors` can be viewed [in the Ditsmod repository][4].

The module can work with default settings immediately after import:

```ts
import { Module } from '@ditsmod/core';
import { CorsModule } from '@ditsmod/cors';

@Module({
  imports: [
    CorsModule,
    // ...
  ],
  // ...
})
export class SomeModule {}
```

Now all routes in `SomeModule` will be supplemented with new routes with `OPTIONS` HTTP method. That is, if `SomeModule` has `GET /users` and `GET /posts` routes, they will be automatically supplemented with `OPTIONS /users` and `OPTIONS /posts` routes.

You can check the operation of this module with approximately the following queries:

```bash
# Simply OPTIONS request
curl -isS localhost:3000 -X OPTIONS

# OPTIONS CORS request
curl -isS localhost:3000 -X OPTIONS -H 'Origin: https://example.com'

# GET CORS request
curl -isS localhost:3000 -H 'Origin: https://example.com'

# CORS Preflight request
curl -isS localhost:3000 \
-X OPTIONS \
-H 'Origin: https://example.com' \
-H 'Access-Control-Request-Method: POST' \
-H 'Access-Control-Request-Headers: X-PINGOTHER, Content-Type'

# CORS request with credentials
curl -isS localhost:3000/credentials
```

## Work with custom settings

If you want to change the default settings, during import you can pass some options that will be taken into account at the module level:

```ts
import { Module } from '@ditsmod/core';
import { CorsModule } from '@ditsmod/cors';

@Module({
  imports: [
    CorsModule.withParams({ origin: 'https://example.com' }),
    // ...
  ],
  // ...
})
export class SomeModule {}
```

It is also possible to pass CORS options at the route level:

```ts
import { Module, Providers } from '@ditsmod/core';
import { CorsModule, CorsOpts } from '@ditsmod/cors';

@Module({
  imports: [
    CorsModule,
    // ...
  ],
  providersPerRou: [
    ...new Providers()
      .useValue<CorsOpts>(CorsOpts, { origin: 'https://example.com' }),
    // ...
  ],
  // ...
})
export class SomeModule {}
```

## Working with cookies during CORS requests

When you need the CORS HTTP response to contain cookies, and for those cookies to be accepted by web browsers, you can use `CorsService`:

```ts
import { Controller, Res, Route } from '@ditsmod/core';
import { CorsService } from '@ditsmod/cors';

@Controller()
export class SomeController {
  constructor(private res: Res, private corsService: CorsService) {}

  @Route('GET')
  getMethod() {
    this.corsService.setCookie('one', 'value for one');
    this.res.send('Some response');
  }
}
```

As you can see, the cookie is set using the `setCookie()` method. In this case, the response will contain the `Access-Control-Allow-Credentials: true` header.




[1]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/OPTIONS
[2]: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
[3]: https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request
[4]: https://github.com/ditsmod/ditsmod/tree/main/examples/17-cors
