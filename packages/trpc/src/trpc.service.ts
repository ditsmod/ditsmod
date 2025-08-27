import { inject, injectable, Injector, ModRefId, ModuleManager, Override } from '@ditsmod/core';

import { TRPC_OPTS, TRPC_ROOT } from './constants.js';
import { TrpcOpts, TrpcRootObject } from './types.js';
import { PreRouter } from './pre-router.js';
import { TrpcModuleWithRouterConfig } from './utils.js';

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
  setOptionsAndGetAppRouter<T>(opts: Override<TrpcOpts, { router: T }>) {
    this.injector.setByToken(TRPC_OPTS, opts);
    this.preRouter.setTrpcRequestListener();
    return opts.router;
  }
  /**
   * @param modRefIds List of modules with tRPC routers.
   */
  mergeModuleRouters<const T extends readonly ModRefId<TrpcModuleWithRouterConfig<any>>[]>(modRefIds: T) {
    type RouterOf<I> =
      I extends ModRefId<TrpcModuleWithRouterConfig<infer C>> ? ReturnType<typeof this.t.router<C>> : never;
    type RoutersTuple = { [K in keyof T]: RouterOf<T[K]> };
    type Mutable<T> = { -readonly [K in keyof T]: T[K] };

    const routers = modRefIds.map((id) => this.t.router(this.getRouterConfig(id))) as unknown as Mutable<RoutersTuple>;
    return this.t.mergeRouters(...routers);
  }

  protected getRouterConfig<
    T extends TrpcModuleWithRouterConfig<any>,
    C = T extends TrpcModuleWithRouterConfig<infer U> ? U : never,
  >(modRefId: ModRefId<T>): C {
    return (this.moduleManager.getInjectorPerMod(modRefId).get(modRefId) as T).getRouterConfig();
  }

  protected getRouters<T extends readonly ModRefId<TrpcModuleWithRouterConfig<any>>[]>(
    modRefIds: T,
  ): {
    [K in keyof T]: T[K] extends ModRefId<TrpcModuleWithRouterConfig<infer C>>
      ? ReturnType<typeof this.t.router<C>>
      : never;
  } {
    return modRefIds.map((modRefId) => this.t.router(this.getRouterConfig(modRefId))) as any;
  }
}
