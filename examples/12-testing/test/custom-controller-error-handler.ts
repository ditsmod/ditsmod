import { DefaultHttpErrorHandler, injectable, Res, Logger, Req, RequestContext } from '@ditsmod/core';
import { ErrorContainer } from './error-container.js';

@injectable()
export class CustomHttpErrorHandler extends DefaultHttpErrorHandler {
  constructor(
    protected override logger: Logger,
    protected override res: Res,
    protected override req: Req,
    private errorContainer: ErrorContainer,
  ) {
    super(logger, res, req);
  }

  override async handleError(err: Error, ctx: RequestContext) {
    await super.handleError(err, ctx);
    this.errorContainer.setError(err.message, err.stack);
  }
}
