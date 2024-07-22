import { randomUUID } from 'node:crypto';

import { injectable } from '#di';
import { RequestContext } from '#types/http-interceptor.js';
import { Logger } from '#logger/logger.js';
import { cleanErrorTrace } from '#utils/clean-error-trace.js';
import { Status } from '#utils/http-status-codes.js';
import { isChainError } from '#utils/type-guards.js';
import { ErrorOpts } from '#error/error-opts.js';
import { HttpErrorHandler } from '#error/http-error-handler.js';

@injectable()
export class DefaultSingletonHttpErrorHandler implements HttpErrorHandler {
  constructor(protected logger: Logger) {}

  async handleError(err: Error, ctx: RequestContext) {
    cleanErrorTrace(err);
    const requestId = randomUUID();
    const errObj = { requestId, err };
    if (isChainError<ErrorOpts>(err)) {
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
    if (!ctx.nodeRes.headersSent) {
      this.addRequestIdToHeader(requestId, ctx);
      const errStr = JSON.stringify({ error });
      ctx.send(errStr, status || Status.INTERNAL_SERVER_ERROR);
    }
  }

  protected addRequestIdToHeader(requestId: string, ctx: RequestContext) {
    ctx.nodeRes.setHeader('x-requestId', requestId);
  }
}
