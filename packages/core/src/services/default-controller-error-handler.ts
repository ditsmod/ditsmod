import { Injectable } from '@ts-stack/di';

import { ControllerErrorHandler } from '../services/controller-error-handler';
import { Status } from '../utils/http-status-codes';
import { Log } from './log';
import { Response } from './response';

@Injectable()
export class DefaultControllerErrorHandler implements ControllerErrorHandler {
  constructor(private res: Response, private log: Log) {}

  handleError(err: Error) {
    const { message } = err;
    this.log.controllerHasError('error', err);
    if (!this.res.nodeRes.headersSent) {
      this.res.sendJson({ error: { message } }, Status.INTERNAL_SERVER_ERROR);
    }
  }
}
