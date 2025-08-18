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
} from '@ditsmod/core';

import { Level } from '#types/types.js';
import { defaultProvidersPerRou } from '#providers/default-providers-per-rou.js';
import { defaultProvidersPerReq } from '#providers/default-providers-per-req.js';
import {
  DeepModulesImporterConfig,
  RestBaseImportRegistry,
  RestShallowImports,
  RestMetadataPerMod2,
  RestProvidersOnly,
} from './types.js';
import { RestInitMeta } from '#init/rest-init-meta.js';
import { initRest } from '#decorators/rest-init-hooks-and-metadata.js';

/**
 * By analyzing the dependencies of the providers returned by `ShallowModulesImporter`,
 * recursively collects providers for them from the corresponding modules.
 */
export class RestDeepModulesImporter {
  protected tokensPerApp: any[];

  protected shallowImports: RestShallowImports;
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

  importModulesDeep(): RestMetadataPerMod2 | undefined {
    const levels: Level[] = ['Req', 'Rou', 'Mod'];
    this.tokensPerApp = getTokens(this.providersPerApp);
    const { baseImportRegistry, guards1, prefixPerMod, meta, applyControllers, baseMeta } = this.shallowImports;
    const targetProviders = new RestProvidersOnly();
    this.resolveImportedProviders(targetProviders, baseImportRegistry, levels);
    meta.providersPerMod.push(...targetProviders.providersPerMod);
    meta.providersPerRou.unshift(...defaultProvidersPerRou, ...targetProviders.providersPerRou);
    meta.providersPerReq.unshift(...defaultProvidersPerReq, ...targetProviders.providersPerReq);
    return {
      baseMeta: this.shallowImports.baseMeta,
      meta,
      guards1,
      prefixPerMod,
      applyControllers,
    };
  }

  protected resolveImportedProviders(
    meta: RestProvidersOnly,
    baseImportRegistry: RestBaseImportRegistry,
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
    targetProviders: RestProvidersOnly,
    srcModRefId: ModRefId,
    importedProvider: Provider,
    levels: Level[],
    path: any[] = [],
  ) {
    const srcBaseMeta = this.moduleManager.getBaseMeta(srcModRefId, true);
    const srcMeta = srcBaseMeta.initMeta.get(initRest) as RestInitMeta;

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
    targetProviders: RestProvidersOnly,
    srcModRefId1: ModRefId,
    importedProvider: Provider,
    levels: Level[],
    path: any[] = [],
    dep: ReflectiveDependency,
  ) {
    let found = false;
    const shallowImports = this.shallowImportsMap.get(srcModRefId1)!;
    for (const level of levels) {
      const restShallowImports = shallowImports.initImportRegistryMap.get(initRest) as RestShallowImports;
      const providerImport = restShallowImports.baseImportRegistry[`per${level}`].get(dep.token);
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
    targetProviders: RestProvidersOnly,
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
