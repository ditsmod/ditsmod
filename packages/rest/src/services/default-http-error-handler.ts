import { injectable, Logger, HttpStatus } from '@ditsmod/core';
import { CustomError, isCustomError } from '@ditsmod/core/errors';

import { HttpErrorHandler } from './http-error-handler.js';
import { RequestContext } from './request-context.js';

@injectable()
export class DefaultHttpErrorHandler implements HttpErrorHandler {
  constructor(protected logger: Logger) {}

  async handleError(err: Error, ctx: RequestContext) {
    const errObj = { requestId: ctx.requestId, err };
    if (isCustomError(err)) {
      const { level, status } = err.info;
      if (err.info.msg2) {
        this.logMsg2(err, ctx.requestId);
      } else {
        this.logger.log(level || 'debug', errObj);
      }
      ctx.rawRes.statusCode = status || HttpStatus.INTERNAL_SERVER_ERROR;
      this.sendError(err.message, ctx, ctx.requestId, err.code);
    } else {
      this.logger.log('error', errObj);
      const msg = err.message || 'Internal server error';
      ctx.rawRes.statusCode = (err as any).status || HttpStatus.INTERNAL_SERVER_ERROR;
      this.sendError(msg, ctx, ctx.requestId);
    }
  }

  protected logMsg2(err: CustomError, requestId: string) {
    this.logger.log(err.info.level || 'debug', `Error: ${err.info.msg2}\nrequestId: ${requestId}\n${err.stack}`);
  }

  protected sendError(error: string, ctx: RequestContext, requestId: string, code?: string) {
    if (!ctx.rawRes.headersSent) {
      this.addRequestIdToHeader(requestId, ctx);
      if (code && code != 'CustomError') {
        ctx.sendJson({ error, code });
      } else {
        ctx.sendJson({ error });
      }
    }
  }

  protected addRequestIdToHeader(requestId: string, ctx: RequestContext) {
    ctx.rawRes.setHeader('x-requestId', requestId);
  }
}
