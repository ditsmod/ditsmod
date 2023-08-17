import { fromSelf, inject, injectable } from '../di';
import { ControllerErrorHandler } from '../services/controller-error-handler';
import { Logger } from '../types/logger';
import { Status } from '../utils/http-status-codes';
import { ErrorOpts } from '../custom-error/error-opts';
import { isChainError } from '../utils/type-guards';
import { Res } from './response';
import { Req } from './request';
import { NodeResponse } from '../types/server-options';
import { NODE_RES } from '../constans';

@injectable()
export class DefaultControllerErrorHandler implements ControllerErrorHandler {
  constructor(
    protected logger: Logger,
    @fromSelf() protected res: Res,
    @fromSelf() protected req: Req,
    @fromSelf() @inject(NODE_RES) protected nodeRes: NodeResponse
  ) {}

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
