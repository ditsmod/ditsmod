import {
  AnyFn,
  AnyObj,
  BaseMeta,
  getModule,
  inject,
  injectable,
  ModRefId,
  ModuleManager,
} from '@ditsmod/core';

import { TRPC_ROUTER_OPTS, TRPC_ROOT } from '#types/constants.js';
import {
  TrpcRouterOpts,
  TrpcRootObject,
  ModuleWithTrpcRoutes,
  RouterOptions,
  TrpcRootModule,
} from '#types/types.js';
import { PreRouter } from './pre-router.js';
import { isModuleWithTrpcRoutes } from '#utils/type.guards.js';
import { TrpcService } from '#services/trpc.service.js';

@injectable()
export class TrpcInternalService {
  constructor(
    protected preRouter: PreRouter,
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
  setTrpcRouter(baseMeta: BaseMeta) {
    const injectorPerMod = this.moduleManager.getInjectorPerMod('root', true);
    const injectorPerApp = injectorPerMod.parent!;
    const mod = injectorPerMod.get(baseMeta.modRefId) as Partial<TrpcRootModule>;
    const routerOpts = mod.setAppRouter?.() || {};
    (routerOpts as TrpcRouterOpts).router = this.t.mergeRouters(...this.getRouters());
    injectorPerApp.setByToken(TRPC_ROUTER_OPTS, routerOpts);
    this.preRouter.setTrpcRequestListener();
  }

  protected getRouters() {
    const rootBaseMeta = this.moduleManager.getBaseMeta('root', true);
    const modulesWithTrpcRoutes = (rootBaseMeta.importsModules as ModRefId[]).concat(rootBaseMeta.importsWithParams);
    return modulesWithTrpcRoutes.filter(isModuleWithTrpcRoutes).map((modRefId) => {
      return this.t.router(this.getModuleTrpcConfigs(modRefId));
    });
  }

  protected getModuleTrpcConfigs(modRefId: ModRefId<ModuleWithTrpcRoutes>) {
    const baseMeta = this.moduleManager.getBaseMeta(modRefId, true);
    const importedModulesWithTrpcRoutes = new Map<AnyFn, ModRefId<ModuleWithTrpcRoutes>>();
    (baseMeta.importsModules as ModRefId[]).concat(baseMeta.importsWithParams).forEach((imp) => {
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
