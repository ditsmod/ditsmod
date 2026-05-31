import { injectable, Injector } from '@ditsmod/core';

import { RouteScopedDefaultTrpcHttpFrontend } from './default-ctx-http-frontend.js';
import { TrpcOpts } from '#types/types.js';

@injectable()
export class DefaultTrpcHttpFrontend extends RouteScopedDefaultTrpcHttpFrontend {
  constructor(private injector: Injector) {
    super();
  }

  override before(opts: TrpcOpts) {
    return this;
  }
}
