import { Injectable } from '@ts-stack/di';
import { Logger, Status, Request, Response, ControllerErrorHandler } from '@ts-stack/ditsmod';

@Injectable()
export class ErrorHandler implements ControllerErrorHandler {
  constructor(private req: Request, private res: Response, private log: Logger) {}

  handleError(err: Error) {
    const req = this.req;
    const message = err.message;
    this.log.error({ err, req });
    if (!this.res.nodeRes.headersSent) {
      this.res.sendJson({ error: { message } }, Status.INTERNAL_SERVER_ERROR);
    }
  }
}
