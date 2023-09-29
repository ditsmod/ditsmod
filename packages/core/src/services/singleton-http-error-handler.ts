import { randomUUID } from 'node:crypto';

import { injectable } from '#di';
import { RequestContext } from '#types/http-interceptor.js';
import { Logger } from '#types/logger.js';
import { cleanErrorTrace } from '#utils/clean-error-trace.js';
import { Status } from '#utils/http-status-codes.js';
import { isChainError } from '#utils/type-guards.js';
import { ErrorOpts } from '../custom-error/error-opts.js';
import { HttpErrorHandler } from './http-error-handler.js';

@injectable()
export class SingletonHttpErrorHandler implements HttpErrorHandler {
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
      this.sendError('Internal server error', ctx, requestId, Status.INTERNAL_SERVER_ERROR);
    }
  }

  protected sendError(error: string, ctx: RequestContext, requestId: string, status?: Status) {
    if (!ctx.nodeRes.headersSent) {
      this.addRequestIdToHeader(requestId, ctx);
      const errStr = JSON.stringify({ error });
      ctx.nodeRes.statusCode = status || Status.INTERNAL_SERVER_ERROR;
      ctx.nodeRes.end(errStr);
    }
  }

  protected addRequestIdToHeader(requestId: string, ctx: RequestContext) {
    ctx.nodeRes.setHeader('x-requestId', requestId);
  }
}
