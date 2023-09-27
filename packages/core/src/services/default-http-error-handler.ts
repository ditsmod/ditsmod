import { injectable } from '#di';
import { RequestContext } from '#types/http-interceptor.js';
import { Logger } from '#types/logger.js';
import { NodeResponse } from '#types/server-options.js';
import { Status } from '#utils/http-status-codes.js';
import { isChainError } from '#utils/type-guards.js';
import { ErrorOpts } from '../custom-error/error-opts.js';
import { HttpErrorHandler } from './http-error-handler.js';
import { Req } from './request.js';
import { Res } from './response.js';

@injectable()
export class DefaultHttpErrorHandler implements HttpErrorHandler {
  protected nodeRes: NodeResponse;

  constructor(
    protected logger: Logger,
    protected res: Res,
    protected req: Req,
  ) {}

  async handleError(err: Error, ctx: RequestContext) {
    this.nodeRes = ctx.nodeRes;
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
    this.nodeRes.setHeader('x-requestId', this.req.requestId);
  }
}
