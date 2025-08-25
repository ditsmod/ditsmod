import { inject, injectable, Injector } from '@ditsmod/core';
import { AnyRouter } from '@trpc/server';
import { NodeHTTPCreateContextFn, NodeHTTPRequest, NodeHTTPResponse } from '@trpc/server/adapters/node-http';
import { CreateRouterOptions } from '@trpc/server/unstable-core-do-not-import';

import { TRPC_OPTS, TRPC_ROOT } from './constants.js';
import { TrcpOpts, TrcpRootObject } from './types.js';
import { PreRouter } from './pre-router.js';

@injectable()
export class TrpcService {
  constructor(
    private injectorPerMod: Injector,
    private preRouter: PreRouter,
    @inject(TRPC_ROOT) private t: TrcpRootObject<any>,
  ) {}

  /**
   * Passes tRPC options to DI, creates a tRPC router, and returns it.
   *
   * @param routerConfig The configuration that will be passed to the tRPC router is `t.router(routerConfig)`.
   * @param createContext Function for creating tRPC context.
   */
  setOptsAndGetAppRouter<T extends CreateRouterOptions>(
    routerConfig: T,
    createContext?: NodeHTTPCreateContextFn<AnyRouter, NodeHTTPRequest, NodeHTTPResponse>,
  ) {
    const router = this.t.router(routerConfig);
    const injectorPerApp = this.injectorPerMod.parent!;
    injectorPerApp.setByToken(TRPC_OPTS, { router, createContext } satisfies TrcpOpts);
    this.preRouter.setTrpcRequestListener();
    return router;
  }
}
