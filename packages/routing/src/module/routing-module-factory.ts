import {
  Provider,
  ModuleType,
  ModuleWithParams,
  ModRefId,
  MetadataPerMod1,
  ModuleManager,
  ModuleExtract,
  isModuleWithParams,
  getTokens,
  getToken,
  getDebugClassName,
  reflector,
  hasDeclaredInDir,
  getCollisions,
  throwProvidersCollisionError,
  isRootModule,
  getModule,
  NormalizedMeta,
  GlobalProviders,
  ImportedTokensMap,
} from '@ditsmod/core';

import { GuardPerMod1 } from '#interceptors/guard.js';
import { RoutingModRefId, RoutingNormalizedMeta } from '#types/routing-normalized-meta.js';
import { Level, RoutingGlobalProviders, RoutingModuleExtract } from '#types/types.js';
import { defaultProvidersPerRou } from '#providers/default-providers-per-rou.js';
import { getImportedProviders, getImportedTokens } from '#utils/get-imports.js';
import { defaultProvidersPerReq } from '#providers/default-providers-per-req.js';
import { AppendsWithParams, RoutingModuleParams } from './module-metadata.js';
import { restMetadata } from '#decorators/routing-metadata.js';
import { isAppendsWithParams } from '#types/type.guards.js';

export class RoutingImportObj<T extends Provider = Provider> {
  modRefId: RoutingModRefId;
  /**
   * This property can have more than one element for multi-providers only.
   */
  providers: T[] = [];
}

/**
 * Metadata collected using `ModuleFactory`. The target for this metadata is `ImportsResolver`.
 */
export class RoutingMetadataPerMod1 {
  prefixPerMod: string;
  guardsPerMod1: GuardPerMod1[];
  /**
   * Snapshot of `RoutingNormalizedMeta`. If you modify any array in this object,
   * the original array will remain unchanged.
   */
  meta: RoutingNormalizedMeta;
  /**
   * Map between a token and its ImportObj per level.
   */
  importedTokensMap: RoutingImportedTokensMap;
  applyControllers?: boolean;
}

export interface RoutingImportedTokensMap {
  perRou: Map<any, RoutingImportObj>;
  perReq: Map<any, RoutingImportObj>;
  multiPerRou: Map<RoutingModRefId, Provider[]>;
  multiPerReq: Map<RoutingModRefId, Provider[]>;
}

/**
 * - exports global providers;
 * - merges global and local providers;
 * - checks on providers collisions.
 */
export class RoutingModuleFactory {
  protected providersPerApp: Provider[];
  protected moduleName: string;
  protected prefixPerMod: string;
  protected guardsPerMod1: GuardPerMod1[];
  /**
   * Module metadata.
   */
  protected baseMeta: NormalizedMeta;
  protected meta: RoutingNormalizedMeta;

  protected importedProvidersPerRou = new Map<any, RoutingImportObj>();
  protected importedProvidersPerReq = new Map<any, RoutingImportObj>();
  protected importedMultiProvidersPerRou = new Map<ModuleType | RoutingModuleParams | AppendsWithParams, Provider[]>();
  protected importedMultiProvidersPerReq = new Map<ModuleType | RoutingModuleParams | AppendsWithParams, Provider[]>();

  /**
   * GlobalProviders.
   */
  protected glProviders: GlobalProviders;
  protected routingGlProviders = new RoutingGlobalProviders();
  protected appMetadataMap = new Map<ModRefId, RoutingMetadataPerMod1>();
  protected unfinishedScanModules = new Set<ModRefId>();
  protected moduleManager: ModuleManager;

  exportGlobalProviders(
    moduleManager: ModuleManager,
    baseMeta: NormalizedMeta,
    providersPerApp: Provider[],
  ): RoutingGlobalProviders {
    this.moduleManager = moduleManager;
    this.moduleName = baseMeta.name;
    this.providersPerApp = providersPerApp;
    const meta = baseMeta.metaPerDecorator.get(restMetadata) as RoutingNormalizedMeta;
    this.importProviders(this.moduleName, meta);
    this.checkAllCollisionsWithLevelsMix();

    return {
      importedProvidersPerRou: this.importedProvidersPerRou,
      importedProvidersPerReq: this.importedProvidersPerReq,
      importedMultiProvidersPerRou: this.importedMultiProvidersPerRou,
      importedMultiProvidersPerReq: this.importedMultiProvidersPerReq,
    };
  }

  /**
   * Bootstraps a module.
   *
   * @param modRefId Module that will bootstrapped.
   */
  bootstrap(
    providersPerApp: Provider[],
    globalProviders: GlobalProviders,
    modRefId: ModRefId,
    moduleManager: ModuleManager,
    unfinishedScanModules: Set<ModRefId>,
    prefixPerMod: string = '',
    guardsPerMod1?: GuardPerMod1[],
    isAppends?: boolean,
  ) {
    const baseMeta = moduleManager.getMetadata(modRefId, true);
    this.baseMeta = baseMeta;
    const meta = baseMeta.metaPerDecorator.get(restMetadata) as RoutingNormalizedMeta;
    this.moduleManager = moduleManager;
    this.providersPerApp = providersPerApp;
    this.glProviders = globalProviders;
    this.prefixPerMod = prefixPerMod;
    this.moduleName = baseMeta.name;
    this.guardsPerMod1 = guardsPerMod1 || [];
    this.unfinishedScanModules = unfinishedScanModules;
    this.meta = meta;
    const moduleExtract: RoutingModuleExtract = {
      path: this.prefixPerMod,
      moduleName: baseMeta.name,
      isExternal: baseMeta.isExternal,
    };
    baseMeta.providersPerMod.push({ token: ModuleExtract, useValue: moduleExtract });
    this.checkImportsAndAppends(meta);
    this.importAndAppendModules();

    let applyControllers = false;
    if (isRootModule(meta) || isAppends || this.hasPath(meta)) {
      applyControllers = true;
    }

    let perRou: Map<any, RoutingImportObj>;
    let perReq: Map<any, RoutingImportObj>;
    let multiPerRou: Map<RoutingModRefId, Provider[]>;
    let multiPerReq: Map<RoutingModRefId, Provider[]>;
    if (baseMeta.isExternal) {
      // External modules do not require global providers from the application.
      perRou = new Map([...this.importedProvidersPerRou]);
      perReq = new Map([...this.importedProvidersPerReq]);
      multiPerRou = new Map([...this.importedMultiProvidersPerRou]);
      multiPerReq = new Map([...this.importedMultiProvidersPerReq]);
    } else {
      perRou = new Map([...this.routingGlProviders.importedProvidersPerRou, ...this.importedProvidersPerRou]);
      perReq = new Map([...this.routingGlProviders.importedProvidersPerReq, ...this.importedProvidersPerReq]);
      multiPerRou = new Map([
        ...this.routingGlProviders.importedMultiProvidersPerRou,
        ...this.importedMultiProvidersPerRou,
      ]);
      multiPerReq = new Map([
        ...this.routingGlProviders.importedMultiProvidersPerReq,
        ...this.importedMultiProvidersPerReq,
      ]);
    }

    return this.appMetadataMap.set(modRefId, {
      prefixPerMod,
      guardsPerMod1: this.guardsPerMod1,
      meta: this.meta,
      applyControllers,
      importedTokensMap: {
        perRou,
        perReq,
        multiPerRou,
        multiPerReq,
      },
    });
  }

  protected hasPath(meta: RoutingNormalizedMeta) {
    const hasPath =
      isAppendsWithParams(meta.modRefId) &&
      (meta.modRefId.path !== undefined || meta.modRefId.absolutePath !== undefined);

    return hasPath;
  }

  protected importAndAppendModules() {
    this.importOrAppendModules([...this.baseMeta.importsModules, ...this.baseMeta.importsWithParams], true);
    this.importOrAppendModules([...this.meta.appendsModules, ...this.meta.appendsWithParams]);
    this.checkAllCollisionsWithLevelsMix();
  }

  protected importOrAppendModules(aModRefIds: ModRefId[], isImport?: boolean) {
    for (const modRefId of aModRefIds) {
      const meta = this.moduleManager.getMetadata(modRefId, true);
      if (isImport) {
        this.importProviders(meta);
      }

      let prefixPerMod = '';
      let guardsPerMod1: GuardPerMod1[] = [];
      const hasModuleParams = isModuleWithParams(modRefId);
      if (hasModuleParams || !isImport) {
        if (hasModuleParams && typeof modRefId.absolutePath == 'string') {
          // Allow slash for absolutePath.
          prefixPerMod = modRefId.absolutePath.startsWith('/') ? modRefId.absolutePath.slice(1) : modRefId.absolutePath;
        } else {
          const path = hasModuleParams ? modRefId.path : '';
          prefixPerMod = [this.prefixPerMod, ''].filter((s) => s).join('/');
        }
        const impGuradsPerMod1 = meta.guardsPerMod.map<GuardPerMod1>((g) => ({ ...g, meta: this.meta }));
        guardsPerMod1 = [...this.guardsPerMod1, ...impGuradsPerMod1];
      } else {
        prefixPerMod = this.prefixPerMod;
      }

      if (this.unfinishedScanModules.has(modRefId)) {
        continue;
      }

      const moduleFactory = new RoutingModuleFactory();
      this.unfinishedScanModules.add(modRefId);
      const appMetadataMap = moduleFactory.bootstrap(
        this.providersPerApp,
        this.glProviders,
        modRefId,
        this.moduleManager,
        this.unfinishedScanModules,
        prefixPerMod,
        guardsPerMod1,
        !isImport,
      );
      this.unfinishedScanModules.delete(modRefId);

      this.appMetadataMap = new Map([...this.appMetadataMap, ...appMetadataMap]);
    }
  }

  /**
   * Recursively imports providers.
   *
   * @param meta1 Module metadata from where imports providers.
   */
  protected importProviders(moduleName: string, meta1: RoutingNormalizedMeta) {
    this.addProviders('Rou', meta1);
    this.addProviders('Req', meta1);
    if (meta1.exportedMultiProvidersPerRou.length) {
      this.importedMultiProvidersPerRou.set(meta1.modRefId, meta1.exportedMultiProvidersPerRou);
    }
    if (meta1.exportedMultiProvidersPerReq.length) {
      this.importedMultiProvidersPerReq.set(meta1.modRefId, meta1.exportedMultiProvidersPerReq);
    }
    this.throwIfTryResolvingMultiprovidersCollisions(moduleName);
  }

  protected addProviders(level: Level, meta: RoutingNormalizedMeta) {
    meta[`exportedProvidersPer${level}`].forEach((provider) => {
      const token1 = getToken(provider);
      const importObj = this[`importedProvidersPer${level}`].get(token1);
      if (importObj) {
        this.checkCollisionsPerLevel(meta.modRefId, level, token1, provider, importObj);
        const hasResolvedCollision = this.meta[`resolvedCollisionsPer${level}`].some(([token2]) => token2 === token1);
        if (hasResolvedCollision) {
          const { providers, module2 } = this.getResolvedCollisionsPerLevel(level, token1);
          const newImportObj = new RoutingImportObj();
          newImportObj.modRefId = module2;
          newImportObj.providers.push(...providers);
          this[`importedProvidersPer${level}`].set(token1, newImportObj);
        }
      } else {
        const newImportObj = new RoutingImportObj();
        newImportObj.modRefId = meta.modRefId;
        newImportObj.providers.push(provider);
        this[`importedProvidersPer${level}`].set(token1, newImportObj);
      }
    });
  }

  protected checkCollisionsPerLevel(
    modRefId: RoutingModRefId,
    level: Level,
    token: NonNullable<unknown>,
    provider: Provider,
    importObj: RoutingImportObj,
  ) {
    const declaredTokens = getTokens(this.meta[`providersPer${level}`]);
    const resolvedTokens = this.meta[`resolvedCollisionsPer${level}`].map(([token]) => token);
    const duplImpTokens = [...declaredTokens, ...resolvedTokens].includes(token) ? [] : [token];
    const collisions = getCollisions(duplImpTokens, [...importObj.providers, provider]);
    if (collisions.length) {
      const moduleName1 = getDebugClassName(importObj.modRefId);
      const moduleName2 = getDebugClassName(modRefId);
      throwProvidersCollisionError(this.moduleName, [token], [moduleName1, moduleName2], level, this.meta.isExternal);
    }
  }

  protected getResolvedCollisionsPerLevel(level: Level, token1: any) {
    const [token2, modRefId2] = this.meta[`resolvedCollisionsPer${level}`].find(([token2]) => token1 === token2)!;
    const moduleName = getDebugClassName(modRefId2);
    const tokenName = token2.name || token2;
    const meta2 = this.moduleManager.getMetadata(modRefId2);
    let errorMsg =
      `Resolving collisions for providersPer${level} in ${this.moduleName} failed: ` +
      `${tokenName} mapped with ${moduleName}, but `;
    if (!meta2) {
      errorMsg += `${moduleName} is not imported into the application.`;
      throw new Error(errorMsg);
    }
    const providers = getLastProviders(meta2[`providersPer${level}`]).filter((p) => getToken(p) === token2);
    if (!providers.length) {
      errorMsg += `providersPer${level} does not includes ${tokenName} in this module.`;
      throw new Error(errorMsg);
    }

    return { module2: modRefId2, providers };
  }

  protected throwIfTryResolvingMultiprovidersCollisions(moduleName: string) {
    const levels: Level[] = ['Rou', 'Req'];
    levels.forEach((level) => {
      const tokens: any[] = [];
      this[`importedMultiProvidersPer${level}`].forEach((providers) => tokens.push(...getTokens(providers)));
      this.meta[`resolvedCollisionsPer${level}`].some(([token]) => {
        if (tokens.includes(token)) {
          const tokenName = token.name || token;
          const errorMsg =
            `Resolving collisions for providersPer${level} in ${this.moduleName} failed: ` +
            `${tokenName} mapped with ${moduleName}, but ${tokenName} is a token of the multi providers, ` +
            `and in this case it should not be included in resolvedCollisionsPer${level}.`;
          throw new Error(errorMsg);
        }
      });
    });
  }

  protected checkAllCollisionsWithLevelsMix() {
    this.checkCollisionsWithLevelsMix(this.providersPerApp, ['Rou']);
    const providersPerRou = [
      ...defaultProvidersPerRou,
      ...this.meta.providersPerRou,
      ...getImportedProviders(this.importedProvidersPerRou),
    ];
    this.checkCollisionsWithLevelsMix(providersPerRou, ['Rou', 'Req']);
    const mergedProvidersAndTokens = [
      ...this.meta.providersPerRou,
      ...getImportedProviders(this.importedProvidersPerRou),
      ...defaultProvidersPerReq,
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
          const importObj = this[`importedProvidersPer${level}`].get(token)!;
          const hostModulePath = this.moduleManager.getMetadata(importObj.modRefId)?.declaredInDir || '.';
          const decorAndVal = reflector.getDecorators(token, hasDeclaredInDir)?.at(0);
          const collisionWithPath = decorAndVal?.declaredInDir || '.';
          if (hostModulePath !== '.' && collisionWithPath !== '.' && collisionWithPath.startsWith(hostModulePath)) {
            // Allow collisions in host modules.
          } else {
            const hostModuleName = getDebugClassName(importObj.modRefId);
            throwProvidersCollisionError(this.moduleName, [token], [hostModuleName], level, this.meta.isExternal);
          }
        }
        this.resolveCollisionsWithLevelsMix(token, level, resolvedTokens);
      }
    });
  }

  protected resolveCollisionsWithLevelsMix(token1: any, level: Level, resolvedTokens: any[]) {
    if (resolvedTokens.includes(token1)) {
      const [, module2] = this.meta[`resolvedCollisionsPer${level}`].find(([token2]) => token1 === token2)!;
      if (this.meta.modRefId === module2) {
        if (!this[`importedProvidersPer${level}`].delete(token1)) {
          const tokenName = token1.name || token1;
          const errorMsg =
            `Resolving collisions for providersPer${level} in ${this.moduleName} failed: ` +
            `${tokenName} mapped with ${this.moduleName}, but ` +
            `providersPer${level} does not imports ${tokenName} in this module.`;
          throw new Error(errorMsg);
        }
      } else {
        // Only check that the correct data is specified.
        this.getResolvedCollisionsPerLevel(level, token1);
      }
    }
  }

  protected checkImportsAndAppends(meta: RoutingNormalizedMeta) {
    [...meta.appendsModules].forEach((append) => {
      const appendedMeta = this.moduleManager.getMetadata(append, true);
      if (!appendedMeta.controllers.length) {
        const msg = `Appends to "${meta.name}" failed: "${appendedMeta.name}" must have controllers.`;
        throw new Error(msg);
      }
      const mod = getModule(append);
      if (meta.importsModules.includes(mod) || meta.importsWithParams.some((imp) => imp.module === mod)) {
        const msg = `Appends to "${meta.name}" failed: "${appendedMeta.name}" includes in both: imports and appends arrays.`;
        throw new Error(msg);
      }
    });
  }
}
