import { Logger, Status, ControllerErrorHandler, injectable, RequestContext } from '@ditsmod/core';

@injectable()
export class MyControllerErrorHandler implements ControllerErrorHandler {
  constructor(private logger: Logger) {}

  handleError(ctx: RequestContext, err: Error) {
    const message = err.message;
    this.logger.error({ note: 'This is my implementation of ControllerErrorHandler', err });
    if (!ctx.res.nodeRes.headersSent) {
      ctx.res.sendJson({ error: { message } }, Status.INTERNAL_SERVER_ERROR);
    }
  }
}
