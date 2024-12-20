import { DefaultHttpErrorHandler, injectable, Logger, RequestContext } from '@ditsmod/core';
import { ErrorContainer } from './error-container.js';

@injectable()
export class CustomHttpErrorHandler extends DefaultHttpErrorHandler {
  constructor(
    protected override logger: Logger,
    private errorContainer: ErrorContainer,
  ) {
    super(logger);
  }

  override async handleError(err: Error, ctx: RequestContext) {
    await super.handleError(err, ctx);
    this.errorContainer.setError(err.message, err.stack);
  }
}
