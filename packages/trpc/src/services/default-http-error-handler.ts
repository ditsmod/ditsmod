import { injectable, Logger, isCustomError, Status, CustomError } from '@ditsmod/core';
import { randomUUID } from 'node:crypto';

import { HttpErrorHandler } from './http-error-handler.js';
import { TrpcOpts } from '#types/constants.js';

@injectable()
export class DefaultHttpErrorHandler implements HttpErrorHandler {
  constructor(protected logger: Logger) {}

  async handleError(err: Error, opts: TrpcOpts) {
    const requestId = randomUUID();
    const errObj = { requestId, err };
    if (isCustomError(err)) {
      const { level, status } = err.info;
      if (err.info.msg2) {
        this.logMsg2(err, requestId);
      } else {
        this.logger.log(level || 'debug', errObj);
      }
      opts.ctx.res.statusCode = status || Status.INTERNAL_SERVER_ERROR;
      this.sendError(err.message, opts, requestId, err.code);
    } else {
      this.logger.log('error', errObj);
      const msg = err.message || 'Internal server error';
      opts.ctx.res.statusCode = (err as any).status || Status.INTERNAL_SERVER_ERROR;
      this.sendError(msg, opts, requestId);
    }
  }

  protected logMsg2(err: CustomError, requestId: string) {
    this.logger.log(err.info.level || 'debug', `Error: ${err.info.msg2}\nrequestId: ${requestId}\n${err.stack}`);
  }

  protected sendError(error: string, opts: TrpcOpts, requestId: string, code?: string) {
    if (!opts.ctx.res.headersSent) {
      this.addRequestIdToHeader(requestId, opts);
      if (code && code != 'CustomError') {
        opts.ctx.res.end(JSON.stringify({ error, code }));
      } else {
        opts.ctx.res.end(JSON.stringify({ error }));
      }
    }
  }

  protected addRequestIdToHeader(requestId: string, opts: TrpcOpts) {
    opts.ctx.res.setHeader('x-requestId', requestId);
  }
}
