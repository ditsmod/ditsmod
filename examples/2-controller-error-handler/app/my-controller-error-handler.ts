import { Injectable } from '@ts-stack/di';
import { Logger, Status, Response, ControllerErrorHandler } from '@ts-stack/ditsmod';

@Injectable()
export class MyControllerErrorHandler implements ControllerErrorHandler {
  constructor(private res: Response, private log: Logger) {}

  handleError(err: Error) {
    const message = err.message;
    this.log.error({ note: 'This is my implementation of ControllerErrorHandler', err });
    if (!this.res.nodeRes.headersSent) {
      this.res.sendJson({ error: { message } }, Status.INTERNAL_SERVER_ERROR);
    }
  }
}
