import {
  ModRefId,
  Provider,
  ModuleManager,
  SystemLogMediator,
  SystemErrorMediator,
  getTokens,
  NormalizedMeta,
  getLastProviders,
  getDependencies,
  defaultProvidersPerApp,
  Injector,
  BaseAppOptions,
  getDebugClassName,
  ReflectiveDependency,
  getProviderName,
  ShallowImports,
} from '@ditsmod/core';

import { Level } from '#types/types.js';
import { defaultProvidersPerRou } from '#providers/default-providers-per-rou.js';
import { defaultProvidersPerReq } from '#providers/default-providers-per-req.js';
import {
  DeepModulesImporterConfig,
  RestImportedTokensMap,
  RestMetadataPerMod1,
  RestMetadataPerMod2,
  RestProvidersForMod,
} from './types.js';
import { RestInitMeta } from '#init/rest-normalized-meta.js';
import { initRest } from '#decorators/rest-init-hooks-and-metadata.js';

/**
 * By analyzing the dependencies of the providers returned by `ShallowModulesImporter`,
 * recursively collects providers for them from the corresponding modules.
 */
export class DeepModulesImporter {
  protected unfinishedSearchDependecies: [ModRefId, Provider][] = [];
  protected tokensPerApp: any[];
  protected tokensPerMod: any[];

  protected metadataPerMod1: RestMetadataPerMod1;
  protected moduleManager: ModuleManager;
  protected shallowImports: ShallowImports;
  protected providersPerApp: Provider[];
  protected log: SystemLogMediator;
  protected errorMediator: SystemErrorMediator;

  constructor({
    metadataPerMod1,
    moduleManager,
    shallowImports,
    providersPerApp,
    log,
    errorMediator,
  }: DeepModulesImporterConfig) {
    this.metadataPerMod1 = metadataPerMod1;
    this.moduleManager = moduleManager;
    this.shallowImports = shallowImports;
    this.providersPerApp = providersPerApp;
    this.log = log;
    this.errorMediator = errorMediator;
  }

  importModulesDeep(): RestMetadataPerMod2 | undefined {
    const levels: Level[] = ['Rou', 'Req'];
    this.tokensPerApp = getTokens(this.providersPerApp);
    this.tokensPerMod = getTokens(this.metadataPerMod1.baseMeta.providersPerMod).concat(
      getTokens(this.metadataPerMod1.baseMeta.exportedMultiProvidersPerMod),
    );
    if (!this.metadataPerMod1) {
      return;
    }
    const { importedTokensMap, guards1, prefixPerMod, meta, applyControllers } = this.metadataPerMod1;
    this.resolveImportedProviders(meta, importedTokensMap, levels);
    meta.providersPerRou.unshift(...defaultProvidersPerRou);
    meta.providersPerReq.unshift(...defaultProvidersPerReq);
    return {
      baseMeta: this.metadataPerMod1.baseMeta,
      meta,
      guards1,
      prefixPerMod,
      applyControllers,
    };
  }

  protected resolveImportedProviders(meta: RestInitMeta, importedTokensMap: RestImportedTokensMap, levels: Level[]) {
    levels.forEach((level, i) => {
      importedTokensMap[`per${level}`].forEach((importObj) => {
        meta[`providersPer${level}`].unshift(...importObj.providers);
        importObj.providers.forEach((importedProvider) => {
          this.grabDependecies(meta, importObj.modRefId, importedProvider, levels.slice(i));
        });
      });

      importedTokensMap[`multiPer${level}`].forEach((multiProviders, sourceModule) => {
        meta[`providersPer${level}`].unshift(...multiProviders);
        multiProviders.forEach((importedProvider) => {
          this.grabDependecies(meta, sourceModule, importedProvider, levels.slice(i));
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
  protected grabDependecies(
    targetProviders: RestProvidersForMod,
    srcModRefId: ModRefId,
    importedProvider: Provider,
    levels: Level[],
    path: any[] = [],
  ) {
    const srcBaseMeta = this.moduleManager.getMetadata(srcModRefId, true);
    const meta = srcBaseMeta.initMeta.get(initRest) as RestInitMeta;

    for (const dep of this.getDependencies(importedProvider)) {
      let found: boolean = false;

      for (const level of levels) {
        const srcProviders = getLastProviders(meta[`providersPer${level}`]);

        getTokens(srcProviders).forEach((sourceToken, i) => {
          if (sourceToken === dep.token) {
            const importedProvider2 = srcProviders[i];
            targetProviders[`providersPer${level}`].unshift(importedProvider2);
            found = true;
            this.grabDependeciesAgain(targetProviders, srcModRefId, importedProvider2, levels, path);

            // The loop does not breaks because there may be multi providers.
          }
        });

        if (found) {
          break;
        }
      }

      if (!found && !this.tokensPerMod.includes(dep.token) && !this.tokensPerApp.includes(dep.token)) {
        this.grabImportedDependecies(targetProviders, srcModRefId, importedProvider, levels, path, dep);
      }
    }
  }

  /**
   * @param targetProviders These are metadata of the module where providers are imported.
   * @param srcModRefId1 Module from where imports providers.
   * @param importedProvider Imported provider.
   * @param dep ReflectiveDependecy with token for dependecy of imported provider.
   */
  protected grabImportedDependecies(
    targetProviders: RestProvidersForMod,
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
        const { modRefId: modRefId2, providers: sourceProviders2 } = importObj;
        targetProviders[`providersPer${level}`].unshift(...sourceProviders2);

        // Loop for multi providers.
        for (const sourceProvider2 of sourceProviders2) {
          this.grabDependeciesAgain(targetProviders, modRefId2, sourceProvider2, levels, path);
        }
        break;
      }
    }

    if (!found && dep.required) {
      this.throwError(metadataPerMod1.baseMeta, importedProvider, path, dep.token, levels);
    }
  }

  protected grabDependeciesAgain(
    targetProviders: RestProvidersForMod,
    sourceModule: ModRefId,
    importedProvider: Provider,
    levels: Level[],
    path: any[],
  ) {
    this.addToUnfinishedSearchDependecies(sourceModule, importedProvider);
    this.grabDependecies(targetProviders, sourceModule, importedProvider, levels, path);
    this.deleteFromUnfinishedSearchDependecies(sourceModule, importedProvider);
  }

  protected hasUnresolvedDependecies(module: ModRefId, provider: Provider, levels: Level[]) {
    const baseMeta = this.moduleManager.getMetadata(module, true);

    for (const dep of this.getDependencies(provider)) {
      let found: boolean = false;

      forLevel: for (const level of levels) {
        const meta = baseMeta.initMeta.get(initRest) as RestInitMeta;
        const providers = getLastProviders(meta[`providersPer${level}`]);

        for (const token of getTokens(providers)) {
          if (token === dep.token) {
            found = true;
            break forLevel;
          }
        }
      }

      if (!found && !this.tokensPerMod.includes(dep.token) && !this.tokensPerApp.includes(dep.token)) {
        if (this.hasUnresolvedImportedDependecies(module, levels, dep)) {
          return true;
        }
      }
    }
    return false;
  }

  protected hasUnresolvedImportedDependecies(modRefId1: ModRefId, levels: Level[], dep: ReflectiveDependency) {
    let found = false;
    for (const level of levels) {
      const restMetadataPerMod1 = this.shallowImports.get(modRefId1)?.shallowImportedModules.get(initRest) as
        | RestMetadataPerMod1
        | undefined;
      const importObj = restMetadataPerMod1?.importedTokensMap[`per${level}`].get(dep.token);
      if (importObj) {
        found = true;
        const { modRefId: modRefId2, providers } = importObj;

        // Loop for multi providers.
        for (const provider of providers) {
          this.addToUnfinishedSearchDependecies(modRefId2, provider);
          found = !this.hasUnresolvedDependecies(modRefId2, provider, levels);
          this.deleteFromUnfinishedSearchDependecies(modRefId2, provider);
          if (!found) {
            return true;
          }
        }
        break;
      }
    }

    if (!found && dep.required) {
      return true;
    }
    return false;
  }

  protected throwError(baseMeta: NormalizedMeta, provider: Provider, path: any[], token: any, levels: Level[]) {
    path = [provider, ...path, token];
    const strPath = getTokens(path)
      .map((t) => t.name || t)
      .join(' -> ');

    const levelsPath = levels
      .concat('App' as any, 'Mod' as any)
      .map((level) => `providersPer${level}`)
      .join(', ');
    const partMsg = path.length > 1 ? `(${strPath}, searching in ${levelsPath})` : levelsPath;
    // this.log.showProvidersInLogs(this, meta.name, meta.providersPerReq, meta.providersPerRou, meta.providersPerMod);

    this.errorMediator.throwNoProviderDuringResolveImports(baseMeta.name, token.name || token, partMsg);
  }

  protected getDependencies(provider: Provider) {
    const deps = getDependencies(provider);

    const defaultTokens = [
      ...getTokens([
        //
        ...defaultProvidersPerApp,
        // ...defaultProvidersPerReq,
      ]),
      Injector,
      BaseAppOptions,
    ];

    return deps.filter((d) => !defaultTokens.includes(d.token));
  }

  protected addToUnfinishedSearchDependecies(module: ModRefId, provider: Provider) {
    const index = this.unfinishedSearchDependecies.findIndex(([m, p]) => m === module && p === provider);
    if (index != -1) {
      this.throwCircularDependencies(index);
    }
    this.unfinishedSearchDependecies.push([module, provider]);
  }

  protected deleteFromUnfinishedSearchDependecies(module: ModRefId, provider: Provider) {
    const index = this.unfinishedSearchDependecies.findIndex(([m, p]) => m === module && p === provider);
    this.unfinishedSearchDependecies.splice(index, 1);
  }

  protected throwCircularDependencies(index: number) {
    const items = this.unfinishedSearchDependecies;
    const prefixChain = items.slice(0, index);
    const circularChain = items.slice(index);

    const prefixNames = prefixChain
      .map(([m, p]) => {
        const debugModuleName = getDebugClassName(m);
        return `[${getProviderName(p)} in ${debugModuleName}]`;
      })
      .join(' -> ');

    const [modRefId, provider] = items[index];
    let circularNames = circularChain
      .map(([m, p]) => {
        const debugModuleName = getDebugClassName(m);
        return `[${getProviderName(p)} in ${debugModuleName}]`;
      })
      .join(' -> ');

    const debugModuleName = getDebugClassName(modRefId);
    circularNames += ` -> [${getProviderName(provider)} in ${debugModuleName}]`;
    let msg = `Detected circular dependencies: ${circularNames}.`;
    if (prefixNames) {
      msg += ` It is started from ${prefixNames}.`;
    }
    throw new Error(msg);
  }
}
