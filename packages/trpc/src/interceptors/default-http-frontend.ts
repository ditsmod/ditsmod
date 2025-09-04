import { injectable, Injector } from '@ditsmod/core';

import { DefaultCtxHttpFrontend } from './default-ctx-http-frontend.js';
import { RequestContext } from '#services/request-context.js';

@injectable()
export class DefaultHttpFrontend extends DefaultCtxHttpFrontend {
  constructor(private injector: Injector) {
    super();
  }

  override before(ctx: RequestContext) {
    return this;
  }
}
