import { Inject, Injectable, Injector, ReflectiveInjector } from '@ts-stack/di';

import { APP_METADATA_MAP, NODE_REQ, NODE_RES, PATH_PARAMS, QUERY_STRING } from './constans';
import { AppMetadataMap, ImportedProviders, ModuleType, ModuleWithParams, ServiceProvider } from './types/mix';
import { getUniqProviders } from './utils/get-uniq-providers';
import { defaultProvidersPerReq } from './services/default-providers-per-req';
import { ModuleManager } from './services/module-manager';
import { getTokens } from './utils/get-tokens';
import { MetadataPerMod1 } from './types/metadata-per-mod';
import { RouteMeta } from './types/route-data';
import { RootMetadata } from './models/root-metadata';
import { defaultProvidersPerApp } from './services/default-providers-per-app';
import { FilterConfig, Log } from './services/log';

type Scope = 'Mod' | 'Rou' | 'Req';

@Injectable()
export class ImportsResolver {
  constructor(
    private moduleManager: ModuleManager,
    @Inject(APP_METADATA_MAP) protected appMetadataMap: AppMetadataMap,
    private log: Log
  ) {}

  resolve() {
    const filterConfig: FilterConfig = { className: this.constructor.name };
    this.log.startingResolvingImports('debug', filterConfig);
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
    throw new Error(`No provider for ${token.name}!${partMsg}`);
  }

  protected searchInImports(module: ModuleType | ModuleWithParams, scopes: Scope[], token: any, path: any[] = []) {
    const importedProviders1 = new ImportedProviders();
    let found: boolean = false;

    for (const scope of scopes) {
      const importObj = this.appMetadataMap.get(module)?.importedTokensMap[`per${scope}`].get(token);
      if (importObj) {
        found = true;
        importedProviders1[`providersPer${scope}`] = new Set(importObj.providers);

        // Loop for multi providers.
        for (const provider of importObj.providers) {
          const importedProviders2 = this.searchInProviders(importObj.module, provider, scopes, path);
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
