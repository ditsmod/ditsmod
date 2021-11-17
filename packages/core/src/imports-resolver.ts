import { Inject, Injectable, Injector, ReflectiveInjector, Type } from '@ts-stack/di';

import { APP_METADATA_MAP, NODE_REQ, NODE_RES, PATH_PARAMS, QUERY_STRING } from './constans';
import { RootMetadata } from './models/root-metadata';
import { AppMetadataMap, ImportedProviders, ModuleType, ModuleWithParams, ServiceProvider } from './types/mix';
import { RouteMeta } from './types/route-data';
import { getUniqProviders } from './utils/get-uniq-providers';
import { normalizeProviders } from './utils/ng-utils';
import { defaultProvidersPerReq } from './services/default-providers-per-req';
import { Log } from './services/log';
import { ModuleManager } from './services/module-manager';

@Injectable()
export class ImportsResolver {
  constructor(
    private moduleManager: ModuleManager,
    @Inject(APP_METADATA_MAP) protected appMetadataMap: AppMetadataMap
  ) {}

  resolveImports() {
    this.appMetadataMap.forEach(({ importedProvidersMap, meta }) => {
      this.resolveImportedProviders(importedProvidersMap);
    });
  }

  protected resolveImportedProviders(map: Map<ModuleType | ModuleWithParams, ImportedProviders>) {
    map.forEach(({ providersPerMod, providersPerRou, providersPerReq }, module) => {
      const depsPerMod = this.getDeps(providersPerMod);
      const depsPerRou = this.getDeps(providersPerRou);
      const depsPerReq = this.getDeps(providersPerReq);
      if ([...depsPerMod, ...depsPerRou, ...depsPerReq].length) {
        console.log('='.repeat(80));
        console.log(module);
      }
      this.searchDeps(module, depsPerMod, ['Mod']);
      this.searchDeps(module, depsPerRou, ['Rou', 'Mod']);
      this.searchDeps(module, depsPerReq, ['Req', 'Rou', 'Mod']);
    });
  }

  protected getDeps(providers: Set<ServiceProvider>, allDeps?: boolean, allTokens: Set<any> = new Set()): Set<any> {
    const resolved = ReflectiveInjector.resolve(Array.from(providers));
    const restProviders = new Set<any>();

    resolved.forEach(({ resolvedFactories }) =>
      resolvedFactories.forEach((rf) =>
        rf.dependencies.forEach((dep) => {
          const { token } = dep.key;
          allTokens.add(token);
          if (token instanceof Type) {
            restProviders.add(token);
          }
        })
      )
    );

    allTokens = this.excludeDefaultTokens(allTokens);

    if (allDeps && restProviders.size) {
      return this.getDeps(restProviders, true, allTokens);
    } else {
      return allTokens;
    }
  }

  protected excludeDefaultTokens(tokens: Set<any>) {
    const someDefaultTokensPerReq = normalizeProviders([...defaultProvidersPerReq]).map((np) => np.provide);
    const defaultTokens = [
      ...someDefaultTokensPerReq,
      NODE_REQ,
      NODE_RES,
      PATH_PARAMS,
      QUERY_STRING,
      Injector,
      Log,
      RouteMeta,
      RootMetadata,
    ];
    const arr = Array.from(tokens).filter((t) => !defaultTokens.includes(t));
    return new Set(arr);
  }

  /**
   * @param module Module from where imports providers.
   * @param deps Dependencies of imported providers.
   * @param scopes Search in this scopes. The scope order is important. This is the order in
   * which the search will be conducted.
   */
  protected searchDeps(module: ModuleType | ModuleWithParams, deps: Set<any>, scopes: ('Mod' | 'Rou' | 'Req')[]) {
    const meta = this.moduleManager.getMetadata(module);
    const importedProviders = new Set<ServiceProvider>();
    deps.forEach((token) => {
      let found: boolean = false;
      scopesLoop: for (const scope of scopes) {
        const providers = getUniqProviders(meta[`providersPer${scope}`]);
        const tokens = normalizeProviders(providers).map((p) => p.provide);
        const len = tokens.length;
        for (let i = 0; i < len; i++) {
          if (tokens[i] === token) {
            importedProviders.add(providers[i]);
            found = true;
            break scopesLoop;
          }
        }
      }
      if (!found) {
        console.log('not found', token);
      } else {
        console.log('done!', token);
      }
    });
  }
}
