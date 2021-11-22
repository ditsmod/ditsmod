import { Injector, ReflectiveInjector } from '@ts-stack/di';

import { NODE_REQ, NODE_RES, PATH_PARAMS, QUERY_STRING } from './constans';
import { AppMetadataMap, ImportedProviders, ModuleType, ModuleWithParams, ServiceProvider } from './types/mix';
import { getUniqProviders } from './utils/get-uniq-providers';
import { defaultProvidersPerReq } from './services/default-providers-per-req';
import { ModuleManager } from './services/module-manager';
import { getTokens } from './utils/get-tokens';
import { MetadataPerMod1 } from './types/metadata-per-mod';
import { RouteMeta } from './types/route-data';
import { RootMetadata } from './models/root-metadata';
import { defaultProvidersPerApp } from './services/default-providers-per-app';
import { getModuleName } from './utils/get-module-name';
import { getProviderName } from './utils/get-provider-name';

type Scope = 'Mod' | 'Rou' | 'Req';

export class ImportsResolver {
  protected unfinishedSearchDependecies: [ModuleType | ModuleWithParams, ServiceProvider][] = [];

  constructor(
    private moduleManager: ModuleManager,
    protected appMetadataMap: AppMetadataMap,
    protected providersPerApp: ServiceProvider[]
  ) {}

  resolve() {
    this.appMetadataMap.forEach((metadataPerMod1) => {
      this.resolveImportedProviders(metadataPerMod1);
    });
  }

  protected resolveImportedProviders(metadataPerMod1: MetadataPerMod1) {
    const { importedProvidersMap, meta } = metadataPerMod1;
    const scopes: Scope[] = ['Req', 'Rou', 'Mod'];

    importedProvidersMap.forEach((importedProviders1, module) => {
      for (let i = 0; i < scopes.length; i++) {
        for (const provider of importedProviders1[`providersPer${scopes[i]}`]) {
          const importedProviders2 = this.searchInProviders(module, provider, scopes.slice(i));
          this.mergeImportedProviders(importedProviders1, importedProviders2);
        }
      }
      // Merge imported providers with existing providers
      scopes.forEach((scope) => {
        const localProviders = meta[`providersPer${scope}`];
        meta[`providersPer${scope}`] = [...importedProviders1[`providersPer${scope}`], ...localProviders];
      });
    });

    meta.providersPerReq.unshift(...defaultProvidersPerReq);
  }

  /**
   * @param module Module from where imports providers.
   * @param provider Imported provider.
   * @param scopes Search in this scopes. The scope order is important.
   */
  protected searchInProviders(
    module: ModuleType | ModuleWithParams,
    provider: ServiceProvider,
    scopes: Scope[],
    path: any[] = []
  ) {
    const meta = this.moduleManager.getMetadata(module);
    const importedProviders1 = new ImportedProviders();

    for (const token1 of this.getDependencies(provider)) {
      let found: boolean = false;

      for (const scope of scopes) {
        const providers = getUniqProviders(meta[`providersPer${scope}`]);

        getTokens(providers).forEach((token2, i) => {
          if (token2 === token1) {
            importedProviders1[`providersPer${scope}`].add(providers[i]);
            found = true;
            // The loop does not breaks because there may be multi providers.
          }
        });

        if (found) {
          break;
        }
      }

      if (!found) {
        found = getTokens(this.providersPerApp).includes(token1);
      }

      if (!found) {
        const importedProviders2 = this.searchInImports(module, scopes, token1, [...path, token1]);
        found = !!importedProviders2;
        if (found) {
          this.mergeImportedProviders(importedProviders1, importedProviders2!);
        }
      }
      if (!found) {
        this.throwError(provider, path, token1);
      }
    }

    return importedProviders1;
  }

  protected throwError(provider: ServiceProvider, path: any[], token: any) {
    path = [provider, ...path, token];
    const strPath = getTokens(path)
      .map((t) => t.name || t)
      .join(' -> ');

    const partMsg = path.length > 1 ? `(${strPath})` : '';
    throw new Error(`No provider for ${token.name || token}!${partMsg}`);
  }

  /**
   * @param module1 Module from where imports providers.
   */
  protected searchInImports(module1: ModuleType | ModuleWithParams, scopes: Scope[], token: any, path: any[] = []) {
    const importedProviders1 = new ImportedProviders();
    let found: boolean = false;

    for (const scope of scopes) {
      const importObj = this.appMetadataMap.get(module1)?.importedTokensMap[`per${scope}`].get(token);
      if (importObj) {
        found = true;
        const { module: module2, providers } = importObj;
        importedProviders1[`providersPer${scope}`] = new Set(providers);

        // Loop for multi providers.
        for (const provider of providers) {
          this.fixDependecy(module2, provider);
          const importedProviders2 = this.searchInProviders(module2, provider, scopes, path);
          this.unfixDependecy(module2, provider);
          this.mergeImportedProviders(importedProviders1, importedProviders2);
        }
        break;
      }
    }

    return found ? importedProviders1 : undefined;
  }

  protected mergeImportedProviders(importedProviders1: ImportedProviders, importedProviders2: ImportedProviders) {
    const scopes: Scope[] = ['Mod', 'Rou', 'Req'];
    scopes.forEach((scope) => {
      importedProviders1[`providersPer${scope}`] = new Set([
        ...importedProviders1[`providersPer${scope}`],
        ...importedProviders2[`providersPer${scope}`],
      ]);
    });
  }

  protected getDependencies(provider: ServiceProvider) {
    const deps = new Set<any>();

    ReflectiveInjector.resolve([provider]).forEach(({ resolvedFactories }) => {
      resolvedFactories.forEach((rf) => {
        rf.dependencies.forEach((dep) => {
          deps.add(dep.key.token);
        });
      });
    });

    return this.excludeDefaultTokens([...deps]);
  }

  protected fixDependecy(module: ModuleType | ModuleWithParams, provider: ServiceProvider) {
    const index = this.unfinishedSearchDependecies.findIndex(([m, p]) => m === module && p === provider);
    if (index != -1) {
      this.throwCyclicDependencies(index);
    }
    this.unfinishedSearchDependecies.push([module, provider]);
  }

  protected unfixDependecy(module: ModuleType | ModuleWithParams, provider: ServiceProvider) {
    const index = this.unfinishedSearchDependecies.findIndex(([m, p]) => m === module && p === provider);
    this.unfinishedSearchDependecies.splice(index, 1);
  }

  protected throwCyclicDependencies(index: number) {
    const items = this.unfinishedSearchDependecies;
    const prefixChain = items.slice(0, index);
    const cyclicChain = items.slice(index);
    const prefixNames = prefixChain.map(([m, p]) => `[${getProviderName(p)} in ${getModuleName(m)}]`).join(' -> ');
    const [module, provider] = items[index];
    let cyclicNames = cyclicChain.map(([m, p]) => `[${getProviderName(p)} in ${getModuleName(m)}]`).join(' -> ');
    cyclicNames += ` -> [${getProviderName(provider)} in ${getModuleName(module)}]`;
    let msg = `Detected cyclic dependencies: ${cyclicNames}.`;
    if (prefixNames) {
      msg += ` It is started from ${prefixNames}.`;
    }
    throw new Error(msg);
  }

  protected excludeDefaultTokens(tokens: any[]) {
    const someDefaultTokens = getTokens([...defaultProvidersPerApp, ...defaultProvidersPerReq]);
    const defaultTokens = [
      ...someDefaultTokens,
      NODE_REQ,
      NODE_RES,
      PATH_PARAMS,
      QUERY_STRING,
      Injector,
      RouteMeta,
      RootMetadata,
    ];
    return tokens.filter((t) => !defaultTokens.includes(t));
  }
}
