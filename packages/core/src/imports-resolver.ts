import { Injector } from '@ts-stack/di';

import { NODE_REQ, NODE_RES, PATH_PARAMS, QUERY_STRING } from './constans';
import { AppMetadataMap, ModuleType, ModuleWithParams, Scope, ServiceProvider } from './types/mix';
import { getLastProviders } from './utils/get-last-providers';
import { defaultProvidersPerReq } from './services/default-providers-per-req';
import { ModuleManager } from './services/module-manager';
import { getProvidersTargets, getToken, getTokens } from './utils/get-tokens';
import { ImportedTokensMap } from './types/metadata-per-mod';
import { RouteMeta } from './types/route-data';
import { RootMetadata } from './models/root-metadata';
import { defaultProvidersPerApp } from './services/default-providers-per-app';
import { getModuleName } from './utils/get-module-name';
import { getProviderName } from './utils/get-provider-name';
import { defaultExtensions, defaultExtensionsTokens } from './services/default-extensions';
import { NormalizedModuleMetadata } from './models/normalized-module-metadata';
import { getDependencies } from './utils/get-dependecies';
import { LogMediator } from './services/log-mediator';

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
    protected logMediator: LogMediator
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
      const newProviders = providers.filter((p) => !meta.extensionsProviders.includes(p));
      meta.extensionsProviders.unshift(...newProviders);
      providers.forEach((provider) => {
        this.grabDependecies(module, provider, ['Mod']);
      });
    });
    this.increaseExtensionsCounters();
  }

  protected increaseExtensionsCounters() {
    const uniqTargets = new Set<ServiceProvider>(getProvidersTargets(this.meta.extensionsProviders));

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

    for (const token1 of this.getDependencies(provider)) {
      let found: boolean = false;
      if (this.extensionsTokens.includes(token1)) {
        continue;
      }

      for (const scope of scopes) {
        const providers = getLastProviders(meta[`providersPer${scope}`]);

        getTokens(providers).forEach((token2, i) => {
          if (token2 === token1) {
            this.meta[`providersPer${scope}`].unshift(providers[i]);
            found = true;
            // The loop does not breaks because there may be multi providers.
          }
        });

        if (found) {
          break;
        }
      }

      if (!found) {
        if (!this.tokensPerApp.includes(token1)) {
          this.grabImportedDependecies(module, scopes, provider, token1, path);
        }
      }
    }
  }

  /**
   * @param module1 Module from where imports providers.
   * @param provider Imported provider.
   * @param token A token for dependecy of imported provider.
   */
  protected grabImportedDependecies(
    module1: AnyModule,
    scopes: Scope[],
    provider: ServiceProvider,
    token: any,
    path: any[] = []
  ) {
    let found = false;
    for (const scope of scopes) {
      const importObj = this.appMetadataMap.get(module1)?.importedTokensMap[`per${scope}`].get(token);
      if (importObj) {
        found = true;
        path.push(token);
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

    if (!found) {
      this.throwError(provider, path, token);
    }
  }

  protected throwError(provider: ServiceProvider, path: any[], token: any) {
    path = [provider, ...path, token];
    const strPath = getTokens(path)
      .map((t) => t.name || t)
      .join(' -> ');

    const partMsg = path.length > 1 ? `(${strPath})` : '';
    throw new Error(`No provider for ${token.name || token}! ${partMsg}`);
  }

  protected getDependencies(provider: ServiceProvider) {
    const deps = getDependencies(provider);

    const defaultTokens = [
      ...getTokens([...defaultProvidersPerApp, ...defaultProvidersPerReq]),
      NODE_REQ,
      NODE_RES,
      PATH_PARAMS,
      QUERY_STRING,
      Injector,
      RouteMeta,
      RootMetadata,
    ];

    return [...deps].filter((t) => !defaultTokens.includes(t));
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
