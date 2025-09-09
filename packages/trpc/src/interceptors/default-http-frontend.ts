import { injectable, Injector } from '@ditsmod/core';

import { DefaultCtxHttpFrontend } from './default-ctx-http-frontend.js';
import { TrpcOpts } from '#types/types.js';

@injectable()
export class DefaultHttpFrontend extends DefaultCtxHttpFrontend {
  constructor(private injector: Injector) {
    super();
  }

  override before(opts: TrpcOpts) {
    return this;
  }
}
