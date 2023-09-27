import {
  Logger,
  Status,
  HttpErrorHandler,
  injectable,
  Res,
  cleanErrorTrace,
  Req,
  InterceptorContext,
} from '@ditsmod/core';

@injectable()
export class MyHttpErrorHandler implements HttpErrorHandler {
  constructor(
    protected req: Req,
    private res: Res,
    private logger: Logger,
  ) {}

  handleError(err: Error, ctx: InterceptorContext) {
    cleanErrorTrace(err);
    const message = err.message;
    this.logger.log('error', { note: 'This is my implementation of HttpErrorHandler', err });
    if (!ctx.nodeRes.headersSent) {
      this.addRequestIdToHeader(ctx);
      this.res.sendJson({ error: { message } }, Status.INTERNAL_SERVER_ERROR);
    }
  }

  protected addRequestIdToHeader(ctx: InterceptorContext) {
    const header = 'x-requestId';
    ctx.nodeRes.setHeader(header, this.req.requestId);
  }
}
