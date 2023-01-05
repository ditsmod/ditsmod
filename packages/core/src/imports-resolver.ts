import { Injector } from './di';

import { NormalizedModuleMetadata } from './models/normalized-module-metadata';
import { RootMetadata } from './models/root-metadata';
import { defaultExtensions, defaultExtensionsTokens } from './services/default-extensions';
import { defaultProvidersPerApp } from './services/default-providers-per-app';
import { defaultProvidersPerReq } from './services/default-providers-per-req';
import { ModuleManager } from './services/module-manager';
import { ImportedTokensMap } from './types/metadata-per-mod';
import { AppMetadataMap, ModuleType, ModuleWithParams, Scope, ServiceProvider } from './types/mix';
import { getDependencies, ReflectiveDependecy } from './utils/get-dependecies';
import { getLastProviders } from './utils/get-last-providers';
import { getModuleName } from './utils/get-module-name';
import { getProviderName } from './utils/get-provider-name';
import { getProvidersTargets, getTokens } from './utils/get-tokens';
import { isClassProvider, isTokenProvider, isFactoryProvider, isValueProvider } from './utils/type-guards';
import { SystemLogMediator } from './log-mediator/system-log-mediator';

type AnyModule = ModuleType | ModuleWithParams;

export class ImportsResolver {
  protected unfinishedSearchDependecies: [AnyModule, ServiceProvider][] = [];
  protected tokensPerApp: any[];
  protected meta: NormalizedModuleMetadata;
  protected extensionsTokens: any[] = [];
  protected mExtensionsCounters = new Map<ServiceProvider, number>();

  constructor(
    private moduleManager: ModuleManager,
    protected appMetadataMap: AppMetadataMap,
    protected providersPerApp: ServiceProvider[],
    protected log: SystemLogMediator
  ) {}

  resolve() {
    this.tokensPerApp = getTokens(this.providersPerApp);
    this.appMetadataMap.forEach((metadataPerMod1) => {
      const { importedTokensMap, meta } = metadataPerMod1;
      this.meta = meta;
      this.resolveImportedProviders(importedTokensMap, meta);
      this.resolveProvidersForExtensions(importedTokensMap, meta);
      meta.extensionsProviders.unshift(...defaultExtensions);
      meta.providersPerReq.unshift(...defaultProvidersPerReq);
    });

    return this.mExtensionsCounters;
  }

  protected resolveImportedProviders(importedTokensMap: ImportedTokensMap, meta: NormalizedModuleMetadata) {
    const scopes: Scope[] = ['Req', 'Rou', 'Mod'];

    scopes.forEach((scope, i) => {
      importedTokensMap[`per${scope}`].forEach((importObj) => {
        meta[`providersPer${scope}`].unshift(...importObj.providers);
        importObj.providers.forEach((provider) => {
          this.grabDependecies(importObj.module, provider, scopes.slice(i));
        });
      });
      importedTokensMap.extensions;
      importedTokensMap[`multiPer${scope}`].forEach((multiProviders, module) => {
        meta[`providersPer${scope}`].unshift(...multiProviders);
        multiProviders.forEach((provider) => {
          this.grabDependecies(module, provider, scopes.slice(i));
        });
      });
    });
  }

  protected resolveProvidersForExtensions(importedTokensMap: ImportedTokensMap, meta: NormalizedModuleMetadata) {
    const currentExtensionsTokens: any[] = [];
    importedTokensMap.extensions.forEach((providers) => {
      currentExtensionsTokens.push(...getTokens(providers));
    });
    this.extensionsTokens = getTokens([...defaultExtensionsTokens, ...currentExtensionsTokens]);

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
          this.grabDependecies(module, provider, ['Mod']);
        }
      });
    });
    this.increaseExtensionsCounters();
  }

  protected increaseExtensionsCounters() {
    const extensionsProviders = [...defaultExtensions, ...this.meta.extensionsProviders];
    const uniqTargets = new Set<ServiceProvider>(getProvidersTargets(extensionsProviders));

    uniqTargets.forEach((target) => {
      const counter = this.mExtensionsCounters.get(target) || 0;
      this.mExtensionsCounters.set(target, counter + 1);
    });
  }

  /**
   * @param module Module from where imports providers.
   * @param provider Imported provider.
   * @param scopes Search in this scopes. The scope order is important.
   */
  protected grabDependecies(module: AnyModule, provider: ServiceProvider, scopes: Scope[], path: any[] = []) {
    const meta = this.moduleManager.getMetadata(module, true);

    for (const dep of this.getDependencies(provider)) {
      let found: boolean = false;
      if (this.extensionsTokens.includes(dep.token)) {
        continue;
      }

      for (const scope of scopes) {
        const providers = getLastProviders(meta[`providersPer${scope}`]);

        getTokens(providers).forEach((token2, i) => {
          if (token2 === dep.token) {
            this.meta[`providersPer${scope}`].unshift(providers[i]);
            found = true;
            // The loop does not breaks because there may be multi providers.
          }
        });

        if (found) {
          break;
        }
      }

      if (!found && !this.tokensPerApp.includes(dep.token)) {
        this.grabImportedDependecies(module, scopes, provider, dep, path);
      }
    }
  }

  /**
   * @param module1 Module from where imports providers.
   * @param provider Imported provider.
   * @param dep ReflectiveDependecy with token for dependecy of imported provider.
   */
  protected grabImportedDependecies(
    module1: AnyModule,
    scopes: Scope[],
    provider: ServiceProvider,
    dep: ReflectiveDependecy,
    path: any[] = []
  ) {
    let found = false;
    for (const scope of scopes) {
      const importObj = this.appMetadataMap.get(module1)?.importedTokensMap[`per${scope}`].get(dep.token);
      if (importObj) {
        found = true;
        path.push(dep.token);
        const { module: module2, providers } = importObj;
        this.meta[`providersPer${scope}`].unshift(...providers);

        // Loop for multi providers.
        for (const provider of providers) {
          this.fixDependecy(module2, provider);
          this.grabDependecies(module2, provider, scopes, path);
          this.unfixDependecy(module2, provider);
        }
        break;
      }
    }

    if (!found && dep.required) {
      this.throwError(provider, path, dep.token);
    }
  }

  protected hasUnresolvedDependecies(module: AnyModule, provider: ServiceProvider, scopes: Scope[]) {
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

  protected throwError(provider: ServiceProvider, path: any[], token: any) {
    path = [provider, ...path, token];
    const strPath = getTokens(path)
      .map((t) => t.name || t)
      .join(' -> ');

    const partMsg = path.length > 1 ? `(${strPath})` : '';
    this.log.showProvidersInLogs(
      this,
      this.meta.name,
      this.meta.providersPerReq,
      this.meta.providersPerRou,
      this.meta.providersPerMod
    );

    this.log.throwNoProviderDuringResolveImports(this.meta.name, token.name || token, partMsg);
  }

  protected getDependencies(provider: ServiceProvider) {
    const deps = getDependencies(provider);

    const defaultTokens = [
      ...getTokens([...defaultProvidersPerApp, ...defaultProvidersPerReq]),
      Injector,
      RootMetadata,
    ];

    return deps.filter((d) => !defaultTokens.includes(d.token));
  }

  protected fixDependecy(module: AnyModule, provider: ServiceProvider) {
    const index = this.unfinishedSearchDependecies.findIndex(([m, p]) => m === module && p === provider);
    if (index != -1) {
      this.throwCircularDependencies(index);
    }
    this.unfinishedSearchDependecies.push([module, provider]);
  }

  protected unfixDependecy(module: AnyModule, provider: ServiceProvider) {
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
