import { injectable } from '../di';

import { ControllerErrorHandler } from '../services/controller-error-handler';
import { Logger } from '../types/logger';
import { Status } from '../utils/http-status-codes';
import { ErrorOpts } from '../custom-error/error-opts';
import { isChainError } from '../utils/type-guards';
import { RequestContext } from '../types/route-data';


@injectable()
export class DefaultControllerErrorHandler implements ControllerErrorHandler {
  constructor(private logger: Logger) {}

  async handleError(ctx: RequestContext, err: Error) {
    if (isChainError<ErrorOpts>(err)) {
      const { level, status } = err.info;
      this.logger.log(level || 'debug', err);
      this.sendError(ctx, err.message, status);
    } else {
      this.logger.error(err);
      this.sendError(ctx, 'Internal server error', Status.INTERNAL_SERVER_ERROR);
    }
  }

  protected sendError(ctx: RequestContext, error: string, status?: Status) {
    if (!ctx.res.nodeRes.headersSent) {
      this.addRequestIdToHeader(ctx);
      ctx.res.sendJson({ error }, status);
    }
  }

  protected addRequestIdToHeader(ctx: RequestContext) {
    const header = 'x-requestId';
    ctx.res.nodeRes.setHeader(header, ctx.req.requestId);
  }
}
