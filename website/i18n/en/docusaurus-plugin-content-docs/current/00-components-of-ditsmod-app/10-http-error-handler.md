---
title: HttpErrorHandler
sidebar_position: 10
---

## CustomError {#customerror}

Ditsmod provides two built-in classes - `CustomError` and `HttpErrorHandler` - that can be used to throw and catch errors, respectively.

The `CustomError` class can be composed to generate any error:

```ts {9}
import { CustomError, Status } from '@ditsmod/core';

// ...

if (someCondition) {
  const msg1 = 'message for client';
  const msg2 = 'message for logger';

  throw new CustomError({ msg1, msg2, level: 'debug', status: Status.BAD_REQUEST });
}
```

That is, in `CustomError` arguments it is possible to transmit two types of messages:
- `msg1` - message to be sent to the client that created the current HTTP request;
- `msg2` - message for the logger.

In general, the constructor of the `CustomError` class takes an object with the following interface as the first argument:

```ts
interface ErrorInfo {
  id?: string | number;
  /**
   * Message to send it to a client.
   */
  msg1?: string = 'Internal server error';
  /**
   * A message to send it to a logger.
   */
  msg2?: string = '';
  /**
   * Arguments for error handler to send it to a client.
   */
  args1?: any;
  /**
   * Arguments for error handler to send it to a logger.
   */
  args2?: any;
  /**
   * Log level. By default - `warn`.
   */
  level?: InputLogLevel = 'warn';
  /**
   * HTTP status.
   */
  status?: Status = Status.BAD_REQUEST;
  /**
   * The parameters that came with the HTTP request.
   */
  params?: any;
}
```

The `CustomError' class constructor can accept cause error as the second argument, if there is one.

## HttpErrorHandler {#httperrorhandler}

Any errors that occur while processing an HTTP request that you have not caught in controllers, interceptors, or services go to [DefaultHttpErrorHandler][100]. This handler is passed to the DI registry at the route level.

You can create your own error handler by creating a class that implements the [HttpErrorHandler][101] interface:

```ts
import { HttpErrorHandler, injectable, isCustomError, Logger, RequestContext, Status } from '@ditsmod/core';
import { randomUUID } from 'node:crypto';

@injectable()
export class MyHttpErrorHandler implements HttpErrorHandler {
  constructor(protected logger: Logger) {}

  async handleError(err: Error, ctx: RequestContext) {
    const requestId = randomUUID();
    const errObj = { requestId, err, note: 'This is my implementation of HttpErrorHandler' };
    if (isCustomError(err)) {
      const { level, status } = err.info;
      this.logger.log(level || 'debug', errObj);
      this.sendError(err.message, ctx, requestId, status);
    } else {
      this.logger.log('error', errObj);
      const msg = err.message || 'Internal server error';
      const status = (err as any).status || Status.INTERNAL_SERVER_ERROR;
      this.sendError(msg, ctx, requestId, status);
    }
  }

  protected sendError(error: string, ctx: RequestContext, requestId: string, status?: Status) {
    if (!ctx.rawRes.headersSent) {
      this.addRequestIdToHeader(requestId, ctx);
      ctx.sendJson({ error }, status);
    }
  }

  protected addRequestIdToHeader(requestId: string, ctx: RequestContext) {
    ctx.rawRes.setHeader('x-requestId', requestId);
  }
}
```

To add your new error handler centrally, you can do it directly in the root module:

```ts {6-7}
import { rootModule, HttpErrorHandler } from '@ditsmod/core';
import { MyHttpErrorHandler } from './my-http-error-handler.js';

@rootModule({
  // ...
  providersPerRou: [{ token: HttpErrorHandler, useClass: MyHttpErrorHandler }],
  exports: [HttpErrorHandler],
})
export class AppModule {}
```

Of course, if there are error handling specifics for a separate module or controller, you can just as easily add your new handler to its metadata without affecting other components of your application.

If you add such a handler to the metadata of a feature module, you probably don't need to export it. On the other hand, if you want to write a custom error handling module and still want to export `HttpErrorHandler` from it, be aware that importing it into any module will require [provider collisions][1] to be resolved. This occurs because a default error handler has already been added to each module in your application, and when you import the module with its new error handler, the two error handlers collide. This can be easily resolved:

```ts {8}
import { featureModule, HttpErrorHandler } from '@ditsmod/core';
import { ErrorHandlerModule } from './error-handler.module.js';

@featureModule({
  // ...
  import: [ErrorHandlerModule]
  resolvedCollisionsPerRou: [
    [HttpErrorHandler, ErrorHandlerModule],
  ],
})
export class SomeModule {}
```

As you can see, the collision is resolved in the `resolvedCollisionsPerRou` array because it occurs at the route level. You pass there an array of two elements, where the first element is the token with which a collision occurred, and the second element is the module from which you want to export this provider.

We remind you that provider collisions can only occur when importing modules. That is, if you create your own error handler locally within a particular module, there will be no collisions.







[1]: /developer-guides/providers-collisions

[100]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/src/error/default-http-error-handler.ts
[101]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/src/error/http-error-handler.ts
[102]: https://github.com/ditsmod/ditsmod/blob/main/packages/core/src/error/error-opts.ts
