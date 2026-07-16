---
title: Error
sidebar_position: 10
---

## CustomError {#customerror}

Ditsmod provides two built-in classes - `CustomError` and `HttpErrorHandler` - that can be used to throw and catch errors, respectively.

The `CustomError` class can be composed to generate any error:

```ts {10}
import { HttpStatus } from '@ditsmod/core';
import { CustomError } from '@ditsmod/core/errors';

// ...

if (someCondition) {
  const msg1 = 'message for client';
  const msg2 = 'message for logger';

  throw new CustomError({ msg1, msg2, level: 'debug', status: HttpStatus.BAD_REQUEST });
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
  status?: HttpStatus = HttpStatus.BAD_REQUEST;
  /**
   * The parameters that came with the HTTP request.
   */
  params?: any;
  name?: string;
  code?: string;
}
```

The `CustomError` class constructor can accept cause error as the second argument, if there is one.

### `CustomError` subclasses {#customerror-subclasses}

It is recommended to use `CustomError` as a base class for creating any other error classes. For example, a new error `NormalizationFailure` is created as follows (the `DM_ERR_` prefix is automatically added to this error’s `code`):

```ts
import { CustomError } from '@ditsmod/core/errors';
/**
 * `Normalization of ${moduleName} failed`
 */
export class NormalizationFailure extends CustomError {
  constructor(moduleName: string, cause: Error) {
    super(
      {
        msg1: `Normalization of ${moduleName} failed`,
        level: 'fatal',
      },
      cause,
    );
  }
}
```

This allows you to control the uniqueness of error names, debug errors via `instanceof`, add an error chain via the `cause` field (as the second argument to the `CustomError` constructor), and automatically remove part of the error stack trace.

## HttpErrorHandler {#httperrorhandler}

Any errors that occur while processing an HTTP request that you have not caught in controllers, interceptors, or services go to [DefaultHttpErrorHandler][100]. This handler is passed to the DI registry at the route level.

You can create your own error handler by creating a class that implements the [HttpErrorHandler][101] interface:

```ts
import { injectable, Logger, HttpStatus } from '@ditsmod/core';
import { HttpErrorHandler, RequestContext } from '@ditsmod/rest';
import { isCustomError } from '@ditsmod/core/errors';

@injectable()
export class MyHttpErrorHandler implements HttpErrorHandler {
  constructor(protected logger: Logger) {}

  async handleError(err: Error, ctx: RequestContext) {
    const requestId = ctx.requestId;
    const errObj = { requestId, err, note: 'This is my implementation of HttpErrorHandler' };
    if (isCustomError(err)) {
      const { level, status } = err.info;
      this.logger.log(level || 'debug', errObj);
      this.sendError(err.message, ctx, requestId, status);
    } else {
      this.logger.log('error', errObj);
      const msg = err.message || 'Internal server error';
      const status = (err as any).status || HttpStatus.INTERNAL_SERVER_ERROR;
      this.sendError(msg, ctx, requestId, status);
    }
  }

  protected sendError(error: string, ctx: RequestContext, requestId: string, status?: HttpStatus) {
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
import { rootModule } from '@ditsmod/core';
import { HttpErrorHandler } from '@ditsmod/rest';
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
import { restModule, HttpErrorHandler } from '@ditsmod/rest';
import { ErrorHandlerModule } from './error-handler.module.js';

@restModule({
  // ...
  imports: [ErrorHandlerModule],
  resolvedCollisionPerRou: [
    [HttpErrorHandler, ErrorHandlerModule],
  ],
})
export class SomeModule {}
```

As you can see, the collision is resolved in the `resolvedCollisionPerRou` array because it occurs at the route level. You pass there an array of two elements, where the first element is the token with which a collision occurred, and the second element is the module from which you want to export this provider.

We remind you that provider collisions can only occur when importing modules. That is, if you create your own error handler locally within a particular module, there will be no collisions.







[1]: /basic-components/modules/#provider-collisions

[100]: https://github.com/ditsmod/ditsmod/blob/3.0.0-next.15/packages/rest/src/services/default-http-error-handler.ts
[101]: https://github.com/ditsmod/ditsmod/blob/3.0.0-next.15/packages/rest/src/services/http-error-handler.ts
