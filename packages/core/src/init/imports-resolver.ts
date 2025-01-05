import { InjectionToken, Injector } from '#di';

import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { defaultExtensionsProviders } from '#extension/default-extensions-providers.js';
import { defaultProvidersPerApp } from './default-providers-per-app.js';
import { defaultProvidersPerReq } from './default-providers-per-req.js';
import { ModuleManager } from '#init/module-manager.js';
import { AppOptions } from '#types/app-options.js';
import { ImportedTokensMap, MetadataPerMod2 } from '#types/metadata-per-mod.js';
import { AppMetadataMap, Scope, Provider, ProvidersForMod, ModRefId } from '#types/mix.js';
import { NormalizedModuleMetadata } from '#types/normalized-module-metadata.js';
import { ReflectiveDependency, getDependencies } from '#utils/get-dependecies.js';
import { getLastProviders } from '#utils/get-last-providers.js';
import { getProviderName } from '#utils/get-provider-name.js';
import { getProvidersTargets, getTokens } from '#utils/get-tokens.js';
import { isClassProvider, isFactoryProvider, isTokenProvider, isValueProvider } from '#di';
import { SystemErrorMediator } from '#error/system-error-mediator.js';
import { defaultProvidersPerRou } from './default-providers-per-rou.js';
import { ExtensionCounters, ExtensionsGroupToken } from '#extension/extension-types.js';
import { getDebugClassName } from '#utils/get-debug-class-name.js';

export class ImportsResolver {
  protected unfinishedSearchDependecies: [ModRefId, Provider][] = [];
  protected tokensPerApp: any[];
  protected extensionsTokens: any[] = [];
  protected extensionCounters = new ExtensionCounters();

  constructor(
    private moduleManager: ModuleManager,
    protected appMetadataMap: AppMetadataMap,
    protected providersPerApp: Provider[],
    protected log: SystemLogMediator,
    protected errorMediator: SystemErrorMediator,
  ) {}

  resolve() {
    const scopes: Scope[] = ['Req', 'Rou', 'Mod'];
    const mMetadataPerMod2 = new Map<ModRefId, MetadataPerMod2>();
    this.tokensPerApp = getTokens(this.providersPerApp);
    this.appMetadataMap.forEach((metadataPerMod1) => {
      const { meta, importedTokensMap, guardsPerMod1, applyControllers, prefixPerMod } = metadataPerMod1;
      mMetadataPerMod2.set(meta.modRefId, {
        meta,
        guardsPerMod1,
        applyControllers,
        prefixPerMod,
      });
      this.resolveImportedProviders(meta, importedTokensMap, scopes);
      this.resolveProvidersForExtensions(meta, importedTokensMap);
      meta.providersPerRou.unshift(...defaultProvidersPerRou);
      meta.providersPerReq.unshift(...defaultProvidersPerReq);
    });

    return { extensionCounters: this.extensionCounters, mMetadataPerMod2 };
  }

  protected resolveImportedProviders(
    targetProviders: NormalizedModuleMetadata,
    importedTokensMap: ImportedTokensMap,
    scopes: Scope[],
  ) {
    scopes.forEach((scope, i) => {
      importedTokensMap[`per${scope}`].forEach((importObj) => {
        targetProviders[`providersPer${scope}`].unshift(...importObj.providers);
        importObj.providers.forEach((importedProvider) => {
          this.grabDependecies(targetProviders, importObj.modRefId, importedProvider, scopes.slice(i));
        });
      });

      importedTokensMap[`multiPer${scope}`].forEach((multiProviders, sourceModule) => {
        targetProviders[`providersPer${scope}`].unshift(...multiProviders);
        multiProviders.forEach((importedProvider) => {
          this.grabDependecies(targetProviders, sourceModule, importedProvider, scopes.slice(i));
        });
      });
    });
  }

  protected resolveProvidersForExtensions(
    targetProviders: NormalizedModuleMetadata,
    importedTokensMap: ImportedTokensMap,
  ) {
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

  protected increaseExtensionCounters(meta: NormalizedModuleMetadata) {
    const extensionsProviders = [...meta.extensionsProviders];
    const uniqTargets = new Set<Provider>(getProvidersTargets(extensionsProviders));
    const uniqGroupTokens = new Set<ExtensionsGroupToken>(
      getTokens(extensionsProviders).filter((token) => token instanceof InjectionToken),
    );

    uniqGroupTokens.forEach((groupToken) => {
      const counter = this.extensionCounters.mGroupTokens.get(groupToken) || 0;
      this.extensionCounters.mGroupTokens.set(groupToken, counter + 1);
    });

    uniqTargets.forEach((target) => {
      const counter = this.extensionCounters.mExtensions.get(target) || 0;
      this.extensionCounters.mExtensions.set(target, counter + 1);
    });
  }

  /**
   * @param targetProviders These are metadata of the module where providers are imported.
   * @param sourceModule Module from where imports providers.
   * @param importedProvider Imported provider.
   * @param scopes Search in this scopes. The scope order is important.
   */
  protected grabDependecies(
    targetProviders: ProvidersForMod,
    sourceModule: ModRefId,
    importedProvider: Provider,
    scopes: Scope[],
    path: any[] = [],
  ) {
    const sourceMeta = this.moduleManager.getMetadata(sourceModule, true);

    for (const dep of this.getDependencies(importedProvider)) {
      let found: boolean = false;
      if (this.extensionsTokens.includes(dep.token)) {
        continue;
      }

      for (const scope of scopes) {
        const sourceProviders = getLastProviders(sourceMeta[`providersPer${scope}`]);

        getTokens(sourceProviders).forEach((sourceToken, i) => {
          if (sourceToken === dep.token) {
            const importedProvider2 = sourceProviders[i];
            targetProviders[`providersPer${scope}`].unshift(importedProvider2);
            found = true;
            this.grabDependeciesAgain(targetProviders, sourceModule, importedProvider2, scopes, path);

            // The loop does not breaks because there may be multi providers.
          }
        });

        if (found) {
          break;
        }
      }

      if (!found && !this.tokensPerApp.includes(dep.token)) {
        this.grabImportedDependecies(targetProviders, sourceModule, importedProvider, scopes, path, dep);
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
    scopes: Scope[],
    path: any[] = [],
    dep: ReflectiveDependency,
  ) {
    let found = false;
    const metadataPerMod1 = this.appMetadataMap.get(sourceModule1)!;
    for (const scope of scopes) {
      const importObj = metadataPerMod1.importedTokensMap[`per${scope}`].get(dep.token);
      if (importObj) {
        found = true;
        path.push(dep.token);
        const { modRefId: modRefId2, providers: sourceProviders2 } = importObj;
        targetProviders[`providersPer${scope}`].unshift(...sourceProviders2);

        // Loop for multi providers.
        for (const sourceProvider2 of sourceProviders2) {
          this.grabDependeciesAgain(targetProviders, modRefId2, sourceProvider2, scopes, path);
        }
        break;
      }
    }

    if (!found && dep.required) {
      this.throwError(metadataPerMod1.meta, importedProvider, path, dep.token, scopes);
    }
  }

  protected grabDependeciesAgain(
    targetProviders: ProvidersForMod,
    sourceModule: ModRefId,
    importedProvider: Provider,
    scopes: Scope[],
    path: any[],
  ) {
    this.addToUnfinishedSearchDependecies(sourceModule, importedProvider);
    this.grabDependecies(targetProviders, sourceModule, importedProvider, scopes, path);
    this.deleteFromUnfinishedSearchDependecies(sourceModule, importedProvider);
  }

  protected hasUnresolvedDependecies(module: ModRefId, provider: Provider, scopes: Scope[]) {
    const meta = this.moduleManager.getMetadata(module, true);

    for (const dep of this.getDependencies(provider)) {
      let found: boolean = false;
      if (this.extensionsTokens.includes(dep.token)) {
        continue;
      }

      forScope: for (const scope of scopes) {
        const providers = getLastProviders(meta[`providersPer${scope}`]);

        for (const token of getTokens(providers)) {
          if (token === dep.token) {
            found = true;
            break forScope;
          }
        }
      }

      if (!found && !this.tokensPerApp.includes(dep.token)) {
        if (this.hasUnresolvedImportedDependecies(module, scopes, dep)) {
          return true;
        }
      }
    }
    return false;
  }

  protected hasUnresolvedImportedDependecies(module1: ModRefId, scopes: Scope[], dep: ReflectiveDependency) {
    let found = false;
    for (const scope of scopes) {
      const importObj = this.appMetadataMap.get(module1)?.importedTokensMap[`per${scope}`].get(dep.token);
      if (importObj) {
        found = true;
        const { modRefId: modRefId2, providers } = importObj;

        // Loop for multi providers.
        for (const provider of providers) {
          this.addToUnfinishedSearchDependecies(modRefId2, provider);
          found = !this.hasUnresolvedDependecies(modRefId2, provider, scopes);
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

  protected throwError(meta: NormalizedModuleMetadata, provider: Provider, path: any[], token: any, scopes: Scope[]) {
    path = [provider, ...path, token];
    const strPath = getTokens(path)
      .map((t) => t.name || t)
      .join(' -> ');

    const scopesPath = scopes
      .concat('App' as any)
      .map((scope) => `providersPer${scope}`)
      .join(', ');
    const partMsg = path.length > 1 ? `(${strPath}, searching in ${scopesPath})` : scopesPath;
    this.log.showProvidersInLogs(this, meta.name, meta.providersPerReq, meta.providersPerRou, meta.providersPerMod);

    this.errorMediator.throwNoProviderDuringResolveImports(meta.name, token.name || token, partMsg);
  }

  protected getDependencies(provider: Provider) {
    const deps = getDependencies(provider);

    const defaultTokens = [
      ...getTokens([...defaultProvidersPerApp, ...defaultProvidersPerReq]),
      Injector,
      AppOptions,
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
