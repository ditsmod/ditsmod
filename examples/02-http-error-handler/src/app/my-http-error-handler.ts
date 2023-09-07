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
  Req,
} from '@ditsmod/core';

@injectable()
export class MyHttpErrorHandler implements HttpErrorHandler {
  constructor(
    @inject(NODE_RES) private nodeRes: NodeResponse,
    protected req: Req,
    private res: Res,
    private logger: Logger,
  ) {}

  handleError(err: Error) {
    cleanErrorTrace(err);
    const message = err.message;
    this.logger.log('error', { note: 'This is my implementation of HttpErrorHandler', err });
    if (!this.nodeRes.headersSent) {
      this.addRequestIdToHeader();
      this.res.sendJson({ error: { message } }, Status.INTERNAL_SERVER_ERROR);
    }
  }

  protected addRequestIdToHeader() {
    const header = 'x-requestId';
    this.nodeRes.setHeader(header, this.req.requestId);
  }
}
