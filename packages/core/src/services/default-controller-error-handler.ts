import { Injectable } from '@ts-stack/di';

import { ControllerErrorHandler } from '../services/controller-error-handler';
import { Status } from '../utils/http-status-codes';
import { LogMediator } from './log-mediator';
import { Res } from './response';

@Injectable()
export class DefaultControllerErrorHandler implements ControllerErrorHandler {
  constructor(private res: Res, private logMediator: LogMediator) {}

  handleError(err: Error) {
    const { message } = err;
    this.logMediator.controllerHasError(this, err);
    if (!this.res.nodeRes.headersSent) {
      this.res.sendJson({ error: { message } }, Status.INTERNAL_SERVER_ERROR);
    }
  }
}
