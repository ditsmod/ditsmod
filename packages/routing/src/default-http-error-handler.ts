import { injectable, Logger, isCustomError, Status, CustomError } from '@ditsmod/core';
import { randomUUID } from 'node:crypto';

import { HttpErrorHandler } from './http-error-handler.js';
import { RequestContext } from './request-context.js';

@injectable()
export class DefaultHttpErrorHandler implements HttpErrorHandler {
  constructor(protected logger: Logger) {}

  async handleError(err: Error, ctx: RequestContext) {
    const requestId = randomUUID();
    const errObj = { requestId, err };
    if (isCustomError(err)) {
      const { level, status } = err.info;
      if (err.info.msg2) {
        this.logMsg2(err, requestId);
      } else {
        this.logger.log(level || 'debug', errObj);
      }
      ctx.rawRes.statusCode = status || Status.INTERNAL_SERVER_ERROR;
      this.sendError(err.message, ctx, requestId);
    } else {
      this.logger.log('error', errObj);
      const msg = err.message || 'Internal server error';
      ctx.rawRes.statusCode = (err as any).status || Status.INTERNAL_SERVER_ERROR;
      this.sendError(msg, ctx, requestId);
    }
  }

  protected logMsg2(err: CustomError, requestId: string) {
    this.logger.log(err.info.level || 'debug', `Error: ${err.info.msg2}\nrequestId: ${requestId}\n${err.stack}`);
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
