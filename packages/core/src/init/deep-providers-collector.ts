import { Injector } from '#di';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { defaultExtensionsProviders } from '#extension/default-extensions-providers.js';
import { defaultProvidersPerApp } from './default-providers-per-app.js';
import { ModuleManager } from '#init/module-manager.js';
import { BaseAppOptions } from '#init/base-app-options.js';
import { ShallowImportsPerDecor } from '#init/types.js';
import { ImportedTokensMap, MetadataPerMod2 } from '#types/metadata-per-mod.js';
import { Level, ProvidersForMod, ModRefId, AnyFn, AnyObj } from '#types/mix.js';
import { ShallowImportsBase } from './types.js';
import { Provider } from '#di/types-and-models.js';
import { NormalizedMeta } from '#types/normalized-meta.js';
import { ReflectiveDependency, getDependencies } from '#utils/get-dependecies.js';
import { getLastProviders } from '#utils/get-last-providers.js';
import { getProviderName } from '#utils/get-provider-name.js';
import { getProvidersTargets, getTokens } from '#utils/get-tokens.js';
import { isClassProvider, isFactoryProvider, isTokenProvider, isValueProvider } from '#di';
import { SystemErrorMediator } from '#error/system-error-mediator.js';
import { ExtensionCounters } from '#extension/extension-types.js';
import { getDebugClassName } from '#utils/get-debug-class-name.js';

/**
 * By analyzing the dependencies of the providers returned by `ShallowProvidersCollector`,
 * recursively collects providers for them from the corresponding modules.
 */
export class DeepProvidersCollector {
  protected unfinishedSearchDependecies: [ModRefId, Provider][] = [];
  protected tokensPerApp: any[];
  protected extensionsTokens: any[] = [];
  protected extensionCounters = new ExtensionCounters();

  constructor(
    private moduleManager: ModuleManager,
    protected shallowImportsBase: ShallowImportsBase,
    protected shallowImportsPerDecor: ShallowImportsPerDecor,
    protected providersPerApp: Provider[],
    protected log: SystemLogMediator,
    protected errorMediator: SystemErrorMediator,
  ) {}

  collectProvidersDeep() {
    const levels: Level[] = ['Mod'];
    const mMetadataPerMod2 = new Map<ModRefId, MetadataPerMod2>();
    this.tokensPerApp = getTokens(this.providersPerApp);
    this.shallowImportsBase.forEach((metadataPerMod1) => {
      const { baseMeta, importedTokensMap } = metadataPerMod1;
      mMetadataPerMod2.set(baseMeta.modRefId, { baseMeta, deepCollectedProviders: new Map() });
      this.resolveImportedProviders(baseMeta, importedTokensMap, levels);
      this.resolveProvidersForExtensions(baseMeta, importedTokensMap);
    });

    const deepCollectedProvidersMap = new Map<ModRefId, Map<AnyFn, AnyObj | undefined>>();
    this.moduleManager.allInitHooks.forEach((initHooks, decorator) => {
      const shallowImports = this.shallowImportsPerDecor.get(decorator);
      shallowImports?.forEach((metadataPerMod1, modRefId) => {
        const deepCollectedProviders = initHooks.collectProvidersDeep(
          metadataPerMod1,
          this.moduleManager,
          this.shallowImportsBase,
          this.providersPerApp,
          this.log,
          this.errorMediator,
        );

        const map = deepCollectedProvidersMap.get(modRefId);
        if (map) {
          map.set(decorator, deepCollectedProviders);
        } else {
          deepCollectedProvidersMap.set(modRefId, new Map([[decorator, deepCollectedProviders]]));
        }
      });
    });

    return { extensionCounters: this.extensionCounters, mMetadataPerMod2 };
  }

  protected resolveImportedProviders(
    targetProviders: NormalizedMeta,
    importedTokensMap: ImportedTokensMap,
    levels: Level[],
  ) {
    levels.forEach((level, i) => {
      importedTokensMap[`per${level}`].forEach((importObj) => {
        targetProviders[`providersPer${level}`].unshift(...importObj.providers);
        importObj.providers.forEach((importedProvider) => {
          this.grabDependecies(targetProviders, importObj.modRefId, importedProvider, levels.slice(i));
        });
      });

      importedTokensMap[`multiPer${level}`].forEach((multiProviders, sourceModule) => {
        targetProviders[`providersPer${level}`].unshift(...multiProviders);
        multiProviders.forEach((importedProvider) => {
          this.grabDependecies(targetProviders, sourceModule, importedProvider, levels.slice(i));
        });
      });
    });
  }

  protected resolveProvidersForExtensions(targetProviders: NormalizedMeta, importedTokensMap: ImportedTokensMap) {
    const currentExtensionsTokens: any[] = [];
    importedTokensMap.extensions.forEach((providers) => {
      currentExtensionsTokens.push(...getTokens(providers));
    });
    this.extensionsTokens = getTokens([...defaultExtensionsProviders, ...currentExtensionsTokens]);

    importedTokensMap.extensions.forEach((importedProviders, sourceModule) => {
      const newProviders = importedProviders.filter((np) => {
        for (const ep of targetProviders.extensionsProviders) {
          if (ep === np) {
            return false;
          }
          if (isClassProvider(ep) && isClassProvider(np)) {
            const equal = ep.token === np.token && ep.useClass === np.useClass;
            if (equal) {
              return false;
            }
          }
          if (isTokenProvider(ep) && isTokenProvider(np)) {
            const equal = ep.token === np.token && ep.useToken === np.useToken;
            if (equal) {
              return false;
            }
          }
          if (isFactoryProvider(ep) && isFactoryProvider(np)) {
            const equal = ep.token === np.token && ep.useFactory === np.useFactory;
            if (equal) {
              return false;
            }
          }
          if (isValueProvider(ep) && isValueProvider(np)) {
            const equal = ep.token === np.token && ep.useValue === np.useValue;
            if (equal) {
              return false;
            }
          }
        }
        return true;
      });
      targetProviders.extensionsProviders.unshift(...newProviders);
      importedProviders.forEach((importedProvider) => {
        if (this.hasUnresolvedDependecies(targetProviders.modRefId, importedProvider, ['Mod'])) {
          this.grabDependecies(targetProviders, sourceModule, importedProvider, ['Mod']);
        }
      });
    });
    this.increaseExtensionCounters(targetProviders);
  }

  protected increaseExtensionCounters(meta: NormalizedMeta) {
    const extensionsProviders = [...meta.extensionsProviders];
    const uniqTargets = new Set<Provider>(getProvidersTargets(extensionsProviders));

    uniqTargets.forEach((target) => {
      const counter = this.extensionCounters.mExtensions.get(target) || 0;
      this.extensionCounters.mExtensions.set(target, counter + 1);
    });
  }

  /**
   * @param targetProviders These are metadata of the module where providers are imported.
   * @param sourceModule Module from where imports providers.
   * @param importedProvider Imported provider.
   * @param levels Search in this levels. The level order is important.
   */
  protected grabDependecies(
    targetProviders: ProvidersForMod,
    sourceModule: ModRefId,
    importedProvider: Provider,
    levels: Level[],
    path: any[] = [],
  ) {
    const sourceMeta = this.moduleManager.getMetadata(sourceModule, true);

    for (const dep of this.getDependencies(importedProvider)) {
      let found: boolean = false;
      if (this.extensionsTokens.includes(dep.token)) {
        continue;
      }

      for (const level of levels) {
        const sourceProviders = getLastProviders(sourceMeta[`providersPer${level}`]);

        getTokens(sourceProviders).forEach((sourceToken, i) => {
          if (sourceToken === dep.token) {
            const importedProvider2 = sourceProviders[i];
            targetProviders[`providersPer${level}`].unshift(importedProvider2);
            found = true;
            this.grabDependeciesAgain(targetProviders, sourceModule, importedProvider2, levels, path);

            // The loop does not breaks because there may be multi providers.
          }
        });

        if (found) {
          break;
        }
      }

      if (!found && !this.tokensPerApp.includes(dep.token)) {
        this.grabImportedDependecies(targetProviders, sourceModule, importedProvider, levels, path, dep);
      }
    }
  }

  /**
   * @param targetProviders These are metadata of the module where providers are imported.
   * @param sourceModule1 Module from where imports providers.
   * @param importedProvider Imported provider.
   * @param dep ReflectiveDependecy with token for dependecy of imported provider.
   */
  protected grabImportedDependecies(
    targetProviders: ProvidersForMod,
    sourceModule1: ModRefId,
    importedProvider: Provider,
    levels: Level[],
    path: any[] = [],
    dep: ReflectiveDependency,
  ) {
    let found = false;
    const metadataPerMod1 = this.shallowImportsBase.get(sourceModule1)!;
    for (const level of levels) {
      const importObj = metadataPerMod1.importedTokensMap[`per${level}`].get(dep.token);
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
    targetProviders: ProvidersForMod,
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
    const meta = this.moduleManager.getMetadata(module, true);

    for (const dep of this.getDependencies(provider)) {
      let found: boolean = false;
      if (this.extensionsTokens.includes(dep.token)) {
        continue;
      }

      forLevel: for (const level of levels) {
        const providers = getLastProviders(meta[`providersPer${level}`]);

        for (const token of getTokens(providers)) {
          if (token === dep.token) {
            found = true;
            break forLevel;
          }
        }
      }

      if (!found && !this.tokensPerApp.includes(dep.token)) {
        if (this.hasUnresolvedImportedDependecies(module, levels, dep)) {
          return true;
        }
      }
    }
    return false;
  }

  protected hasUnresolvedImportedDependecies(module1: ModRefId, levels: Level[], dep: ReflectiveDependency) {
    let found = false;
    for (const level of levels) {
      const importObj = this.shallowImportsBase.get(module1)?.importedTokensMap[`per${level}`].get(dep.token);
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

  protected throwError(meta: NormalizedMeta, provider: Provider, path: any[], token: any, levels: Level[]) {
    path = [provider, ...path, token];
    const strPath = getTokens(path)
      .map((t) => t.name || t)
      .join(' -> ');

    const levelsPath = levels
      .concat('App' as any)
      .map((level) => `providersPer${level}`)
      .join(', ');
    const partMsg = path.length > 1 ? `(${strPath}, searching in ${levelsPath})` : levelsPath;
    // this.log.showProvidersInLogs(this, meta.name, meta.providersPerReq, meta.providersPerRou, meta.providersPerMod);

    this.errorMediator.throwNoProviderDuringResolveImports(meta.name, token.name || token, partMsg);
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
