import type { ModRefId, ModuleManager, BaseMeta, AppProviders } from '@ditsmod/core';
import { isModuleWithParams, getProxyForInitMeta } from '@ditsmod/core';

import type {
  ImportModulesShallowConfig,
  TrpcAppProviders,
  TrpcModRefId,
  TrpcShallowImports,
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
  protected baseMeta: BaseMeta;
  protected meta: TrpcInitMeta;

  /**
   * AppProviders.
   */
  protected glProviders: AppProviders;
  protected trpcGlProviders: TrpcAppProviders;
  protected shallowImportsMap = new Map<ModRefId, TrpcShallowImports>();
  protected unfinishedScanModules = new Set<ModRefId>();
  protected unfinishedExportModules = new Set<ModRefId>();
  protected moduleManager: ModuleManager;

  exportAppProviders({
    moduleManager,
    appProviders,
    baseMeta,
  }: {
    moduleManager: ModuleManager;
    appProviders: AppProviders;
    baseMeta: BaseMeta;
  }): TrpcAppProviders {
    this.moduleManager = moduleManager;
    this.glProviders = appProviders;
    this.moduleName = baseMeta.name;
    this.baseMeta = baseMeta;
    this.meta = this.getInitMeta(baseMeta);

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
  }: ImportModulesShallowConfig): Map<ModRefId, TrpcShallowImports> {
    this.moduleManager = moduleManager;
    const baseMeta = this.moduleManager.getBaseMeta(modRefId, true);
    this.baseMeta = baseMeta;
    this.meta = this.getInitMeta(baseMeta);
    this.glProviders = appProviders;
    this.trpcGlProviders = appProviders.mInitValue.get(initTrpcModule) as TrpcAppProviders;
    this.moduleName = baseMeta.name;
    this.guards1 = guards1 || [];
    this.unfinishedScanModules = unfinishedScanModules;
    this.importModules([...this.baseMeta.importsModules, ...this.baseMeta.importsWithParams], true);

    return this.shallowImportsMap.set(modRefId, {
      baseMeta,
      guards1: this.guards1,
      meta: this.meta,
    });
  }

  protected getInitMeta(baseMeta: BaseMeta): TrpcInitMeta {
    let meta = baseMeta.initMeta.get(initTrpcModule);
    if (!meta) {
      meta = getProxyForInitMeta(baseMeta, TrpcInitMeta);
      baseMeta.initMeta.set(initTrpcModule, meta);
    }
    return meta;
  }

  protected importModules(aModRefIds: TrpcModRefId[], isImport?: boolean) {
    for (const modRefId of aModRefIds) {
      const baseMeta = this.moduleManager.getBaseMeta(modRefId, true);
      if (this.unfinishedScanModules.has(modRefId)) {
        continue;
      }
      const meta = this.getInitMeta(baseMeta);
      const { guards1 } = this.getPrefixAndGuards(modRefId, meta, isImport);
      const shallowModulesImporter = new TrpcShallowModulesImporter();
      this.unfinishedScanModules.add(modRefId);
      const shallowImportsBase = shallowModulesImporter.importModulesShallow({
        moduleManager: this.moduleManager,
        appProviders: this.glProviders,
        modRefId,
        unfinishedScanModules: this.unfinishedScanModules,
        guards1,
      });
      this.unfinishedScanModules.delete(modRefId);

      shallowImportsBase.forEach((val, key) => this.shallowImportsMap.set(key, val));
    }
  }

  protected getPrefixAndGuards(modRefId: TrpcModRefId, meta: TrpcInitMeta, isImport?: boolean) {
    let guards1: GuardPerMod1[] = [];
    const hasModuleParams = isModuleWithParams(modRefId);
    if (hasModuleParams || !isImport) {
      const impGuradsPerMod1 = meta.params.guards.map<GuardPerMod1>((g) => {
        return {
          ...g,
          meta: this.meta,
          baseMeta: this.baseMeta,
        };
      });
      guards1 = [...this.guards1, ...impGuradsPerMod1];
    }
    return { guards1 };
  }
}
