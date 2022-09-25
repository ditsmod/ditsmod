import { Injectable } from '@ts-stack/di';

import { Req } from '../services/request';
import { ControllerErrorHandler } from '../services/controller-error-handler';
import { Res } from '../services/response';
import { Logger } from '../types/logger';
import { Status } from '../utils/http-status-codes';
import { ErrorOpts } from '../custom-error/error-opts';
import { isChainError } from '../utils/type-guards';


@Injectable()
export class DefaultControllerErrorHandler implements ControllerErrorHandler {
  constructor(private req: Req, private res: Res, private logger: Logger) {}

  async handleError(err: Error) {
    if (isChainError<ErrorOpts>(err)) {
      const { level, status } = err.info;
      this.logger.log(level || 'debug', err.message);
      this.sendError(err.message, status);
    } else {
      this.logger.error(err.message);
      this.sendError('Internal server error', Status.INTERNAL_SERVER_ERROR);
    }
  }

  protected sendError(error: string, status?: Status) {
    if (!this.res.nodeRes.headersSent) {
      this.addRequestIdToHeader();
      this.res.sendJson({ error }, status);
    }
  }

  protected addRequestIdToHeader() {
    const header = 'x-requestId';
    this.res.nodeRes.setHeader(header, this.req.requestId);
  }
}
