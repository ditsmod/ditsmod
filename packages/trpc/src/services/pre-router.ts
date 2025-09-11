import { injectable, Injector } from '@ditsmod/core';
import { createHTTPHandler } from '@trpc/server/adapters/standalone';

import { TRPC_ROUTER_OPTS } from '#types/constants.js';
import { RequestListener } from '#types/types.js';

@injectable()
export class TrpcPreRouter {
  requestListener: RequestListener;

  constructor(protected injectorPerApp: Injector) {}

  setTrpcRequestListener() {
    const opts = this.injectorPerApp.get(TRPC_ROUTER_OPTS);
    this.requestListener = createHTTPHandler(opts) as RequestListener;
  }
}
