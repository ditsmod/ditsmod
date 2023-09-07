import { NODE_RES } from '#constans';
import { inject, injectable } from '#di';
import { Logger } from '#types/logger.js';
import { NodeResponse } from '#types/server-options.js';
import { cleanErrorTrace } from '#utils/clean-error-trace.js';
import { Status } from '#utils/http-status-codes.js';
import { isChainError } from '#utils/type-guards.js';
import { ErrorOpts } from '../custom-error/error-opts.js';
import { HttpErrorHandler } from './http-error-handler.js';
import { Req } from './request.js';
import { Res } from './response.js';

@injectable()
export class DefaultHttpErrorHandler implements HttpErrorHandler {
  constructor(
    protected logger: Logger,
    protected res: Res,
    protected req: Req,
    @inject(NODE_RES) protected nodeRes: NodeResponse,
  ) {}

  async handleError(err: Error) {
    cleanErrorTrace(err);
    if (isChainError<ErrorOpts>(err)) {
      const { level, status } = err.info;
      this.logger.log(level || 'debug', err);
      this.sendError(err.message, status);
    } else {
      this.logger.log('error', err);
      this.sendError('Internal server error', Status.INTERNAL_SERVER_ERROR);
    }
  }

  protected sendError(error: string, status?: Status) {
    if (!this.nodeRes.headersSent) {
      this.addRequestIdToHeader();
      this.res.sendJson({ error }, status);
    }
  }

  protected addRequestIdToHeader() {
    const header = 'x-requestId';
    this.nodeRes.setHeader(header, this.req.requestId);
  }
}
