import { Logger, Status, ControllerErrorHandler, injectable, RequestContext, Res } from '@ditsmod/core';

@injectable()
export class MyControllerErrorHandler implements ControllerErrorHandler {
  constructor(private ctx: RequestContext, private res: Res, private logger: Logger) {}

  handleError(err: Error) {
    const message = err.message;
    this.logger.error({ note: 'This is my implementation of ControllerErrorHandler', err });
    if (!this.ctx.nodeRes.headersSent) {
      this.res.sendJson({ error: { message } }, Status.INTERNAL_SERVER_ERROR);
    }
  }
}
