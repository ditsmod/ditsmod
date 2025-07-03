import { injectable, Logger } from '@ditsmod/core';
import { DefaultHttpErrorHandler, RequestContext } from '@ditsmod/rest';

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
