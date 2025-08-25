import { inject, injectable, Injector, Override } from '@ditsmod/core';
import { CreateRouterOptions } from '@trpc/server/unstable-core-do-not-import';

import { TRPC_OPTS, TRPC_ROOT } from './constants.js';
import { TrcpOpts, TrcpRootObject } from './types.js';
import { PreRouter } from './pre-router.js';

@injectable()
export class TrpcService {
  constructor(
    protected injector: Injector,
    protected preRouter: PreRouter,
    @inject(TRPC_ROOT) protected t: TrcpRootObject<any>,
  ) {}

  /**
   * Passes tRPC options to DI, creates a tRPC router, and returns it.
   *
   * @param options Options for creating
   * an [HTTP handler](https://trpc.io/docs/server/adapters/standalone#adding-a-handler-to-an-custom-http-server).
   */
  setOptionsAndGetAppRouter<T extends CreateRouterOptions>(
    options: Override<TrcpOpts, { router?: never }> & { routerConfig: T },
  ) {
    const router = this.t.router(options.routerConfig);
    const opts = { ...options } as unknown as TrcpOpts;
    opts.router = router;
    this.injector.setByToken(TRPC_OPTS, opts);
    this.preRouter.setTrpcRequestListener();
    return router;
  }
}
