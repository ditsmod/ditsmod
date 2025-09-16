import { injectable, Injector } from '@ditsmod/core';
import { createHTTPHandler } from '@trpc/server/adapters/standalone';
import { RequestListener, TrpcRouterOpts } from '#types/types.js';

@injectable()
export class TrpcPreRouter {
  trpcRouter: TrpcRouterOpts;

  requestListener: RequestListener;

  constructor(protected injectorPerApp: Injector) {}

  setTrpcRequestListener(trpcRouter: TrpcRouterOpts) {
    this.trpcRouter = trpcRouter;
    this.requestListener = createHTTPHandler(trpcRouter) as RequestListener;
  }
}
