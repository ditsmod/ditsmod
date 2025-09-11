import { injectable, Injector } from '@ditsmod/core';

import { DefaultCtxTrpcHttpFrontend } from './default-ctx-http-frontend.js';
import { TrpcOpts } from '#types/types.js';

@injectable()
export class DefaultTrpcHttpFrontend extends DefaultCtxTrpcHttpFrontend {
  constructor(private injector: Injector) {
    super();
  }

  override before(opts: TrpcOpts) {
    return this;
  }
}
