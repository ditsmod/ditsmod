import {
  Logger,
  Status,
  HttpErrorHandler,
  injectable,
  Res,
  NodeResponse,
  inject,
  NODE_RES,
  cleanErrorTrace,
} from '@ditsmod/core';

@injectable()
export class MyHttpErrorHandler implements HttpErrorHandler {
  constructor(
    @inject(NODE_RES) private nodeRes: NodeResponse,
    private res: Res,
    private logger: Logger,
  ) {}

  handleError(err: Error) {
    cleanErrorTrace(err);
    const message = err.message;
    this.logger.error({ note: 'This is my implementation of HttpErrorHandler', err });
    if (!this.nodeRes.headersSent) {
      this.res.sendJson({ error: { message } }, Status.INTERNAL_SERVER_ERROR);
    }
  }
}
