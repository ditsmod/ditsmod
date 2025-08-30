import { injectable, Injector } from '@ditsmod/core';
import { createHTTPHandler } from '@trpc/server/adapters/standalone';

import { TRPC_OPTS } from './constants.js';
import { RequestListener } from './types.js';

@injectable()
export class PreRouter {
  requestListener: RequestListener;

  constructor(protected injectorPerApp: Injector) {}

  setTrpcRequestListener() {
    const opts = this.injectorPerApp.get(TRPC_OPTS);
    this.requestListener = createHTTPHandler(opts) as RequestListener;
  }
}
