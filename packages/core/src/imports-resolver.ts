import { Inject, Injectable, ReflectiveInjector } from '@ts-stack/di';

import { APP_METADATA_MAP } from './constans';
import { AppMetadataMap, ImportedProviders, ModuleType, ModuleWithParams, ServiceProvider } from './types/mix';
import { getUniqProviders } from './utils/get-uniq-providers';
import { defaultProvidersPerReq } from './services/default-providers-per-req';
import { ModuleManager } from './services/module-manager';
import { getToken, getTokens } from './utils/get-tokens';
import { MetadataPerMod1 } from './types/metadata-per-mod';

@Injectable()
export class ImportsResolver {
  constructor(
    private moduleManager: ModuleManager,
    @Inject(APP_METADATA_MAP) protected appMetadataMap: AppMetadataMap
  ) {}

  resolveImports() {
    this.appMetadataMap.forEach((metadataPerMod1) => {
      this.resolveImportedProviders(metadataPerMod1);
    });
  }

  /**
   * @param importedProvidersMap Imported providers map for current module.
   * @param meta NormalizedModuleMetadata for current module.
   */
  protected resolveImportedProviders(metadataPerMod1: MetadataPerMod1) {
    const { importedProvidersMap, meta } = metadataPerMod1;
    console.log('='.repeat(80));
    console.log('current:', meta.name);

    importedProvidersMap.forEach((importedProviders1, module) => {
      console.log('imports:', (module as ModuleType).name);

      const { providersPerMod, providersPerRou, providersPerReq } = importedProviders1;
      for (const provider of providersPerMod) {
        const importedProviders2 = this.searchInProviders(module, provider, ['Mod']);
        this.mergeImportedProviders(importedProviders1, importedProviders2);
      }
      for (const provider of providersPerRou) {
        const importedProviders2 = this.searchInProviders(module, provider, ['Rou', 'Mod']);
        this.mergeImportedProviders(importedProviders1, importedProviders2);
      }
      for (const provider of providersPerReq) {
        const importedProviders2 = this.searchInProviders(module, provider, ['Req', 'Rou', 'Mod']);
        this.mergeImportedProviders(importedProviders1, importedProviders2);
      }
      meta.providersPerMod = [...Array.from(importedProviders1.providersPerMod), ...meta.providersPerMod];
      meta.providersPerRou = [...Array.from(importedProviders1.providersPerRou), ...meta.providersPerRou];
      meta.providersPerReq = [...Array.from(importedProviders1.providersPerReq), ...meta.providersPerReq];
    });
    meta.providersPerReq.unshift(...defaultProvidersPerReq);
  }

  /**
   * @param module Module from where imports providers.
   * @param providers Imported providers.
   * @param scopes Search in this scopes. The scope order is important. This is the order in
   * which the search will be conducted.
   */
  protected searchInProviders(
    module: ModuleType | ModuleWithParams,
    provider: ServiceProvider,
    scopes: ('Mod' | 'Rou' | 'Req')[],
    path: any[] = []
  ) {
    const meta = this.moduleManager.getMetadata(module);
    const importedProviders1 = new ImportedProviders();

    dependenciesLoop: for (const token of this.getDependencies(provider)) {
      let found: boolean = false;
      for (const scope of scopes) {
        const providers = getUniqProviders(meta[`providersPer${scope}`]);
        const tokens = getTokens(providers);
        const len = tokens.length;
        for (let i = 0; i < len; i++) {
          if (tokens[i] === token) {
            importedProviders1[`providersPer${scope}`].add(providers[i]);
            found = true;
            // The loop does not breaks because there may be multi providers.
          }
        }
      }

      if (!found) {
        const importedProviders2 = this.searchInImports(module, scopes, token, [...path, token]);
        found = !!importedProviders2;
        if (found) {
          this.mergeImportedProviders(importedProviders1, importedProviders2!);
        }
      }
      if (!found) {
        const strPath = getTokens([getToken(provider), ...path, token])
          .map((t) => t.name || t)
          .join(' -> ');
        console.log(`not found ${token.name}!`, [getToken(provider), ...path, token].length > 1 ? `(${strPath})` : '');
        break dependenciesLoop;
      } else {
        console.log('done:', token.name);
      }
    }

    return importedProviders1;
  }

  protected searchInImports(
    module: ModuleType | ModuleWithParams,
    scopes: ('Mod' | 'Rou' | 'Req')[],
    token: any,
    path: any[] = []
  ) {
    const importedProviders1 = new ImportedProviders();
    let found: boolean = false;
    for (const scope of scopes) {
      const importObj = this.appMetadataMap.get(module)?.importedTokensMap[`per${scope}`].get(token);
      if (importObj) {
        found = true;
        const providers = [...Array.from(importedProviders1[`providersPer${scope}`]), ...importObj.providers];
        importedProviders1[`providersPer${scope}`] = new Set(providers);
        for (const provider of importObj.providers) {
          const importedProviders2 = this.searchInProviders(importObj.module, provider, scopes, path);
          this.mergeImportedProviders(importedProviders1, importedProviders2);
        }
      }
    }

    return found ? importedProviders1 : undefined;
  }

  protected mergeImportedProviders(importedProviders1: ImportedProviders, importedProviders2: ImportedProviders) {
    const scopes: ('Mod' | 'Rou' | 'Req')[] = ['Mod', 'Rou', 'Req'];
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

    return Array.from(deps);
  }
}
