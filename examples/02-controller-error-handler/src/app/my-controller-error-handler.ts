import {
  Logger,
  Status,
  HttpErrorHandler,
  injectable,
  Res,
  NodeResponse,
  fromSelf,
  inject,
  NODE_RES,
} from '@ditsmod/core';

@injectable()
export class MyControllerErrorHandler implements HttpErrorHandler {
  constructor(@fromSelf() @inject(NODE_RES) private nodeRes: NodeResponse, private res: Res, private logger: Logger) {}

  handleError(err: Error) {
    const message = err.message;
    this.logger.error({ note: 'This is my implementation of HttpErrorHandler', err });
    if (!this.nodeRes.headersSent) {
      this.res.sendJson({ error: { message } }, Status.INTERNAL_SERVER_ERROR);
    }
  }
}
