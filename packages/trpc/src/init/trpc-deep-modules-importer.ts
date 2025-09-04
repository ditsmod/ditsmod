import {
  ModRefId,
  Provider,
  ModuleManager,
  SystemLogMediator,
  getTokens,
  getLastProviders,
  ReflectiveDependency,
  DeepModulesImporter,
  ShallowImports,
  ModuleExtract,
  BaseMeta,
} from '@ditsmod/core';

import { DeepModulesImporterConfig, initTrpcModule, TrpcInitMeta } from '#decorators/trpc-init-hooks-and-metadata.js';
import { TrpcBaseImportRegistry, TrpcProvidersOnly, TrpcShallowImports } from './trpc-shallow-modules-importer.js';
import { Level } from './trpc-module-normalizer.js';
import { GuardPerMod1 } from '#interceptors/guard.js';
import { defaultProvidersPerRou } from '#providers/default-providers-per-rou.js';

/**
 * This metadata returns from `DeepModulesImporter`. The target for this metadata is `RoutesExtension`.
 */

export class TrpcMetadataPerMod2 {
  baseMeta: BaseMeta;
  meta: TrpcInitMeta;
  guards1: GuardPerMod1[];
}

export class TrpcModuleExtract extends ModuleExtract {}

/**
 * By analyzing the dependencies of the providers returned by `ShallowModulesImporter`,
 * recursively collects providers for them from the corresponding modules.
 */
export class TrpcDeepModulesImporter {
  protected tokensPerApp: any[];

  protected shallowImports: TrpcShallowImports;
  protected moduleManager: ModuleManager;
  protected shallowImportsMap: Map<ModRefId, ShallowImports>;
  protected providersPerApp: Provider[];
  protected log: SystemLogMediator;
  protected parent: DeepModulesImporter;

  constructor({
    parent,
    shallowImports,
    moduleManager,
    shallowImportsMap,
    providersPerApp,
    log,
  }: DeepModulesImporterConfig) {
    this.parent = parent;
    this.shallowImports = shallowImports;
    this.moduleManager = moduleManager;
    this.shallowImportsMap = shallowImportsMap;
    this.providersPerApp = providersPerApp;
    this.log = log;
  }

  importModulesDeep(): TrpcMetadataPerMod2 | undefined {
    const levels: Level[] = ['Req', 'Rou', 'Mod'];
    this.tokensPerApp = getTokens(this.providersPerApp);
    const { baseImportRegistry, guards1, meta } = this.shallowImports;
    const targetProviders = new TrpcProvidersOnly();
    this.resolveImportedProviders(targetProviders, baseImportRegistry, levels);
    meta.providersPerMod.unshift(...targetProviders.providersPerMod);
    meta.providersPerRou.unshift(...defaultProvidersPerRou, ...targetProviders.providersPerRou);
    // meta.providersPerReq.unshift(...defaultProvidersPerReq, ...targetProviders.providersPerReq);
    return {
      baseMeta: this.shallowImports.baseMeta,
      meta,
      guards1,
    };
  }

  protected resolveImportedProviders(
    meta: TrpcProvidersOnly,
    baseImportRegistry: TrpcBaseImportRegistry,
    levels: Level[],
  ) {
    levels.forEach((level, i) => {
      baseImportRegistry[`per${level}`].forEach((providerImport) => {
        meta[`providersPer${level}`].unshift(...providerImport.providers);
        providerImport.providers.forEach((importedProvider) => {
          this.fetchDeps(meta, providerImport.modRefId, importedProvider, levels.slice(i));
        });
      });

      baseImportRegistry[`multiPer${level}`].forEach((multiProviders, srcModule) => {
        meta[`providersPer${level}`].unshift(...multiProviders);
        multiProviders.forEach((importedProvider) => {
          this.fetchDeps(meta, srcModule, importedProvider, levels.slice(i));
        });
      });
    });
  }

  /**
   * @param targetProviders These are metadata of the module where providers are imported.
   * @param srcModRefId Module from where imports providers.
   * @param importedProvider Imported provider.
   * @param levels Search in this levels. The level order is important.
   */
  protected fetchDeps(
    targetProviders: TrpcProvidersOnly,
    srcModRefId: ModRefId,
    importedProvider: Provider,
    levels: Level[],
    path: any[] = [],
  ) {
    const srcBaseMeta = this.moduleManager.getBaseMeta(srcModRefId, true);
    const srcMeta = srcBaseMeta.initMeta.get(initTrpcModule) as TrpcInitMeta;

    for (const dep of this.parent.getDependencies(importedProvider)) {
      let found: boolean = false;

      for (const level of levels) {
        const srcProviders = getLastProviders(srcMeta[`providersPer${level}`]);

        getTokens(srcProviders).forEach((srcToken, i) => {
          if (srcToken === dep.token) {
            const importedProvider2 = srcProviders[i];
            targetProviders[`providersPer${level}`].unshift(importedProvider2);
            found = true;
            this.fetchDependenciesAgain(targetProviders, srcModRefId, importedProvider2, levels, path);

            // The loop does not breaks because there may be multi providers.
          }
        });

        if (found) {
          break;
        }
      }
      if (!found && !this.tokensPerApp.includes(dep.token)) {
        this.fetchImportedDeps(targetProviders, srcModRefId, importedProvider, levels, path, dep);
      }
    }
  }

  /**
   * @param targetProviders These are metadata of the module where providers are imported.
   * @param srcModRefId1 Module from where imports providers.
   * @param importedProvider Imported provider.
   * @param dep ReflectiveDependecy with token for dependecy of imported provider.
   */
  protected fetchImportedDeps(
    targetProviders: TrpcProvidersOnly,
    srcModRefId1: ModRefId,
    importedProvider: Provider,
    levels: Level[],
    path: any[] = [],
    dep: ReflectiveDependency,
  ) {
    let found = false;
    const shallowImports = this.shallowImportsMap.get(srcModRefId1)!;
    for (const level of levels) {
      const trpcShallowImports = shallowImports.initImportRegistryMap.get(initTrpcModule) as TrpcShallowImports;
      const providerImport = trpcShallowImports.baseImportRegistry[`per${level}`].get(dep.token);
      if (providerImport) {
        found = true;
        path.push(dep.token);
        const { modRefId: modRefId2, providers: srcProviders2 } = providerImport;
        targetProviders[`providersPer${level}`].unshift(...srcProviders2);

        // Loop for multi providers.
        for (const srcProvider2 of srcProviders2) {
          this.fetchDependenciesAgain(targetProviders, modRefId2, srcProvider2, levels, path);
        }
        break;
      }
    }

    if (!found && dep.required) {
      this.parent.throwError(shallowImports.baseMeta, importedProvider, path, dep.token, levels);
    }
  }

  protected fetchDependenciesAgain(
    targetProviders: TrpcProvidersOnly,
    srcModRefId: ModRefId,
    importedProvider: Provider,
    levels: Level[],
    path: any[],
  ) {
    this.parent.addToUnfinishedSearchDependencies(srcModRefId, importedProvider);
    this.fetchDeps(targetProviders, srcModRefId, importedProvider, levels, path);
    this.parent.deleteFromUnfinishedSearchDependencies(srcModRefId, importedProvider);
  }
}
