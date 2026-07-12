import { injectable, Logger, HttpStatus } from '@ditsmod/core';
import { isCustomError } from '@ditsmod/core/errors';
import { HttpErrorHandler, RequestContext } from '@ditsmod/rest';

@injectable()
export class MyHttpErrorHandler implements HttpErrorHandler {
  constructor(protected logger: Logger) {}

  async handleError(err: Error, ctx: RequestContext) {
    const errObj = { requestId: ctx.requestId, err, note: 'This is my implementation of HttpErrorHandler' };
    if (isCustomError(err)) {
      const { level, status } = err.info;
      this.logger.log(level || 'debug', errObj);
      ctx.rawRes.statusCode = status || HttpStatus.INTERNAL_SERVER_ERROR;
      this.sendError(err.message, ctx, ctx.requestId);
    } else {
      this.logger.log('error', errObj);
      const msg = err.message || 'Internal server error';
      ctx.rawRes.statusCode = (err as any).status || HttpStatus.INTERNAL_SERVER_ERROR;
      this.sendError(msg, ctx, ctx.requestId);
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
