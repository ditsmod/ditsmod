import { injectable, Logger, Status, type Context } from '@ditsmod/core';
import { CustomError, isCustomError } from '@ditsmod/core/errors';
import { randomUUID } from 'node:crypto';

import { HttpErrorHandler } from './http-error-handler.js';
import { RAW_RES } from '#types/constants.js';
import { Res } from './response.js';

@injectable()
export class DefaultHttpErrorHandler implements HttpErrorHandler {
  constructor(protected logger: Logger) {}

  async handleError(err: Error, ctx: Context) {
    const requestId = randomUUID();
    const errObj = { requestId, err };
    if (isCustomError(err)) {
      const { level, status } = err.info;
      if (err.info.msg2) {
        this.logMsg2(err, requestId);
      } else {
        this.logger.log(level || 'debug', errObj);
      }
      const rawRes = ctx.get(RAW_RES, true)!;
      rawRes.statusCode = status || Status.INTERNAL_SERVER_ERROR;
      this.sendError(err.message, ctx, requestId, err.code);
    } else {
      this.logger.log('error', errObj);
      const msg = err.message || 'Internal server error';
      const rawRes = ctx.get(RAW_RES, true)!;
      rawRes.statusCode = (err as any).status || Status.INTERNAL_SERVER_ERROR;
      this.sendError(msg, ctx, requestId);
    }
  }

  protected logMsg2(err: CustomError, requestId: string) {
    this.logger.log(err.info.level || 'debug', `Error: ${err.info.msg2}\nrequestId: ${requestId}\n${err.stack}`);
  }

  protected sendError(error: string, ctx: Context, requestId: string, code?: string) {
    if (!ctx.get(RAW_RES, true)!.headersSent) {
      this.addRequestIdToHeader(requestId, ctx);
      const res = ctx.get(Res, true)!;
      if (code && code != 'CustomError') {
        res.sendJson({ error, code });
      } else {
        res.sendJson({ error });
      }
    }
  }

  protected addRequestIdToHeader(requestId: string, ctx: Context) {
    ctx.get(RAW_RES, true)!.setHeader('x-requestId', requestId);
  }
}
