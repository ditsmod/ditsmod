import { inject, injectable, Injector } from '@ditsmod/core';
import { AnyRouter } from '@trpc/server';
import { NodeHTTPCreateContextFn, NodeHTTPRequest, NodeHTTPResponse } from '@trpc/server/adapters/node-http';
import { CreateRouterOptions } from '@trpc/server/unstable-core-do-not-import';

import { TRPC_OPTS, TRPC_ROOT } from './constants.js';
import { TrcpRootObject } from './types.js';
import { PreRouter } from './pre-router.js';

@injectable()
export class TrpcService {
  constructor(
    private injectorPerMod: Injector,
    private preRouter: PreRouter,
    @inject(TRPC_ROOT) private t: TrcpRootObject<any>,
  ) {}

  getAppRouter<T extends CreateRouterOptions>(
    buildRouter: T,
    createContext?: NodeHTTPCreateContextFn<AnyRouter, NodeHTTPRequest, NodeHTTPResponse>,
  ) {
    const router = this.t.router(buildRouter);
    const injectorPerApp = this.injectorPerMod.parent!;
    injectorPerApp.setByToken(TRPC_OPTS, {
      router,
      createContext,
    });

    this.preRouter.setTrpcRequestListener();
    return router;
  }
}
