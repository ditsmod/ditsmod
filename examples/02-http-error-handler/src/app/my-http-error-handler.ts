import { injectable, isCustomError, Logger, Status } from '@ditsmod/core';
import { HttpErrorHandler, RequestContext } from '@ditsmod/rest';
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
      ctx.rawRes.statusCode = status || Status.INTERNAL_SERVER_ERROR;
      this.sendError(err.message, ctx, requestId);
    } else {
      this.logger.log('error', errObj);
      const msg = err.message || 'Internal server error';
      ctx.rawRes.statusCode = (err as any).status || Status.INTERNAL_SERVER_ERROR;
      this.sendError(msg, ctx, requestId);
    }
  }

  protected sendError(error: string, ctx: RequestContext, requestId: string) {
    if (!ctx.rawRes.headersSent) {
      this.addRequestIdToHeader(requestId, ctx);
      ctx.sendJson({ error });
    }
  }

  protected addRequestIdToHeader(requestId: string, ctx: RequestContext) {
    ctx.rawRes.setHeader('x-requestId', requestId);
  }
}
