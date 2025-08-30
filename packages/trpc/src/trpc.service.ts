import {
  AnyFn,
  AnyObj,
  getDebugClassName,
  getModule,
  inject,
  injectable,
  Injector,
  ModRefId,
  ModuleManager,
  Override,
} from '@ditsmod/core';
import { CreateRouterOptions } from '@trpc/server/unstable-core-do-not-import';

import { TRPC_OPTS, TRPC_ROOT } from './constants.js';
import { TrpcOpts, TrpcRootObject, ModuleWithTrpcRoutes } from './types.js';
import { PreRouter } from './pre-router.js';
import { isModuleWithTrpcRoutes } from './type.guards.js';

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
  setOptionsAndGetAppRouter<T extends readonly ModRefId<ModuleWithTrpcRoutes>[]>(
    options: Override<TrpcOpts, { router?: never }> & {
      modulesWithTrpcRoutes: T;
    },
  ) {
    const allRouters = options.modulesWithTrpcRoutes.map((modRefId) => {
      return this.t.router(this.getModuleTrpcConfigs(modRefId));
    });
    const opts = { ...options } as unknown as TrpcOpts;
    delete (opts as any).modulesWithTrpc;
    opts.router = this.t.mergeRouters(...allRouters);
    this.injector.parent!.setByToken(TRPC_OPTS, opts);
    this.preRouter.setTrpcRequestListener();
  }

  getModuleConfig<T extends ModuleWithTrpcRoutes<any>>(modRefId: ModRefId<T>) {
    return this.moduleManager.getInstanceOf(modRefId).getRouterConfig();
  }

  protected getModuleTrpcConfigs(modRefId: ModRefId<ModuleWithTrpcRoutes>) {
    const baseMeta = this.moduleManager.getBaseMeta(modRefId, true);
    if (!isModuleWithTrpcRoutes(modRefId)) {
      throw new TypeError(`${baseMeta.name} does not respect ModuleWithTrpcRoutes`);
    }

    const importedModulesWithTrpcRoutes = new Map<AnyFn, ModRefId<ModuleWithTrpcRoutes>>();
    (baseMeta.importsModules as ModRefId[]).concat(baseMeta.importsWithParams).forEach((imp) => {
      if (isModuleWithTrpcRoutes(imp)) {
        // Method as key in the map
        importedModulesWithTrpcRoutes.set(getModule(imp).prototype.getRouterConfig, imp);
      }
    });

    const config = this.getModuleConfig(modRefId);
    return this.transformToTrpcConfig(modRefId, config, importedModulesWithTrpcRoutes);
  }

  protected transformToTrpcConfig<T extends AnyObj>(
    currentModRefId: ModRefId,
    config: T,
    importedModulesWithTrpcRoutes: Map<AnyFn, ModRefId<ModuleWithTrpcRoutes>>,
  ): CreateRouterOptions {
    const trpcRouterConfig = {} as CreateRouterOptions;

    Object.keys(config).forEach((prop) => {
      const val = config[prop];
      if (typeof val == 'function') {
        const importedModRefId = importedModulesWithTrpcRoutes.get(val);
        if (importedModRefId) {
          // Case with `{ property: ModuleClass.prototype.getRouterConfig }`
          trpcRouterConfig[prop] = this.getModuleTrpcConfigs(importedModRefId);
        } else {
          // Case with `{ property: ControllerClass.prototype.someMethod }`
          const injectorPerMod = this.moduleManager.getInjectorPerMod(currentModRefId);
          trpcRouterConfig[prop] = injectorPerMod.get(val);
        }
      } else {
        // Case with `{ property: nestedObject }`
        trpcRouterConfig[prop] = this.transformToTrpcConfig(currentModRefId, val, importedModulesWithTrpcRoutes);
      }
    });

    return trpcRouterConfig;
  }
}
