import { Injectable } from '@ts-stack/di';

import { ControllerErrorHandler } from '../services/controller-error-handler';
import { Status } from '../utils/http-status-codes';
import { LogMediator } from './log-mediator';
import { Response } from './response';

@Injectable()
export class DefaultControllerErrorHandler implements ControllerErrorHandler {
  constructor(private res: Response, private logMediator: LogMediator) {}

  handleError(err: Error) {
    const { message } = err;
    this.logMediator.controllerHasError('error', { className: this.constructor.name }, err);
    if (!this.res.nodeRes.headersSent) {
      this.res.sendJson({ error: { message } }, Status.INTERNAL_SERVER_ERROR);
    }
  }
}
