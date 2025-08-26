import {
  Provider,
  ModRefId,
  ModuleManager,
  isModuleWithParams,
  getTokens,
  getToken,
  getDebugClassName,
  reflector,
  hasDeclaredInDir,
  getCollisions,
  isRootModule,
  BaseMeta,
  GlobalProviders,
  getLastProviders,
  defaultProvidersPerMod,
  getProxyForInitMeta,
  GlobalInitHooks,
  ProviderImport,
} from '@ditsmod/core';
import {
  CannotResolveCollisionForMultiProviderPerLevel,
  FalseResolvedCollisions,
  ProvidersCollision,
  ResolvingCollisionsNotExistsOnThisLevel,
  ResolvingCollisionsNotImportedInApplication,
  ResolvingCollisionsNotImportedInModule,
} from '@ditsmod/core/errors';

import {
  ImportModulesShallowConfig,
  initTrpc,
  TrpcInitHooksAndRawMeta,
  TrpcInitMeta,
  TrpcModRefId,
} from '../decorators/trpc-init-hooks-and-metadata.js';
import { Level } from './trpc-module-normalizer.js';

export function getImportedTokens(map: Map<any, ProviderImport<Provider>> | undefined) {
  return [...(map || []).keys()];
}

export function getImportedProviders(map: Map<any, ProviderImport<Provider>> | undefined) {
  const providers: Provider[] = [];
  for (const providerImport of (map || []).values()) {
    providers.push(...providerImport.providers);
  }
  return providers;
}

export class TrpcProviderImport<T extends Provider = Provider> {
  modRefId: TrpcModRefId;
  /**
   * This property can have more than one element for multi-providers only.
   */
  providers: T[] = [];
}
/**
 * Metadata collected using `ShallowModulesImporter`. The target for this metadata is `DeepModulesImporter`.
 */
export class TrpcShallowImports {
  baseMeta: BaseMeta;
  prefixPerMod: string;
  // guards1: GuardPerMod1[];
  /**
   * Snapshot of `TrpcInitMeta`. If you modify any array in this object,
   * the original array will remain unchanged.
   */
  meta: TrpcInitMeta;
  /**
   * Map between a token and its ProviderImport per level.
   */
  baseImportRegistry: TrpcBaseImportRegistry;
  applyControllers?: boolean;
}

export interface TrpcBaseImportRegistry {
  perMod: Map<any, TrpcProviderImport>;
  perRou: Map<any, TrpcProviderImport>;
  perReq: Map<any, TrpcProviderImport>;
  multiPerMod: Map<TrpcModRefId, Provider[]>;
  multiPerRou: Map<TrpcModRefId, Provider[]>;
  multiPerReq: Map<TrpcModRefId, Provider[]>;
}

export class TrpcProvidersOnly {
  providersPerMod: Provider[] = [];
  providersPerRou: Provider[] = [];
  providersPerReq: Provider[] = [];
}

export class TrpcGlobalProviders extends GlobalInitHooks {
  importedProvidersPerMod = new Map<any, TrpcProviderImport>();
  importedProvidersPerRou = new Map<any, TrpcProviderImport>();
  importedProvidersPerReq = new Map<any, TrpcProviderImport>();
  importedMultiProvidersPerMod = new Map<TrpcModRefId, Provider[]>();
  importedMultiProvidersPerRou = new Map<TrpcModRefId, Provider[]>();
  importedMultiProvidersPerReq = new Map<TrpcModRefId, Provider[]>();
}

/**
 * Recursively collects providers taking into account module imports/exports,
 * but does not take provider dependencies into account.
 *
 * Also:
 * - exports global providers;
 * - merges global and local providers;
 * - checks on providers collisions.
 */
export class TrpcShallowModulesImporter {
  protected moduleName: string;
  protected prefixPerMod: string;
  // protected guards1: GuardPerMod1[];
  protected baseMeta: BaseMeta;
  protected meta: TrpcInitMeta;
  protected providersPerApp: Provider[];

  protected importedProvidersPerMod = new Map<any, TrpcProviderImport>();
  protected importedProvidersPerRou = new Map<any, TrpcProviderImport>();
  protected importedProvidersPerReq = new Map<any, TrpcProviderImport>();
  protected importedMultiProvidersPerMod = new Map<ModRefId, Provider[]>();
  protected importedMultiProvidersPerRou = new Map<ModRefId, Provider[]>();
  protected importedMultiProvidersPerReq = new Map<ModRefId, Provider[]>();

  /**
   * GlobalProviders.
   */
  protected glProviders: GlobalProviders;
  protected trpcGlProviders: TrpcGlobalProviders;
  protected shallowImportsMap = new Map<ModRefId, TrpcShallowImports>();
  protected unfinishedScanModules = new Set<ModRefId>();
  protected unfinishedExportModules = new Set<ModRefId>();
  protected moduleManager: ModuleManager;
  protected resolvedCollisions = new Map<any, Set<Level>>();

  exportGlobalProviders({
    moduleManager,
    globalProviders,
    baseMeta,
  }: {
    moduleManager: ModuleManager;
    globalProviders: GlobalProviders;
    baseMeta: BaseMeta;
  }): TrpcGlobalProviders {
    this.moduleManager = moduleManager;
    this.glProviders = globalProviders;
    this.providersPerApp = moduleManager.providersPerApp;
    this.moduleName = baseMeta.name;
    this.baseMeta = baseMeta;
    this.meta = this.getInitMeta(baseMeta);
    this.importProviders(baseMeta);
    this.checkAllCollisionsWithLevelsMix();

    let initHooks: TrpcInitHooksAndRawMeta | undefined;
    if (
      this.importedProvidersPerMod.size ||
      this.importedProvidersPerRou.size ||
      this.importedProvidersPerReq.size ||
      this.importedMultiProvidersPerMod.size ||
      this.importedMultiProvidersPerRou.size ||
      this.importedMultiProvidersPerReq.size
    ) {
      initHooks = new TrpcInitHooksAndRawMeta({});
    }

    return {
      initHooks,
      importedProvidersPerMod: this.importedProvidersPerMod,
      importedProvidersPerRou: this.importedProvidersPerRou,
      importedProvidersPerReq: this.importedProvidersPerReq,
      importedMultiProvidersPerMod: this.importedMultiProvidersPerMod,
      importedMultiProvidersPerRou: this.importedMultiProvidersPerRou,
      importedMultiProvidersPerReq: this.importedMultiProvidersPerReq,
    };
  }

  /**
   * @param modRefId Module that will bootstrapped.
   */
  importModulesShallow({
    moduleManager,
    providersPerApp,
    globalProviders,
    modRefId,
    unfinishedScanModules,
    prefixPerMod,
    // guards1,
    isAppends,
  }: ImportModulesShallowConfig): Map<ModRefId, TrpcShallowImports> {
    this.moduleManager = moduleManager;
    this.providersPerApp = providersPerApp;
    const baseMeta = this.moduleManager.getBaseMeta(modRefId, true);
    this.baseMeta = baseMeta;
    this.meta = this.getInitMeta(baseMeta);
    this.glProviders = globalProviders;
    this.trpcGlProviders = globalProviders.mInitValue.get(initTrpc) as TrpcGlobalProviders;
    this.prefixPerMod = prefixPerMod || '';
    this.moduleName = baseMeta.name;
    // this.guards1 = guards1 || [];
    this.unfinishedScanModules = unfinishedScanModules;
    this.importAndAppendModules();

    let applyControllers = false;
    if (isRootModule(baseMeta) || isAppends || this.hasPath()) {
      applyControllers = true;
    }

    let perMod: Map<any, TrpcProviderImport>;
    let perRou: Map<any, TrpcProviderImport>;
    let perReq: Map<any, TrpcProviderImport>;
    let multiPerMod: Map<TrpcModRefId, Provider[]>;
    let multiPerRou: Map<TrpcModRefId, Provider[]>;
    let multiPerReq: Map<TrpcModRefId, Provider[]>;
    if (baseMeta.isExternal) {
      // External modules do not require global providers from the application.
      perMod = new Map([...this.importedProvidersPerMod]);
      perRou = new Map([...this.importedProvidersPerRou]);
      perReq = new Map([...this.importedProvidersPerReq]);
      multiPerMod = new Map([...this.importedMultiProvidersPerMod]);
      multiPerRou = new Map([...this.importedMultiProvidersPerRou]);
      multiPerReq = new Map([...this.importedMultiProvidersPerReq]);
    } else {
      perMod = new Map([...this.trpcGlProviders.importedProvidersPerMod, ...this.importedProvidersPerMod]);
      perRou = new Map([...this.trpcGlProviders.importedProvidersPerRou, ...this.importedProvidersPerRou]);
      perReq = new Map([...this.trpcGlProviders.importedProvidersPerReq, ...this.importedProvidersPerReq]);
      multiPerMod = new Map([
        ...this.trpcGlProviders.importedMultiProvidersPerMod,
        ...this.importedMultiProvidersPerMod,
      ]);
      multiPerRou = new Map([
        ...this.trpcGlProviders.importedMultiProvidersPerRou,
        ...this.importedMultiProvidersPerRou,
      ]);
      multiPerReq = new Map([
        ...this.trpcGlProviders.importedMultiProvidersPerReq,
        ...this.importedMultiProvidersPerReq,
      ]);
    }

    this.checkFalseResolvingCollisions();

    return this.shallowImportsMap.set(modRefId, {
      baseMeta,
      prefixPerMod,
      // guards1: this.guards1,
      meta: this.meta,
      applyControllers,
      baseImportRegistry: {
        perMod,
        perRou,
        perReq,
        multiPerMod,
        multiPerRou,
        multiPerReq,
      },
    });
  }

  protected getInitMeta(baseMeta: BaseMeta): TrpcInitMeta {
    let meta = baseMeta.initMeta.get(initTrpc);
    if (!meta) {
      meta = getProxyForInitMeta(baseMeta, TrpcInitMeta);
      baseMeta.initMeta.set(initTrpc, meta);
    }
    return meta;
  }

  protected hasPath() {
    return this.meta.params.path !== undefined || this.meta.params.absolutePath !== undefined;
  }

  protected importAndAppendModules() {
    this.importOrAppendModules([...this.baseMeta.importsModules, ...this.baseMeta.importsWithParams], true);
    this.checkAllCollisionsWithLevelsMix();
  }

  protected importOrAppendModules(aModRefIds: TrpcModRefId[], isImport?: boolean) {
    for (const modRefId of aModRefIds) {
      const baseMeta = this.moduleManager.getBaseMeta(modRefId, true);
      if (isImport) {
        this.importProviders(baseMeta);
      }
      if (this.unfinishedScanModules.has(modRefId)) {
        continue;
      }
      const meta = this.getInitMeta(baseMeta);
      // const { prefixPerMod, guards1 } = this.getPrefixAndGuards(modRefId, meta, isImport);
      const { prefixPerMod } = this.getPrefixAndGuards(modRefId, meta, isImport);
      const shallowModulesImporter = new TrpcShallowModulesImporter();
      this.unfinishedScanModules.add(modRefId);
      const shallowImportsBase = shallowModulesImporter.importModulesShallow({
        moduleManager: this.moduleManager,
        providersPerApp: this.providersPerApp,
        globalProviders: this.glProviders,
        modRefId,
        unfinishedScanModules: this.unfinishedScanModules,
        prefixPerMod,
        // guards1,
        isAppends: !isImport,
      });
      this.unfinishedScanModules.delete(modRefId);

      shallowImportsBase.forEach((val, key) => this.shallowImportsMap.set(key, val));
    }
  }

  protected getPrefixAndGuards(modRefId: TrpcModRefId, meta: TrpcInitMeta, isImport?: boolean) {
    let prefixPerMod = '';
    // let guards1: GuardPerMod1[] = [];
    const { absolutePath } = meta.params;
    const hasModuleParams = isModuleWithParams(modRefId);
    if (hasModuleParams || !isImport) {
      if (hasModuleParams && typeof absolutePath == 'string') {
        // Allow slash for absolutePath.
        prefixPerMod = absolutePath.startsWith('/') ? absolutePath.slice(1) : absolutePath;
      } else {
        const path = hasModuleParams ? meta.params.path : '';
        prefixPerMod = [this.prefixPerMod, path].filter((s) => s).join('/');
      }
      // const impGuradsPerMod1 = meta.params.guards.map<GuardPerMod1>((g) => {
      //   return {
      //     ...g,
      //     meta: this.meta,
      //     baseMeta: this.baseMeta,
      //   };
      // });
      // guards1 = [...this.guards1, ...impGuradsPerMod1];
    } else {
      prefixPerMod = this.prefixPerMod;
    }
    // return { prefixPerMod, guards1 };
    return { prefixPerMod };
  }

  /**
   * Recursively imports providers.
   *
   * @param baseMeta1 Module metadata from where imports providers.
   */
  protected importProviders(baseMeta1: BaseMeta) {
    const { modRefId, exportsModules, exportsWithParams } = baseMeta1;

    for (const modRefId2 of [...exportsModules, ...exportsWithParams]) {
      if (this.unfinishedExportModules.has(modRefId2)) {
        continue;
      }
      const baseMeta2 = this.moduleManager.getBaseMeta(modRefId2, true);
      // Reexported module
      this.unfinishedExportModules.add(baseMeta2.modRefId);
      this.importProviders(baseMeta2);
      this.unfinishedExportModules.delete(baseMeta2.modRefId);
    }

    const meta = this.getInitMeta(baseMeta1);
    this.addProviders('Mod', modRefId, meta);
    this.addProviders('Rou', modRefId, meta);
    this.addProviders('Req', modRefId, meta);
    if (meta.exportedMultiProvidersPerRou.length) {
      this.importedMultiProvidersPerRou.set(modRefId, meta.exportedMultiProvidersPerRou);
    }
    if (meta.exportedMultiProvidersPerReq.length) {
      this.importedMultiProvidersPerReq.set(modRefId, meta.exportedMultiProvidersPerReq);
    }
    this.throwIfTryResolvingMultiprovidersCollisions(baseMeta1.name);
  }

  protected addProviders(level: Level, modRefId: TrpcModRefId, meta: TrpcInitMeta) {
    meta[`exportedProvidersPer${level}`].forEach((provider) => {
      const token1 = getToken(provider);
      const providerImport = this[`importedProvidersPer${level}`].get(token1);
      if (providerImport) {
        this.checkCollisionsPerLevel(modRefId, level, token1, provider, providerImport);
        const hasResolvedCollision = this.meta[`resolvedCollisionsPer${level}`].some(([token2]) => token2 === token1);
        if (hasResolvedCollision) {
          const { providers, module2 } = this.getResolvedCollisionsPerLevel(level, token1);
          const newProviderImport = new TrpcProviderImport();
          newProviderImport.modRefId = module2;
          newProviderImport.providers.push(...providers);
          this[`importedProvidersPer${level}`].set(token1, newProviderImport);
        }
      } else {
        const newProviderImport = new TrpcProviderImport();
        newProviderImport.modRefId = modRefId;
        newProviderImport.providers.push(provider);
        this[`importedProvidersPer${level}`].set(token1, newProviderImport);
      }
    });
  }

  protected checkCollisionsPerLevel(
    modRefId: TrpcModRefId,
    level: Level,
    token: NonNullable<unknown>,
    provider: Provider,
    providerImport: TrpcProviderImport,
  ) {
    const declaredTokens = getTokens(this.meta[`providersPer${level}`]);
    const resolvedTokens = this.meta[`resolvedCollisionsPer${level}`].map(([token]) => token);
    const duplImpTokens = [...declaredTokens, ...resolvedTokens].includes(token) ? [] : [token];
    const collisions = getCollisions(duplImpTokens, [...providerImport.providers, provider]);
    if (collisions.length) {
      const moduleName1 = getDebugClassName(providerImport.modRefId) || 'unknown-1';
      const moduleName2 = getDebugClassName(modRefId) || 'unknown-2';
      throw new ProvidersCollision(
        this.moduleName,
        [token],
        [moduleName1, moduleName2],
        level,
        this.baseMeta.isExternal,
      );
    }
  }

  protected getResolvedCollisionsPerLevel(level: Level, token1: any) {
    const [token2, modRefId2] = this.meta[`resolvedCollisionsPer${level}`].find(([token2]) => token1 === token2)!;
    const moduleName = getDebugClassName(modRefId2) || '""';
    const tokenName = token2.name || token2;
    const baseMeta2 = this.moduleManager.getBaseMeta(modRefId2);
    const meta2 = baseMeta2?.initMeta.get(initTrpc);
    if (!baseMeta2) {
      throw new ResolvingCollisionsNotImportedInApplication(this.moduleName, moduleName, level, tokenName);
    }
    const providers = getLastProviders(meta2?.[`providersPer${level}`] || []).filter((p) => getToken(p) === token2);
    if (!providers.length) {
      throw new ResolvingCollisionsNotExistsOnThisLevel(this.moduleName, moduleName, level, tokenName);
    }

    this.setResolvedCollisions(token2, level);
    return { module2: modRefId2, providers };
  }

  protected setResolvedCollisions(token: any, level: Level) {
    const levels = this.resolvedCollisions.get(token);
    if (!levels) {
      this.resolvedCollisions.set(token, new Set([level]));
    } else {
      levels.add(level);
    }
  }

  protected checkFalseResolvingCollisions() {
    (['Mod', 'Rou', 'Req'] as const).forEach((level) => {
      this.meta[`resolvedCollisionsPer${level}`].forEach(([token, module]) => {
        const levels = this.resolvedCollisions.get(token);
        if (!levels || !levels.has(level)) {
          const moduleName = getDebugClassName(module) || 'unknown';
          const tokenName = token.name || token;
          throw new FalseResolvedCollisions(this.moduleName, moduleName, level, tokenName);
        }
      });
    });
  }

  protected throwIfTryResolvingMultiprovidersCollisions(moduleName: string) {
    const levels: Level[] = ['Mod', 'Rou', 'Req'];
    levels.forEach((level) => {
      const tokens: any[] = [];
      this[`importedMultiProvidersPer${level}`].forEach((providers) => tokens.push(...getTokens(providers)));
      this.meta[`resolvedCollisionsPer${level}`].some(([token]) => {
        if (tokens.includes(token)) {
          const tokenName = token.name || token;
          throw new CannotResolveCollisionForMultiProviderPerLevel(this.moduleName, moduleName, level, tokenName);
        }
      });
    });
  }

  protected checkAllCollisionsWithLevelsMix() {
    // let perMod: Map<any, ProviderImport<Provider>>;
    // if (this.shallowImportsBase) {
    //   // When calling this.importModulesShallow()
    //   const shallowImports = this.shallowImportsBase.get(this.baseMeta.modRefId)!;
    //   perMod = shallowImports.baseImportRegistry.perMod;
    // } else {
    //   // When calling this.exportGlobalProviders()
    //   perMod = this.glProviders.importedProvidersPerMod;
    // }

    this.checkCollisionsWithLevelsMix(this.providersPerApp, ['Mod', 'Rou', 'Req']);
    const providersPerMod = [
      ...defaultProvidersPerMod,
      ...this.baseMeta.providersPerMod,
      ...getImportedProviders(this.importedProvidersPerMod),
      // ...getImportedProviders(perMod),
    ];
    this.checkCollisionsWithLevelsMix(providersPerMod, ['Rou', 'Req']);
    const mergedProvidersAndTokens = [
      ...this.meta.providersPerRou,
      ...getImportedProviders(this.importedProvidersPerRou),
      // ...defaultProvidersPerReq,
    ];
    this.checkCollisionsWithLevelsMix(mergedProvidersAndTokens, ['Req']);
  }

  protected checkCollisionsWithLevelsMix(providers: any[], levels: Level[]) {
    getTokens(providers).forEach((token) => {
      for (const level of levels) {
        const declaredTokens = getTokens(this.meta[`providersPer${level}`]);
        const importedTokens = getImportedTokens(this[`importedProvidersPer${level}`]);
        const resolvedTokens = this.meta[`resolvedCollisionsPer${level}`].map(([t]) => t);
        const collision = importedTokens.includes(token) && ![...declaredTokens, ...resolvedTokens].includes(token);
        if (collision) {
          const providerImport = this[`importedProvidersPer${level}`].get(token)!;
          const hostModulePath = this.moduleManager.getBaseMeta(providerImport.modRefId)?.declaredInDir || '.';
          const decorAndVal = reflector.getDecorators(token, hasDeclaredInDir)?.at(0);
          const collisionWithPath = decorAndVal?.declaredInDir || '.';
          if (hostModulePath !== '.' && collisionWithPath !== '.' && collisionWithPath.startsWith(hostModulePath)) {
            // Allow collisions in host modules.
          } else {
            const hostModuleName = getDebugClassName(providerImport.modRefId) || 'unknown';
            throw new ProvidersCollision(this.moduleName, [token], [hostModuleName], level, this.baseMeta.isExternal);
          }
        }
        this.resolveCollisionsWithLevelsMix(token, level, resolvedTokens);
      }
    });
  }

  protected resolveCollisionsWithLevelsMix(token1: any, level: Level, resolvedTokens: any[]) {
    if (resolvedTokens.includes(token1)) {
      const [, module2] = this.meta[`resolvedCollisionsPer${level}`].find(([token2]) => token1 === token2)!;
      if (this.baseMeta.modRefId === module2) {
        if (!this[`importedProvidersPer${level}`].delete(token1)) {
          const tokenName = token1.name || token1;
          throw new ResolvingCollisionsNotImportedInModule(this.moduleName, level, tokenName);
        }
      } else {
        // Only check that the correct data is specified.
        this.getResolvedCollisionsPerLevel(level, token1);
      }
    }
  }
}
