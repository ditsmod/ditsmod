import { Injectable } from '@ts-stack/di';
import { Logger, Status, Res, ControllerErrorHandler } from '@ditsmod/core';

@Injectable()
export class MyControllerErrorHandler implements ControllerErrorHandler {
  constructor(private res: Res, private logger: Logger) {}

  handleError(err: Error) {
    const message = err.message;
    this.logger.error({ note: 'This is my implementation of ControllerErrorHandler', err });
    if (!this.res.nodeRes.headersSent) {
      this.res.sendJson({ error: { message } }, Status.INTERNAL_SERVER_ERROR);
    }
  }
}
