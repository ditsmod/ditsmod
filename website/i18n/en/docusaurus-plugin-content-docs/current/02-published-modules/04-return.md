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

If you want such functionality to be available only in a separate module, you can view [a finished example in the Ditsmod repository][3].




[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/18-return
[2]: ../00-components-of-ditsmod-app/06-providers-collisions.md
[3]: https://github.com/ditsmod/ditsmod/tree/main/examples/18-return
