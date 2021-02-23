import { Injectable } from '@ts-stack/di';
import { Logger } from '../types/logger';
import { Status } from '../utils/http-status-codes';
import { Response } from '../services/response';
import { ControllerErrorHandler } from '../types/types';

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
