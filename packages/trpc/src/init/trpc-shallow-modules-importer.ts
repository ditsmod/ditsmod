import type { ModRefId, ModuleManager, NormalizedModuleMeta, AppProviders } from '@ditsmod/core';
import { isDynamicModule, getProxyForInitMeta } from '@ditsmod/core';

import type {
  ImportModulesShallowConfig,
  TrpcAppProviders,
  TrpcModRefId,
  TrpcShallowModuleImports,
} from '#decorators/trpc-init-hooks-and-metadata.js';
import { initTrpcModule, TrpcInitHooks, TrpcInitMeta } from '#decorators/trpc-init-hooks-and-metadata.js';
import type { ModuleScopedGuard } from '#interceptors/trpc-guard.js';

/**
 * Recursively collects providers taking into account module imports/exports,
 * but does not take provider dependencies into account.
 *
 * Also:
 * - exports app providers;
 * - merges app and local providers;
 * - checks on providers collisions.
 */
export class TrpcShallowModulesImporter {
  protected moduleName: string;
  protected guardsPerMod: ModuleScopedGuard[];
  protected normalizedModuleMeta: NormalizedModuleMeta;
  protected meta: TrpcInitMeta;

  /**
   * AppProviders.
   */
  protected glProviders: AppProviders;
  protected trpcGlProviders: TrpcAppProviders;
  protected shallowModuleImportsMap = new Map<ModRefId, TrpcShallowModuleImports>();
  protected unfinishedScanModules = new Set<ModRefId>();
  protected unfinishedExportModules = new Set<ModRefId>();
  protected moduleManager: ModuleManager;

  exportAppProviders({
    moduleManager,
    appProviders,
    normalizedModuleMeta,
  }: {
    moduleManager: ModuleManager;
    appProviders: AppProviders;
    normalizedModuleMeta: NormalizedModuleMeta;
  }): TrpcAppProviders {
    this.moduleManager = moduleManager;
    this.glProviders = appProviders;
    this.moduleName = normalizedModuleMeta.name;
    this.normalizedModuleMeta = normalizedModuleMeta;
    this.meta = this.getInitMeta(normalizedModuleMeta);

    return {
      initHooks: new TrpcInitHooks({}),
    };
  }

  /**
   * @param modRefId Module that will bootstrapped.
   */
  importModulesShallow({
    moduleManager,
    appProviders,
    modRefId,
    unfinishedScanModules,
    guardsPerMod,
  }: ImportModulesShallowConfig): Map<ModRefId, TrpcShallowModuleImports> {
    this.moduleManager = moduleManager;
    const normalizedModuleMeta = this.moduleManager.getNormalizedModuleMeta(modRefId, true);
    this.normalizedModuleMeta = normalizedModuleMeta;
    this.meta = this.getInitMeta(normalizedModuleMeta);
    this.glProviders = appProviders;
    this.trpcGlProviders = appProviders.initValueMap.get(initTrpcModule) as TrpcAppProviders;
    this.moduleName = normalizedModuleMeta.name;
    this.guardsPerMod = guardsPerMod || [];
    this.unfinishedScanModules = unfinishedScanModules;
    this.importModules(
      [...this.normalizedModuleMeta.importsModules, ...this.normalizedModuleMeta.importsWithOpts],
      true,
    );

    return this.shallowModuleImportsMap.set(modRefId, {
      normalizedModuleMeta,
      guardsPerMod: this.guardsPerMod,
      meta: this.meta,
    });
  }

  protected getInitMeta(normalizedModuleMeta: NormalizedModuleMeta): TrpcInitMeta {
    let meta = normalizedModuleMeta.initMeta.get(initTrpcModule);
    if (!meta) {
      meta = getProxyForInitMeta(normalizedModuleMeta, TrpcInitMeta);
      normalizedModuleMeta.initMeta.set(initTrpcModule, meta);
    }
    return meta;
  }

  protected importModules(modRefIdss: TrpcModRefId[], isImport?: boolean) {
    for (const modRefId of modRefIdss) {
      const normalizedModuleMeta = this.moduleManager.getNormalizedModuleMeta(modRefId, true);
      if (this.unfinishedScanModules.has(modRefId)) {
        continue;
      }
      const meta = this.getInitMeta(normalizedModuleMeta);
      const { guardsPerMod } = this.getPrefixAndGuards(modRefId, meta, isImport);
      const shallowModulesImporter = new TrpcShallowModulesImporter();
      this.unfinishedScanModules.add(modRefId);
      const shallowModuleImportsBase = shallowModulesImporter.importModulesShallow({
        moduleManager: this.moduleManager,
        appProviders: this.glProviders,
        modRefId,
        unfinishedScanModules: this.unfinishedScanModules,
        guardsPerMod,
      });
      this.unfinishedScanModules.delete(modRefId);

      shallowModuleImportsBase.forEach((val, key) => this.shallowModuleImportsMap.set(key, val));
    }
  }

  protected getPrefixAndGuards(modRefId: TrpcModRefId, meta: TrpcInitMeta, isImport?: boolean) {
    let guardsPerMod: ModuleScopedGuard[] = [];
    const hasModuleParams = isDynamicModule(modRefId);
    if (hasModuleParams || !isImport) {
      const impGuradsPerMod1 = meta.params.guards.map<ModuleScopedGuard>((g) => {
        return {
          ...g,
          meta: this.meta,
          normalizedModuleMeta: this.normalizedModuleMeta,
        };
      });
      guardsPerMod = [...this.guardsPerMod, ...impGuradsPerMod1];
    }
    return { guardsPerMod };
  }
}
