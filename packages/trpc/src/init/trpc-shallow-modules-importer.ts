import type { ModRefId, ModuleManager, NormalizedModuleMeta, AppProviders } from '@ditsmod/core';
import { isDynamicModule, getProxyForInitMeta } from '@ditsmod/core';

import type {
  ImportModulesShallowConfig,
  TrpcAppProviders,
  TrpcModRefId,
  TrpcShallowModuleImports,
} from '#decorators/trpc-init-hooks-and-metadata.js';
import { initTrpcModule, TrpcInitHooks, TrpcInitMeta } from '#decorators/trpc-init-hooks-and-metadata.js';
import type { GuardPerMod1 } from '#interceptors/trpc-guard.js';

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
  protected guards1: GuardPerMod1[];
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
    guards1,
  }: ImportModulesShallowConfig): Map<ModRefId, TrpcShallowModuleImports> {
    this.moduleManager = moduleManager;
    const normalizedModuleMeta = this.moduleManager.getNormalizedModuleMeta(modRefId, true);
    this.normalizedModuleMeta = normalizedModuleMeta;
    this.meta = this.getInitMeta(normalizedModuleMeta);
    this.glProviders = appProviders;
    this.trpcGlProviders = appProviders.mInitValue.get(initTrpcModule) as TrpcAppProviders;
    this.moduleName = normalizedModuleMeta.name;
    this.guards1 = guards1 || [];
    this.unfinishedScanModules = unfinishedScanModules;
    this.importModules(
      [...this.normalizedModuleMeta.importsModules, ...this.normalizedModuleMeta.importsWithParams],
      true,
    );

    return this.shallowModuleImportsMap.set(modRefId, {
      normalizedModuleMeta,
      guards1: this.guards1,
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

  protected importModules(aModRefIds: TrpcModRefId[], isImport?: boolean) {
    for (const modRefId of aModRefIds) {
      const normalizedModuleMeta = this.moduleManager.getNormalizedModuleMeta(modRefId, true);
      if (this.unfinishedScanModules.has(modRefId)) {
        continue;
      }
      const meta = this.getInitMeta(normalizedModuleMeta);
      const { guards1 } = this.getPrefixAndGuards(modRefId, meta, isImport);
      const shallowModulesImporter = new TrpcShallowModulesImporter();
      this.unfinishedScanModules.add(modRefId);
      const shallowModuleImportsBase = shallowModulesImporter.importModulesShallow({
        moduleManager: this.moduleManager,
        appProviders: this.glProviders,
        modRefId,
        unfinishedScanModules: this.unfinishedScanModules,
        guards1,
      });
      this.unfinishedScanModules.delete(modRefId);

      shallowModuleImportsBase.forEach((val, key) => this.shallowModuleImportsMap.set(key, val));
    }
  }

  protected getPrefixAndGuards(modRefId: TrpcModRefId, meta: TrpcInitMeta, isImport?: boolean) {
    let guards1: GuardPerMod1[] = [];
    const hasModuleParams = isDynamicModule(modRefId);
    if (hasModuleParams || !isImport) {
      const impGuradsPerMod1 = meta.params.guards.map<GuardPerMod1>((g) => {
        return {
          ...g,
          meta: this.meta,
          normalizedModuleMeta: this.normalizedModuleMeta,
        };
      });
      guards1 = [...this.guards1, ...impGuradsPerMod1];
    }
    return { guards1 };
  }
}
