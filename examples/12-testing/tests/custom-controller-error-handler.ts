import {
  Status,
  DefaultControllerErrorHandler,
  injectable,
  Res,
  NodeResponse,
  inject,
  NODE_RES,
  DiError,
  Logger,
  Req,
} from '@ditsmod/core';

import { ErrorContainer } from './error-container';

@injectable()
export class CustomControllerErrorHandler extends DefaultControllerErrorHandler {
  constructor(
    protected override logger: Logger,
    protected override res: Res,
    protected override req: Req,
    @inject(NODE_RES) protected override nodeRes: NodeResponse,
    private errorContainer: ErrorContainer
  ) {
    super(logger, res, req, nodeRes);
  }

  override async handleError(err: Error) {
    await super.handleError(err);
    this.errorContainer.setError(err.message, err.stack);
  }
}
