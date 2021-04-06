import { Injectable } from '@ts-stack/di';

import { ControllerErrorHandler } from '../services/controller-error-handler';
import { Logger } from '../types/logger';
import { Status } from '../utils/http-status-codes';
import { Response } from './response';

@Injectable()
export class DefaultControllerErrorHandler implements ControllerErrorHandler {
  constructor(private res: Response, private log: Logger) {}

  handleError(err: Error) {
    const { message } = err;
    this.log.error({ err });
    if (!this.res.nodeRes.headersSent) {
      this.res.sendJson({ error: { message } }, Status.INTERNAL_SERVER_ERROR);
    }
  }
}
