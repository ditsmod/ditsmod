import {
  AnyFn,
  AnyObj,
  NormalizedModuleMeta,
  getModule,
  inject,
  injectable,
  ModRefId,
  ModuleManager,
  Context,
} from '@ditsmod/core';

import { TRPC_ROOT } from '#types/constants.js';
import { TrpcRouterOpts, TrpcRootObject, ModuleWithTrpcRoutes, RouterOptions, TrpcRootModule } from '#types/types.js';
import { TrpcPreRouter } from './pre-router.js';
import { isModuleWithTrpcRoutes } from '#utils/type.guards.js';
import { TrpcService } from '#services/trpc.service.js';

@injectable()
export class TrpcInternalService {
  constructor(
    protected preRouter: TrpcPreRouter,
    protected trpcService: TrpcService,
    protected moduleManager: ModuleManager,
    @inject(TRPC_ROOT) protected t: TrpcRootObject<any>,
  ) {}

  /**
   * Passes tRPC options to DI, and set a tRPC router.
   *
   * @param options Options for creating
   * an [HTTP handler](https://trpc.io/docs/server/adapters/standalone#adding-a-handler-to-an-custom-http-server).
   */
  setTrpcRouter(normalizedModuleMeta: NormalizedModuleMeta) {
    const injectorPerMod = this.moduleManager.getInjectorPerMod('root', true);
    const mod = injectorPerMod.get(normalizedModuleMeta.modRefId) as Partial<TrpcRootModule>;
    const routerOpts = (mod.setAppRouterOptions?.() || {}) as unknown as TrpcRouterOpts;
    routerOpts.router = this.t.mergeRouters(...this.getRouters());
    routerOpts.createContext = (opts) => opts;
    this.preRouter.setTrpcRequestListener(routerOpts);
  }

  protected getRouters() {
    const rootNormalizedModuleMeta = this.moduleManager.getNormalizedModuleMeta('root', true);
    const modulesWithTrpcRoutes = (rootNormalizedModuleMeta.importsModules as ModRefId[]).concat(rootNormalizedModuleMeta.importsWithParams);
    return modulesWithTrpcRoutes.filter(isModuleWithTrpcRoutes).map((modRefId) => {
      return this.t.router(this.getModuleTrpcConfigs(modRefId));
    });
  }

  protected getModuleTrpcConfigs(modRefId: ModRefId<ModuleWithTrpcRoutes>) {
    const normalizedModuleMeta = this.moduleManager.getNormalizedModuleMeta(modRefId, true);
    const importedModulesWithTrpcRoutes = new Map<AnyFn, ModRefId<ModuleWithTrpcRoutes>>();
    (normalizedModuleMeta.importsModules as ModRefId[]).concat(normalizedModuleMeta.importsWithParams).forEach((imp) => {
      if (isModuleWithTrpcRoutes(imp)) {
        // Method as key in the map
        importedModulesWithTrpcRoutes.set(getModule(imp).prototype.getRouterConfig, imp);
      }
    });

    const config = this.trpcService.getModuleConfig(modRefId);
    return this.transformToTrpcConfig(modRefId, config, importedModulesWithTrpcRoutes);
  }

  protected transformToTrpcConfig<T extends AnyObj>(
    currentModRefId: ModRefId,
    config: T,
    importedModulesWithTrpcRoutes: Map<AnyFn, ModRefId<ModuleWithTrpcRoutes>>,
  ): RouterOptions {
    const trpcRouterConfig = {} as RouterOptions;

    Object.keys(config).forEach((prop) => {
      const val = config[prop];
      if (typeof val == 'function') {
        const importedModRefId = importedModulesWithTrpcRoutes.get(val);
        if (importedModRefId) {
          // Case with `{ property: ModuleClass.prototype.getRouterConfig }`
          trpcRouterConfig[prop] = this.getModuleTrpcConfigs(importedModRefId);
        } else {
          // Case with `{ property: ControllerClass.prototype.someMethod }`
          const injectorPerMod = this.moduleManager.getInjectorPerMod(currentModRefId, true);
          const ctx = injectorPerMod.get(Context) as Context;
          trpcRouterConfig[prop] = ctx.get(val) as any;
        }
      } else {
        // Case with `{ property: nestedObject }`
        trpcRouterConfig[prop] = this.transformToTrpcConfig(currentModRefId, val, importedModulesWithTrpcRoutes);
      }
    });

    return trpcRouterConfig;
  }
}
