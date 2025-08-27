import { inject, injectable, Injector, ModRefId, ModuleManager, Override } from '@ditsmod/core';

import { TRPC_OPTS, TRPC_ROOT } from './constants.js';
import { TrpcOpts, TrpcRootObject } from './types.js';
import { PreRouter } from './pre-router.js';
import { ModuleWithTrpcRoutes } from './utils.js';

@injectable()
export class TrpcService {
  constructor(
    protected injector: Injector,
    protected preRouter: PreRouter,
    protected moduleManager: ModuleManager,
    @inject(TRPC_ROOT) protected t: TrpcRootObject<any>,
  ) {}

  /**
   * Passes tRPC options to DI, creates a tRPC router, and returns it.
   *
   * @param options Options for creating
   * an [HTTP handler](https://trpc.io/docs/server/adapters/standalone#adding-a-handler-to-an-custom-http-server).
   */
  setOptionsAndGetAppRouter<T extends readonly ModRefId<ModuleWithTrpcRoutes<any>>[]>(
    options: Override<TrpcOpts, { router?: never }> & {
      modulesWithTrpcRoutes: T;
    },
  ) {
    const router = this.mergeModuleRouters<T>(options.modulesWithTrpcRoutes);
    const opts = { ...options } as unknown as TrpcOpts;
    delete (opts as any).modulesWithTrpc;
    opts.router = router;
    this.injector.setByToken(TRPC_OPTS, opts);
    this.preRouter.setTrpcRequestListener();
    return router;
  }

  /**
   * @param modRefIds List of modules with tRPC routers.
   */
  protected mergeModuleRouters<const T extends readonly ModRefId<ModuleWithTrpcRoutes<any>>[]>(modRefIds: T) {
    type RouterOf<I> =
      I extends ModRefId<ModuleWithTrpcRoutes<infer C>> ? ReturnType<typeof this.t.router<C>> : never;
    type RoutersTuple = { [K in keyof T]: RouterOf<T[K]> };
    type Mutable<T> = { -readonly [K in keyof T]: T[K] };

    const routers = modRefIds.map((id) => this.t.router(this.getRouterConfig(id))) as unknown as Mutable<RoutersTuple>;
    return this.t.mergeRouters(...routers);
  }

  protected getRouterConfig<
    T extends ModuleWithTrpcRoutes<any>,
    C = T extends ModuleWithTrpcRoutes<infer U> ? U : never,
  >(modRefId: ModRefId<T>): C {
    return (this.moduleManager.getInjectorPerMod(modRefId).get(modRefId) as T).getRouterConfig();
  }
}
