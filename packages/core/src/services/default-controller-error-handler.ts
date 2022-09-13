import { Injectable } from '@ts-stack/di';
import { ChainError } from '@ts-stack/chain-error';

import { Req } from '../services/request';
import { ControllerErrorHandler } from '../services/controller-error-handler';
import { Res } from '../services/response';
import { Logger } from '../types/logger';
import { Status } from '../utils/http-status-codes';
import { ErrorOpts } from '../custom-error/error-opts';


@Injectable()
export class DefaultControllerErrorHandler implements ControllerErrorHandler {
  constructor(private req: Req, private res: Res, private logger: Logger) {}

  async handleError(err: ChainError<ErrorOpts> | Error) {
    const req = this.req.toString();
    if (err instanceof ChainError) {
      const { level, status } = err.info;
      delete err.info.level;
      this.logger.log(level || 'debug', { err, ...err.info, req });
      if (!this.res.nodeRes.headersSent) {
        this.addRequestIdToHeader();
        this.res.sendJson({ error: err.message }, status);
      }
    } else {
      this.logger.error({ err, req });
      if (!this.res.nodeRes.headersSent) {
        this.addRequestIdToHeader();
        this.res.sendJson({ error: 'Internal server error' }, Status.INTERNAL_SERVER_ERROR);
      }
    }
  }

  protected addRequestIdToHeader() {
    const header = 'x-requestId';
    this.res.nodeRes.setHeader(header, this.req.requestId);
  }
}
