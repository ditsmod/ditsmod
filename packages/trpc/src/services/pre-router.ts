import { injectable, Injector } from '@ditsmod/core';
import { createHTTPHandler } from '@trpc/server/adapters/standalone';
import { RequestListener, TrpcRouterOpts } from '#types/types.js';

@injectable()
export class TrpcPreRouter {
  requestListener: RequestListener;

  constructor(protected injectorPerApp: Injector) {}

  setTrpcRequestListener(opts: TrpcRouterOpts) {
    this.requestListener = createHTTPHandler(opts) as RequestListener;
  }
}
