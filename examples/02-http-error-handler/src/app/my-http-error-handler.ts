import { Logger, Status, HttpErrorHandler, injectable, Req, RequestContext } from '@ditsmod/core';

@injectable()
export class MyHttpErrorHandler implements HttpErrorHandler {
  constructor(
    protected req: Req,
    private logger: Logger,
  ) {}

  handleError(err: Error, { nodeRes }: RequestContext) {
    const message = err.message;
    this.logger.log('error', { note: 'This is my implementation of HttpErrorHandler', err });
    if (!nodeRes.headersSent) {
      nodeRes.statusCode = Status.INTERNAL_SERVER_ERROR;
      nodeRes.setHeader('x-requestId', this.req.requestId);
      nodeRes.setHeader('Content-Type', 'application/json; charset=utf-8');
      nodeRes.end(JSON.stringify({ error: { message } }));
    }
  }
}
