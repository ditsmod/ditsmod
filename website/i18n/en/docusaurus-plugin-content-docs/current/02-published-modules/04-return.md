---
sidebar_position: 4
title: Return listener
---

# @ditsmod/return

The `@ditsmod/return` module allows you to send an HTTP response using the `return` operator within a method that binds to a specific route:

```ts
import { Controller, Route } from '@ditsmod/core';

@Controller()
export class HelloWorldController {
  @Route('GET')
  async tellHello() {
    return 'Hello World!\n';
  }
}
```

If you want such functionality to be available only in a separate module, you can view [a finished example in the Ditsmod repository][1].

## Installation and importing

Installation:

```bash
yarn add @ditsmod/return
```

When importing `ReturnModule`, you also need to [resolve a collision][2] in the `resolvedCollisionsPerReq` array, because `ReturnModule` substitutes the provider for the `HttpBackend` token, which is also substitutes under the hood in `@ditsmod/core`:

```ts
import { HttpBackend, RootModule } from '@ditsmod/core';
import { ReturnModule } from '@ditsmod/return';

@RootModule({
  imports: [
    ReturnModule
    // ...
  ],
  resolvedCollisionsPerReq: [
    [HttpBackend, ReturnModule]
  ],
  exports: [ReturnModule],
  // ...
})
export class AppModule {}
```

As you can see, in addition to importing, the `ReturnModule` is also exported in the root module so that the functionality provided by the `ReturnModule` module is available to any controller.

## HTTP statuses and headers

By default, the interceptor in the `@ditsmod/return` module automatically substitutes the 201 status for requests with the `POST` HTTP method, the 204 - for `OPTIONS`, and the 200 status - for the rest. If you need to change this behavior, you should use the standard mechanism (without using the `return` statement):

```ts
import { Controller, Res, Route, Status } from '@ditsmod/core';

@Controller()
export class UsersController {
  constructor(private res: Res) {}

  @Route('GET')
  getUsersList() {
    // ...
    this.res.sendJson({ error: 'Page not found' }, Status.NOT_FOUND);
  }
}
```




[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/18-return
[2]: ../00-components-of-ditsmod-app/06-providers-collisions.md
