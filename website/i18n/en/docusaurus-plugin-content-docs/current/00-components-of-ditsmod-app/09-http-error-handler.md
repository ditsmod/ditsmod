---
sidebar_position: 9
---

# HttpErrorHandler

Any errors that occur while processing an HTTP request that you have not caught in controllers, interceptors, or services go to [DefaultHttpErrorHandler][100]. This handler is passed to the DI registry at the request level because it must have access to the HTTP request/response object in order to generate and send a response to the client.

You can create your own error handler by creating a class that implements the [HttpErrorHandler][101] interface:

```ts
import {
  Logger,
  Status,
  HttpErrorHandler,
  injectable,
  Res,
  NodeResponse,
  inject,
  NODE_RES,
  cleanErrorTrace,
  Req,
} from '@ditsmod/core';

@injectable()
export class MyHttpErrorHandler implements HttpErrorHandler {
  constructor(
    @inject(NODE_RES) private nodeRes: NodeResponse,
    protected req: Req,
    private res: Res,
    private logger: Logger,
  ) {}

  handleError(err: Error) {
    cleanErrorTrace(err);
    const message = err.message;
    this.logger.error({ note: 'This is my implementation of HttpErrorHandler', err });
    if (!this.nodeRes.headersSent) {
      this.addRequestIdToHeader();
      this.res.sendJson({ error: { message } }, Status.INTERNAL_SERVER_ERROR);
    }
  }

  protected addRequestIdToHeader() {
    const header = 'x-requestId';
    this.nodeRes.setHeader(header, this.req.requestId);
  }
}
```

To add your new error handler centrally, you can do it directly in the root module:

```ts
import { rootModule, HttpErrorHandler } from '@ditsmod/core';
import { MyHttpErrorHandler } from './my-http-error-handler';

@rootModule({
  // ...
  providersPerReq: [{ token: HttpErrorHandler, useClass: MyHttpErrorHandler }],
  exports: [HttpErrorHandler],
})
export class AppModule {}
```

Of course, if there are error handling specifics for a separate module or controller, you can just as easily add your new handler to its metadata without affecting other components of your application.

If you're adding such a handler to the metadata of a regular non-root module, you probably don't need to export it. On the other hand, if you want to write a custom error handling module and still want to export `HttpErrorHandler` from it, be aware that importing it into any module will require [provider collision][1] to be resolved. This occurs because a default error handler has already been added to any module in your application, and when you import the module with its new error handler, the two error handlers collide. This can be easily resolved:

```ts {8}
import { featureModule, HttpErrorHandler } from '@ditsmod/core';
import { ErrorHandlerModule } from './error-handler.module';

@featureModule({
  // ...
  import: [ErrorHandlerModule]
  resolvedCollisionsPerReq: [
    [HttpErrorHandler, ErrorHandlerModule],
  ],
})
export class SomeModule {}
```

As you can see, the collision is resolved in the `resolvedCollisionsPerReq` array because it occurs at the request level. You pass there an array of two elements, where the first element is the token with which a collision occurred, and the second element is the module from which you want to export this provider.

We remind you that provider collisions can only occur when importing modules. That is, if you create your own error handler locally within a particular module, there will be no collisions.







[1]: /developer-guides/providers-collisions

[100]: https://github.com/ditsmod/ditsmod/blob/core-2.43.0/packages/core/src/services/default-http-error-handler.ts
[101]: https://github.com/ditsmod/ditsmod/blob/core-2.43.0/packages/core/src/services/http-error-handler.ts
