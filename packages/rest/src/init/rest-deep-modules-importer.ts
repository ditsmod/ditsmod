import {
  ModRefId,
  Provider,
  ModuleManager,
  SystemLogMediator,
  SystemErrorMediator,
  getTokens,
  getLastProviders,
  ReflectiveDependency,
  ShallowImports,
  DeepModulesImporter,
} from '@ditsmod/core';

import { Level } from '#types/types.js';
import { defaultProvidersPerRou } from '#providers/default-providers-per-rou.js';
import { defaultProvidersPerReq } from '#providers/default-providers-per-req.js';
import {
  DeepModulesImporterConfig,
  RestImportedTokensMap,
  RestMetadataPerMod1,
  RestMetadataPerMod2,
  RestProvidersOnly,
} from './types.js';
import { RestInitMeta } from '#init/rest-normalized-meta.js';
import { initRest } from '#decorators/rest-init-hooks-and-metadata.js';

/**
 * By analyzing the dependencies of the providers returned by `ShallowModulesImporter`,
 * recursively collects providers for them from the corresponding modules.
 */
export class RestDeepModulesImporter {
  protected tokensPerApp: any[];

  protected metadataPerMod1: RestMetadataPerMod1;
  protected moduleManager: ModuleManager;
  protected shallowImports: ShallowImports;
  protected providersPerApp: Provider[];
  protected log: SystemLogMediator;
  protected errorMediator: SystemErrorMediator;
  protected parent: DeepModulesImporter;

  constructor({
    parent,
    metadataPerMod1,
    moduleManager,
    shallowImports,
    providersPerApp,
    log,
    errorMediator,
  }: DeepModulesImporterConfig) {
    this.parent = parent;
    this.metadataPerMod1 = metadataPerMod1;
    this.moduleManager = moduleManager;
    this.shallowImports = shallowImports;
    this.providersPerApp = providersPerApp;
    this.log = log;
    this.errorMediator = errorMediator;
  }

  importModulesDeep(): RestMetadataPerMod2 | undefined {
    const levels: Level[] = ['Req', 'Rou'];
    this.tokensPerApp = getTokens(this.providersPerApp);
    const { importedTokensMap, guards1, prefixPerMod, meta, applyControllers } = this.metadataPerMod1;
    const targetProviders = new RestProvidersOnly();
    this.resolveImportedProviders(targetProviders, importedTokensMap, levels);
    meta.providersPerRou.unshift(...defaultProvidersPerRou, ...targetProviders.providersPerRou);
    meta.providersPerReq.unshift(...defaultProvidersPerReq, ...targetProviders.providersPerReq);
    return {
      baseMeta: this.metadataPerMod1.baseMeta,
      meta,
      guards1,
      prefixPerMod,
      applyControllers,
    };
  }

  protected resolveImportedProviders(
    meta: RestProvidersOnly,
    importedTokensMap: RestImportedTokensMap,
    levels: Level[],
  ) {
    levels.forEach((level, i) => {
      importedTokensMap[`per${level}`].forEach((importObj) => {
        meta[`providersPer${level}`].unshift(...importObj.providers);
        importObj.providers.forEach((importedProvider) => {
          this.fetchDeps(meta, importObj.modRefId, importedProvider, levels.slice(i));
        });
      });

      importedTokensMap[`multiPer${level}`].forEach((multiProviders, srcModule) => {
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
    const srcBaseMeta = this.moduleManager.getMetadata(srcModRefId, true);
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

      if (!found) {
        // Above - fetch deps per request and per route, here - per module
        const srcProviders = getLastProviders(srcBaseMeta.providersPerMod);
        getTokens(srcProviders).forEach((srcToken, i) => {
          if (srcToken === dep.token) {
            const importedProvider2 = srcProviders[i];
            this.metadataPerMod1.baseMeta.providersPerMod.unshift(importedProvider2);
            found = true;
            this.fetchDependenciesAgain(targetProviders, srcModRefId, importedProvider2, levels, path);

            // The loop does not breaks because there may be multi providers.
          }
        });
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
    const metadataPerMod1 = this.shallowImports.get(srcModRefId1)!;
    for (const level of levels) {
      const restMetadataPerMod1 = metadataPerMod1.shallowImportedModules.get(initRest) as RestMetadataPerMod1;
      const importObj = restMetadataPerMod1.importedTokensMap[`per${level}`].get(dep.token);
      if (importObj) {
        found = true;
        path.push(dep.token);
        const { modRefId: modRefId2, providers: srcProviders2 } = importObj;
        targetProviders[`providersPer${level}`].unshift(...srcProviders2);

        // Loop for multi providers.
        for (const srcProvider2 of srcProviders2) {
          this.fetchDependenciesAgain(targetProviders, modRefId2, srcProvider2, levels, path);
        }
        break;
      }
    }

    if (!found) {
      // Above - fetch deps per request and per route, here - per module
      const importObj = metadataPerMod1.importedTokensMap.perMod.get(dep.token);
      if (importObj) {
        found = true;
        path.push(dep.token);
        const { modRefId: modRefId2, providers: srcProviders2 } = importObj;
        this.metadataPerMod1.baseMeta.providersPerMod.unshift(...srcProviders2);

        // Loop for multi providers.
        for (const srcProvider2 of srcProviders2) {
          this.fetchDependenciesAgain(targetProviders, modRefId2, srcProvider2, levels, path);
        }
      }
    }

    if (!found && dep.required) {
      this.parent.throwError(metadataPerMod1.baseMeta, importedProvider, path, dep.token, [...levels, 'Mod']);
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
