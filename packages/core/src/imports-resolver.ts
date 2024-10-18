import { BeforeToken, InjectionToken, Injector } from '#di';

import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { defaultExtensionsProviders } from './default-extensions-providers.js';
import { defaultProvidersPerApp } from './default-providers-per-app.js';
import { defaultProvidersPerReq } from './default-providers-per-req.js';
import { ModuleManager } from './services/module-manager.js';
import { AppOptions } from './types/app-options.js';
import { ImportedTokensMap } from './types/metadata-per-mod.js';
import { AppMetadataMap, ModuleType, Scope, Provider } from './types/mix.js';
import { ModuleWithParams } from './types/module-metadata.js';
import { NormalizedModuleMetadata } from './types/normalized-module-metadata.js';
import { RouteMeta } from './types/route-data.js';
import { ReflectiveDependecy, getDependencies } from './utils/get-dependecies.js';
import { getLastProviders } from './utils/get-last-providers.js';
import { getModuleName } from './utils/get-module-name.js';
import { getProviderName } from './utils/get-provider-name.js';
import { getProvidersTargets, getTokens } from './utils/get-tokens.js';
import { isClassProvider, isFactoryProvider, isTokenProvider, isValueProvider } from './utils/type-guards.js';
import { SystemErrorMediator } from '#error/system-error-mediator.js';
import { defaultProvidersPerRou } from './default-providers-per-rou.js';
import { ExtensionCounters, ExtensionsGroupToken } from '#types/extension-types.js';

type AnyModule = ModuleType | ModuleWithParams;

export class ImportsResolver {
  protected unfinishedSearchDependecies: [AnyModule, Provider][] = [];
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
    this.tokensPerApp = getTokens(this.providersPerApp);
    this.appMetadataMap.forEach((metadataPerMod1) => {
      const { meta, importedTokensMap, guardsPerMod } = metadataPerMod1;
      this.resolveImportedProviders(meta, importedTokensMap);
      this.resolveProvidersForExtensions(meta, importedTokensMap);
      meta.providersPerRou.unshift(...defaultProvidersPerRou);
      meta.providersPerReq.unshift(...defaultProvidersPerReq);
    });

    return this.extensionCounters;
  }

  protected resolveImportedProviders(meta: NormalizedModuleMetadata, importedTokensMap: ImportedTokensMap) {
    const scopes: Scope[] = ['Req', 'Rou', 'Mod'];

    scopes.forEach((scope, i) => {
      importedTokensMap[`per${scope}`].forEach((importObj) => {
        meta[`providersPer${scope}`].unshift(...importObj.providers);
        importObj.providers.forEach((provider) => {
          this.grabDependecies(meta, importObj.module, provider, scopes.slice(i));
        });
      });
      importedTokensMap[`multiPer${scope}`].forEach((multiProviders, module) => {
        meta[`providersPer${scope}`].unshift(...multiProviders);
        multiProviders.forEach((provider) => {
          this.grabDependecies(meta, module, provider, scopes.slice(i));
        });
      });
    });
  }

  protected resolveProvidersForExtensions(meta: NormalizedModuleMetadata, importedTokensMap: ImportedTokensMap) {
    const currentExtensionsTokens: any[] = [];
    importedTokensMap.extensions.forEach((providers) => {
      currentExtensionsTokens.push(...getTokens(providers));
    });
    this.extensionsTokens = getTokens([...defaultExtensionsProviders, ...currentExtensionsTokens]);

    importedTokensMap.extensions.forEach((providers, module) => {
      const newProviders = providers.filter((np) => {
        for (const ep of meta.extensionsProviders) {
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
      meta.extensionsProviders.unshift(...newProviders);
      providers.forEach((provider) => {
        if (this.hasUnresolvedDependecies(meta.module, provider, ['Mod'])) {
          this.grabDependecies(meta, module, provider, ['Mod']);
        }
      });
    });
    this.increaseExtensionCounters(meta);
  }

  protected increaseExtensionCounters(meta: NormalizedModuleMetadata) {
    const extensionsProviders = [...meta.extensionsProviders];
    const uniqTargets = new Set<Provider>(getProvidersTargets(extensionsProviders));
    const uniqGroupTokens = new Set<ExtensionsGroupToken>(
      getTokens(extensionsProviders).filter((token) => token instanceof InjectionToken || token instanceof BeforeToken),
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
   * @param module Module from where imports providers.
   * @param provider Imported provider.
   * @param scopes Search in this scopes. The scope order is important.
   */
  protected grabDependecies(
    meta: NormalizedModuleMetadata,
    module: AnyModule,
    provider: Provider,
    scopes: Scope[],
    path: any[] = [],
  ) {
    const meta2 = this.moduleManager.getMetadata(module, true);

    for (const dep of this.getDependencies(provider)) {
      let found: boolean = false;
      if (this.extensionsTokens.includes(dep.token)) {
        continue;
      }

      for (const scope of scopes) {
        const providers = getLastProviders(meta2[`providersPer${scope}`]);

        getTokens(providers).forEach((token2, i) => {
          if (token2 === dep.token) {
            meta[`providersPer${scope}`].unshift(providers[i]);
            found = true;
            // The loop does not breaks because there may be multi providers.
          }
        });

        if (found) {
          break;
        }
      }

      if (!found && !this.tokensPerApp.includes(dep.token)) {
        this.grabImportedDependecies(meta, module, scopes, provider, dep, path);
      }
    }
  }

  /**
   * @param module1 Module from where imports providers.
   * @param provider Imported provider.
   * @param dep ReflectiveDependecy with token for dependecy of imported provider.
   */
  protected grabImportedDependecies(
    meta: NormalizedModuleMetadata,
    module1: AnyModule,
    scopes: Scope[],
    provider: Provider,
    dep: ReflectiveDependecy,
    path: any[] = [],
  ) {
    let found = false;
    for (const scope of scopes) {
      const importObj = this.appMetadataMap.get(module1)?.importedTokensMap[`per${scope}`].get(dep.token);
      if (importObj) {
        found = true;
        path.push(dep.token);
        const { module: module2, providers } = importObj;
        meta[`providersPer${scope}`].unshift(...providers);

        // Loop for multi providers.
        for (const provider of providers) {
          this.fixDependecy(module2, provider);
          this.grabDependecies(meta, module2, provider, scopes, path);
          this.unfixDependecy(module2, provider);
        }
        break;
      }
    }

    if (!found && dep.required) {
      this.throwError(meta, provider, path, dep.token);
    }
  }

  protected hasUnresolvedDependecies(module: AnyModule, provider: Provider, scopes: Scope[]) {
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

  protected hasUnresolvedImportedDependecies(module1: AnyModule, scopes: Scope[], dep: ReflectiveDependecy) {
    let found = false;
    for (const scope of scopes) {
      const importObj = this.appMetadataMap.get(module1)?.importedTokensMap[`per${scope}`].get(dep.token);
      if (importObj) {
        found = true;
        const { module: module2, providers } = importObj;

        // Loop for multi providers.
        for (const provider of providers) {
          this.fixDependecy(module2, provider);
          found = !this.hasUnresolvedDependecies(module2, provider, scopes);
          this.unfixDependecy(module2, provider);
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

  protected throwError(meta: NormalizedModuleMetadata, provider: Provider, path: any[], token: any) {
    path = [provider, ...path, token];
    const strPath = getTokens(path)
      .map((t) => t.name || t)
      .join(' -> ');

    const partMsg = path.length > 1 ? `(${strPath})` : '';
    this.log.showProvidersInLogs(this, meta.name, meta.providersPerReq, meta.providersPerRou, meta.providersPerMod);

    this.errorMediator.throwNoProviderDuringResolveImports(meta.name, token.name || token, partMsg);
  }

  protected getDependencies(provider: Provider) {
    const deps = getDependencies(provider);

    const defaultTokens = [
      ...getTokens([...defaultProvidersPerApp, ...defaultProvidersPerReq]),
      Injector,
      AppOptions,
      RouteMeta,
    ];

    return deps.filter((d) => !defaultTokens.includes(d.token));
  }

  protected fixDependecy(module: AnyModule, provider: Provider) {
    const index = this.unfinishedSearchDependecies.findIndex(([m, p]) => m === module && p === provider);
    if (index != -1) {
      this.throwCircularDependencies(index);
    }
    this.unfinishedSearchDependecies.push([module, provider]);
  }

  protected unfixDependecy(module: AnyModule, provider: Provider) {
    const index = this.unfinishedSearchDependecies.findIndex(([m, p]) => m === module && p === provider);
    this.unfinishedSearchDependecies.splice(index, 1);
  }

  protected throwCircularDependencies(index: number) {
    const items = this.unfinishedSearchDependecies;
    const prefixChain = items.slice(0, index);
    const circularChain = items.slice(index);
    const prefixNames = prefixChain.map(([m, p]) => `[${getProviderName(p)} in ${getModuleName(m)}]`).join(' -> ');
    const [module, provider] = items[index];
    let circularNames = circularChain.map(([m, p]) => `[${getProviderName(p)} in ${getModuleName(m)}]`).join(' -> ');
    circularNames += ` -> [${getProviderName(provider)} in ${getModuleName(module)}]`;
    let msg = `Detected circular dependencies: ${circularNames}.`;
    if (prefixNames) {
      msg += ` It is started from ${prefixNames}.`;
    }
    throw new Error(msg);
  }
}
