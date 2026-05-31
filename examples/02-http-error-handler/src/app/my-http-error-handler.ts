import { injectable, Logger, Status } from '@ditsmod/core';
import { isCustomError } from '@ditsmod/core/errors';
import { HttpErrorHandler, RequestContext } from '@ditsmod/rest';
import { randomUUID } from 'node:crypto';

@injectable()
export class MyHttpErrorHandler implements HttpErrorHandler {
  constructor(protected logger: Logger) {}

  async handleError(err: Error, reqCtx: RequestContext) {
    const requestId = randomUUID();
    const errObj = { requestId, err, note: 'This is my implementation of HttpErrorHandler' };
    if (isCustomError(err)) {
      const { level, status } = err.info;
      this.logger.log(level || 'debug', errObj);
      reqCtx.rawRes.statusCode = status || Status.INTERNAL_SERVER_ERROR;
      this.sendError(err.message, reqCtx, requestId);
    } else {
      this.logger.log('error', errObj);
      const msg = err.message || 'Internal server error';
      reqCtx.rawRes.statusCode = (err as any).status || Status.INTERNAL_SERVER_ERROR;
      this.sendError(msg, reqCtx, requestId);
    }
  }

  protected sendError(error: string, reqCtx: RequestContext, requestId: string) {
    if (!reqCtx.rawRes.headersSent) {
      this.addRequestIdToHeader(requestId, reqCtx);
      reqCtx.sendJson({ error });
    }
  }

  protected addRequestIdToHeader(requestId: string, ctx: RequestContext) {
    ctx.rawRes.setHeader('x-requestId', requestId);
  }
}
