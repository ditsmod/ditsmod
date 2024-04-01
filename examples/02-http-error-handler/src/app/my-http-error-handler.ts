import { Logger, Status, HttpErrorHandler, injectable, Req, RequestContext, cleanErrorTrace } from '@ditsmod/core';

@injectable()
export class MyHttpErrorHandler implements HttpErrorHandler {
  constructor(
    protected req: Req,
    private logger: Logger,
  ) {}

  handleError(err: Error, ctx: RequestContext) {
    cleanErrorTrace(err);
    const message = err.message;
    this.logger.log('error', { note: 'This is my implementation of HttpErrorHandler', err });
    if (!ctx.nodeRes.headersSent) {
      const error = { error: { message } };
      const headers = { 'x-requestId': this.req.requestId };
      ctx.sendJson(error, Status.INTERNAL_SERVER_ERROR, headers);
    }
  }
}
