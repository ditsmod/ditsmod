import { injectable } from '#di';
import { RequestContext } from '#types/http-interceptor.js';
import { Logger } from '#logger/logger.js';
import { NodeResponse } from '#types/server-options.js';
import { cleanErrorTrace } from '#utils/clean-error-trace.js';
import { Status } from '#utils/http-status-codes.js';
import { isChainError } from '#utils/type-guards.js';
import { ErrorOpts } from '#error/error-opts.js';
import { HttpErrorHandler } from '#error/http-error-handler.js';
import { Req } from '#services/request.js';
import { Res } from '#services/response.js';

@injectable()
export class DefaultHttpErrorHandler implements HttpErrorHandler {
  protected nodeRes: NodeResponse;

  constructor(
    protected logger: Logger,
    protected res: Res,
    protected req: Req,
  ) {}

  async handleError(err: Error, ctx: RequestContext) {
    cleanErrorTrace(err);
    const errObj = { requestId: this.req.requestId, err };
    this.nodeRes = ctx.nodeRes;
    if (isChainError<ErrorOpts>(err)) {
      const { level, status } = err.info;
      this.logger.log(level || 'debug', errObj);
      this.sendError(err.message, status);
    } else {
      this.logger.log('error', errObj);
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
