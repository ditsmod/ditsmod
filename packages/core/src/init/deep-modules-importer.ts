import { Injector } from '#di';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { defaultExtensionsProviders } from '#extension/default-extensions-providers.js';
import { defaultProvidersPerApp } from './default-providers-per-app.js';
import { ModuleManager } from '#init/module-manager.js';
import { BaseAppOptions } from '#init/base-app-options.js';
import { ShallowImports } from '#init/types.js';
import { ImportedTokensMap, MetadataPerMod2 } from '#types/metadata-per-mod.js';
import { Level, ProvidersOnly, ModRefId, AnyFn, AnyObj } from '#types/mix.js';
import { Provider } from '#di/types-and-models.js';
import { BaseMeta } from '#types/base-meta.js';
import { ReflectiveDependency, getDependencies } from '#utils/get-dependencies.js';
import { getLastProviders } from '#utils/get-last-providers.js';
import { getProviderName } from '#utils/get-provider-name.js';
import { getProvidersTargets, getTokens } from '#utils/get-tokens.js';
import { isClassProvider, isFactoryProvider, isTokenProvider, isValueProvider } from '#di';
import { SystemErrorMediator } from '#error/system-error-mediator.js';
import { ExtensionCounters } from '#extension/extension-types.js';
import { getDebugClassName } from '#utils/get-debug-class-name.js';

/**
 * By analyzing the dependencies of the providers returned by `ShallowModulesImporter`,
 * recursively collects providers for them from the corresponding modules.
 */
export class DeepModulesImporter {
  dependencyChain: [ModRefId, Provider][] = [];
  protected tokensPerApp: any[];
  protected extensionsTokens: any[] = [];
  protected extensionCounters = new ExtensionCounters();

  protected moduleManager: ModuleManager;
  protected shallowImports: ShallowImports;
  protected providersPerApp: Provider[];
  protected log: SystemLogMediator;
  protected errorMediator: SystemErrorMediator;

  constructor({
    moduleManager,
    shallowImports,
    providersPerApp,
    log,
    errorMediator,
  }: {
    moduleManager: ModuleManager;
    shallowImports: ShallowImports;
    providersPerApp: Provider[];
    log: SystemLogMediator;
    errorMediator: SystemErrorMediator;
  }) {
    this.moduleManager = moduleManager;
    this.shallowImports = shallowImports;
    this.providersPerApp = providersPerApp;
    this.log = log;
    this.errorMediator = errorMediator;
  }

  importModulesDeep() {
    const levels: Level[] = ['Mod'];
    const mMetadataPerMod2 = new Map<ModRefId, MetadataPerMod2>();
    this.tokensPerApp = getTokens(this.providersPerApp);
    this.shallowImports.forEach(({ baseMeta, importedTokensMap, shallowImportedModules }, modRefId) => {
      const deepImportedModules = new Map<AnyFn, AnyObj>();
      mMetadataPerMod2.set(modRefId, { baseMeta, deepImportedModules });
      this.resolveImportedProviders(baseMeta, importedTokensMap, levels);
      this.resolveProvidersForExtensions(baseMeta, importedTokensMap);
      baseMeta.allInitHooks.forEach((initHooks, decorator) => {
        const shallowImportedModule = shallowImportedModules.get(decorator)!;
        const deepImports = initHooks.importModulesDeep({
          parent: this,
          metadataPerMod1: shallowImportedModule,
          moduleManager: this.moduleManager,
          shallowImports: this.shallowImports,
          providersPerApp: this.providersPerApp,
          log: this.log,
          errorMediator: this.errorMediator,
        });
        deepImportedModules.set(decorator, deepImports);
      });
    });

    return { extensionCounters: this.extensionCounters, mMetadataPerMod2 };
  }

  protected resolveImportedProviders(
    targetProviders: ProvidersOnly,
    importedTokensMap: ImportedTokensMap,
    levels: Level[],
  ) {
    levels.forEach((level, i) => {
      importedTokensMap[`per${level}`].forEach((importObj) => {
        targetProviders[`providersPer${level}`].unshift(...importObj.providers);
        importObj.providers.forEach((importedProvider) => {
          this.grabDependencies(targetProviders, importObj.modRefId, importedProvider, levels.slice(i));
        });
      });

      importedTokensMap[`multiPer${level}`].forEach((multiProviders, srcModule) => {
        targetProviders[`providersPer${level}`].unshift(...multiProviders);
        multiProviders.forEach((importedProvider) => {
          this.grabDependencies(targetProviders, srcModule, importedProvider, levels.slice(i));
        });
      });
    });
  }

  protected resolveProvidersForExtensions(targetProviders: BaseMeta, importedTokensMap: ImportedTokensMap) {
    const currentExtensionsTokens: any[] = [];
    importedTokensMap.extensions.forEach((providers) => {
      currentExtensionsTokens.push(...getTokens(providers));
    });
    this.extensionsTokens = getTokens([...defaultExtensionsProviders, ...currentExtensionsTokens]);

    importedTokensMap.extensions.forEach((importedProviders, srcModule) => {
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
        if (this.hasUnresolvedDependencies(targetProviders.modRefId, importedProvider, ['Mod'])) {
          this.grabDependencies(targetProviders, srcModule, importedProvider, ['Mod']);
        }
      });
    });
    this.increaseExtensionCounters(targetProviders);
  }

  protected increaseExtensionCounters(baseMeta: BaseMeta) {
    const extensionsProviders = [...baseMeta.extensionsProviders];
    const uniqTargets = new Set<Provider>(getProvidersTargets(extensionsProviders));

    uniqTargets.forEach((target) => {
      const counter = this.extensionCounters.mExtensions.get(target) || 0;
      this.extensionCounters.mExtensions.set(target, counter + 1);
    });
  }

  /**
   * @param targetProviders These are metadata of the module where providers are imported.
   * @param srcModRefId Module from where imports providers.
   * @param importedProvider Imported provider.
   * @param levels Search in this levels. The level order is important.
   */
  grabDependencies(
    targetProviders: ProvidersOnly,
    srcModRefId: ModRefId,
    importedProvider: Provider,
    levels: Level[],
    path: any[] = [],
    childLevels: string[] = [],
  ) {
    const srcBaseMeta = this.moduleManager.getMetadata(srcModRefId, true);

    for (const dep of this.getDependencies(importedProvider)) {
      let found: boolean = false;
      if (this.extensionsTokens.includes(dep.token)) {
        continue;
      }

      for (const level of levels) {
        const srcProviders = getLastProviders(srcBaseMeta[`providersPer${level}`]);

        getTokens(srcProviders).forEach((srcToken, i) => {
          if (srcToken === dep.token) {
            const importedProvider2 = srcProviders[i];
            targetProviders[`providersPer${level}`].unshift(importedProvider2);
            found = true;
            this.grabDependenciesAgain(targetProviders, srcModRefId, importedProvider2, levels, path, childLevels);

            // The loop does not breaks because there may be multi providers.
          }
        });

        if (found) {
          break;
        }
      }

      if (!found && !this.tokensPerApp.includes(dep.token)) {
        this.grabImportedDependencies(targetProviders, srcModRefId, importedProvider, levels, path, dep, childLevels);
      }
    }
  }

  /**
   * @param targetProviders These are metadata of the module where providers are imported.
   * @param srcModRefId1 Module from where imports providers.
   * @param importedProvider Imported provider.
   * @param dep ReflectiveDependecy with token for dependecy of imported provider.
   */
  grabImportedDependencies(
    targetProviders: ProvidersOnly,
    srcModRefId1: ModRefId,
    importedProvider: Provider,
    levels: Level[],
    path: any[] = [],
    dep: ReflectiveDependency,
    childLevels: string[] = [],
  ) {
    let found = false;
    const metadataPerMod1 = this.shallowImports.get(srcModRefId1)!;
    for (const level of levels) {
      const importObj = metadataPerMod1.importedTokensMap[`per${level}`].get(dep.token);
      if (importObj) {
        found = true;
        path.push(dep.token);
        const { modRefId: modRefId2, providers: srcProviders2 } = importObj;
        targetProviders[`providersPer${level}`].unshift(...srcProviders2);

        // Loop for multi providers.
        for (const srcProvider2 of srcProviders2) {
          this.grabDependenciesAgain(targetProviders, modRefId2, srcProvider2, levels, path, childLevels);
        }
        break;
      }
    }

    if (!found && dep.required) {
      this.throwError(metadataPerMod1.baseMeta, importedProvider, path, dep.token, [...childLevels, ...levels]);
    }
  }

  protected grabDependenciesAgain(
    targetProviders: ProvidersOnly,
    srcModRefId: ModRefId,
    importedProvider: Provider,
    levels: Level[],
    path: any[],
    childLevels: string[] = [],
  ) {
    this.addToUnfinishedSearchDependencies(srcModRefId, importedProvider);
    this.grabDependencies(targetProviders, srcModRefId, importedProvider, levels, path, childLevels);
    this.deleteFromUnfinishedSearchDependencies(srcModRefId, importedProvider);
  }

  protected hasUnresolvedDependencies(modRefId: ModRefId, provider: Provider, levels: Level[]) {
    const meta = this.moduleManager.getMetadata(modRefId, true);

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
        if (this.hasUnresolvedImportedDependencies(modRefId, levels, dep)) {
          return true;
        }
      }
    }
    return false;
  }

  protected hasUnresolvedImportedDependencies(modRefId1: ModRefId, levels: Level[], dep: ReflectiveDependency) {
    let found = false;
    for (const level of levels) {
      const importObj = this.shallowImports.get(modRefId1)?.importedTokensMap[`per${level}`].get(dep.token);
      if (importObj) {
        found = true;
        const { modRefId: modRefId2, providers } = importObj;

        // Loop for multi providers.
        for (const provider of providers) {
          this.addToUnfinishedSearchDependencies(modRefId2, provider);
          found = !this.hasUnresolvedDependencies(modRefId2, provider, levels);
          this.deleteFromUnfinishedSearchDependencies(modRefId2, provider);
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

  protected throwError(baseMeta: BaseMeta, provider: Provider, path: any[], token: any, levels: string[]) {
    path = [provider, ...path, token];
    const strPath = getTokens(path)
      .map((t) => t.name || t)
      .join(' -> ');

    const levelsPath = levels
      .concat('App' as any)
      .map((level) => `providersPer${level}`)
      .join(', ');
    const partMsg = path.length > 1 ? `(required by ${strPath}). Searched in ${levelsPath}` : levelsPath;
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

  protected addToUnfinishedSearchDependencies(modRefId: ModRefId, provider: Provider) {
    const index = this.dependencyChain.findIndex(([m, p]) => m === modRefId && p === provider);
    if (index != -1) {
      this.throwCircularDependencies(index);
    }
    this.dependencyChain.push([modRefId, provider]);
  }

  protected deleteFromUnfinishedSearchDependencies(modRefId: ModRefId, provider: Provider) {
    const index = this.dependencyChain.findIndex(([m, p]) => m === modRefId && p === provider);
    this.dependencyChain.splice(index, 1);
  }

  protected throwCircularDependencies(index: number) {
    const items = this.dependencyChain;
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
