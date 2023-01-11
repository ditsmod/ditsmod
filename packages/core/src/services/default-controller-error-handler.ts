import { injectable } from '../di';

import { ControllerErrorHandler } from '../services/controller-error-handler';
import { Logger } from '../types/logger';
import { Status } from '../utils/http-status-codes';
import { ErrorOpts } from '../custom-error/error-opts';
import { isChainError } from '../utils/type-guards';
import { RequestContext } from '../types/route-data';
import { Res } from './response';
import { Req } from './request';


@injectable()
export class DefaultControllerErrorHandler implements ControllerErrorHandler {
  constructor(private logger: Logger, private ctx: RequestContext, private res: Res, private req: Req) {}

  async handleError(err: Error) {
    if (isChainError<ErrorOpts>(err)) {
      const { level, status } = err.info;
      this.logger.log(level || 'debug', err);
      this.sendError(err.message, status);
    } else {
      this.logger.error(err);
      this.sendError('Internal server error', Status.INTERNAL_SERVER_ERROR);
    }
  }

  protected sendError(error: string, status?: Status) {
    if (!this.ctx.nodeRes.headersSent) {
      this.addRequestIdToHeader();
      this.res.sendJson({ error }, status);
    }
  }

  protected addRequestIdToHeader() {
    const header = 'x-requestId';
    this.ctx.nodeRes.setHeader(header, this.req.requestId);
  }
}
