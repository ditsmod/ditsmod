import {
  Provider,
  ModRefId,
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
  getLastProviders,
} from '@ditsmod/core';

import { GuardPerMod1 } from '#interceptors/guard.js';
import { RestModRefId, RestNormalizedMeta } from '#types/rest-normalized-meta.js';
import { Level, RestGlobalProviders, RestModuleExtract } from '#types/types.js';
import { defaultProvidersPerRou } from '#providers/default-providers-per-rou.js';
import { getImportedProviders, getImportedTokens } from '#utils/get-imports.js';
import { defaultProvidersPerReq } from '#providers/default-providers-per-req.js';
import { AppendsWithParams } from './module-metadata.js';
import { addRest } from '#decorators/rest-metadata.js';
import { isAppendsWithParams } from '#types/type.guards.js';

export class RestImportObj<T extends Provider = Provider> {
  modRefId: RestModRefId;
  /**
   * This property can have more than one element for multi-providers only.
   */
  providers: T[] = [];
}

/**
 * Metadata collected using `ShallowProvidersCollector`. The target for this metadata is `DeepProvidersCollector`.
 */
export class AddRestPerMod1 {
  prefixPerMod: string;
  guardsPerMod1: GuardPerMod1[];
  /**
   * Snapshot of `RestNormalizedMeta`. If you modify any array in this object,
   * the original array will remain unchanged.
   */
  meta: RestNormalizedMeta;
  /**
   * Map between a token and its ImportObj per level.
   */
  importedTokensMap: RestImportedTokensMap;
  applyControllers?: boolean;
}

export interface RestImportedTokensMap {
  perRou: Map<any, RestImportObj>;
  perReq: Map<any, RestImportObj>;
  multiPerRou: Map<RestModRefId, Provider[]>;
  multiPerReq: Map<RestModRefId, Provider[]>;
}

/**
 * - exports global providers;
 * - merges global and local providers;
 * - checks on providers collisions.
 */
export class RestShallowProvidersCollector {
  protected moduleName: string;
  protected prefixPerMod: string;
  protected guardsPerMod1: GuardPerMod1[];
  /**
   * Module metadata.
   */
  protected baseMeta: NormalizedMeta;
  protected meta: RestNormalizedMeta;

  protected importedProvidersPerRou = new Map<any, RestImportObj>();
  protected importedProvidersPerReq = new Map<any, RestImportObj>();
  protected importedMultiProvidersPerRou = new Map<ModRefId | AppendsWithParams, Provider[]>();
  protected importedMultiProvidersPerReq = new Map<ModRefId | AppendsWithParams, Provider[]>();

  /**
   * GlobalProviders.
   */
  protected glProviders: GlobalProviders;
  protected restGlProviders: RestGlobalProviders;
  protected appMetadataMap = new Map<ModRefId, AddRestPerMod1>();
  protected unfinishedScanModules = new Set<ModRefId>();
  protected moduleManager: ModuleManager;

  exportGlobalProviders(
    moduleManager: ModuleManager,
    baseMeta: NormalizedMeta,
  ): RestGlobalProviders {
    this.moduleManager = moduleManager;
    this.moduleName = baseMeta.name;
    this.baseMeta = baseMeta;
    this.importProviders(baseMeta);
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
    const meta = baseMeta.normDecorMeta.get(addRest) as RestNormalizedMeta | undefined;
    if (!meta) {
      return this.appMetadataMap;
    }
    this.moduleManager = moduleManager;
    this.glProviders = globalProviders;
    this.restGlProviders = globalProviders.providersFromDecorators.get(addRest) as RestGlobalProviders;
    this.prefixPerMod = prefixPerMod;
    this.moduleName = baseMeta.name;
    this.guardsPerMod1 = guardsPerMod1 || [];
    this.unfinishedScanModules = unfinishedScanModules;
    this.meta = meta;
    const moduleExtract: RestModuleExtract = {
      path: this.prefixPerMod,
      moduleName: baseMeta.name,
      isExternal: baseMeta.isExternal,
    };
    baseMeta.providersPerMod.push({ token: ModuleExtract, useValue: moduleExtract });
    this.checkImportsAndAppends(baseMeta, meta);
    this.importAndAppendModules();

    let applyControllers = false;
    if (isRootModule(meta) || isAppends || this.hasPath(baseMeta)) {
      applyControllers = true;
    }

    let perRou: Map<any, RestImportObj>;
    let perReq: Map<any, RestImportObj>;
    let multiPerRou: Map<RestModRefId, Provider[]>;
    let multiPerReq: Map<RestModRefId, Provider[]>;
    if (baseMeta.isExternal) {
      // External modules do not require global providers from the application.
      perRou = new Map([...this.importedProvidersPerRou]);
      perReq = new Map([...this.importedProvidersPerReq]);
      multiPerRou = new Map([...this.importedMultiProvidersPerRou]);
      multiPerReq = new Map([...this.importedMultiProvidersPerReq]);
    } else {
      perRou = new Map([...this.restGlProviders.importedProvidersPerRou, ...this.importedProvidersPerRou]);
      perReq = new Map([...this.restGlProviders.importedProvidersPerReq, ...this.importedProvidersPerReq]);
      multiPerRou = new Map([
        ...this.restGlProviders.importedMultiProvidersPerRou,
        ...this.importedMultiProvidersPerRou,
      ]);
      multiPerReq = new Map([
        ...this.restGlProviders.importedMultiProvidersPerReq,
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

  protected hasPath(baseMeta: NormalizedMeta) {
    const hasPath =
      isAppendsWithParams(baseMeta.modRefId) &&
      (baseMeta.modRefId.path !== undefined || baseMeta.modRefId.absolutePath !== undefined);

    return hasPath;
  }

  protected importAndAppendModules() {
    this.importOrAppendModules([...this.baseMeta.importsModules, ...this.baseMeta.importsWithParams], true);
    this.importOrAppendModules([...this.meta.appendsModules, ...this.meta.appendsWithParams]);
    this.checkAllCollisionsWithLevelsMix();
  }

  protected importOrAppendModules(aModRefIds: RestModRefId[], isImport?: boolean) {
    for (const modRefId of aModRefIds) {
      const baseMeta = this.moduleManager.getMetadata(modRefId, true);
      if (isImport) {
        this.importProviders(baseMeta);
      }
      const meta = baseMeta.normDecorMeta.get(addRest) as RestNormalizedMeta | undefined;
      if (!meta) {
        continue;
      }

      const { params } = meta;

      let prefixPerMod = '';
      let guardsPerMod1: GuardPerMod1[] = [];
      const hasModuleParams = isModuleWithParams(modRefId);
      if (hasModuleParams || !isImport) {
        if (hasModuleParams && typeof params.absolutePath == 'string') {
          // Allow slash for absolutePath.
          prefixPerMod = params.absolutePath.startsWith('/') ? params.absolutePath.slice(1) : params.absolutePath;
        } else {
          const path = hasModuleParams ? params.path : '';
          prefixPerMod = [this.prefixPerMod, path].filter((s) => s).join('/');
        }
        const impGuradsPerMod1 = meta.guardsPerMod.map<GuardPerMod1>((g) => {
          return {
            ...g,
            meta: this.meta,
            baseMeta: this.baseMeta,
          };
        });
        guardsPerMod1 = [...this.guardsPerMod1, ...impGuradsPerMod1];
      } else {
        prefixPerMod = this.prefixPerMod;
      }

      if (this.unfinishedScanModules.has(modRefId)) {
        continue;
      }

      const shallowProvidersCollector = new RestShallowProvidersCollector();
      this.unfinishedScanModules.add(modRefId);
      const appMetadataMap = shallowProvidersCollector.bootstrap(
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
   * @param baseMeta1 Module metadata from where imports providers.
   */
  protected importProviders(baseMeta1: NormalizedMeta) {
    const { modRefId, exportsModules, exportsWithParams, normDecorMeta } = baseMeta1;

    for (const modRefId2 of [...exportsModules, ...exportsWithParams]) {
      const baseMeta2 = this.moduleManager.getMetadata(modRefId2, true);
      // Reexported module
      this.importProviders(baseMeta2);
    }

    const meta = normDecorMeta.get(addRest) as RestNormalizedMeta | undefined;
    if (!meta) {
      return;
    }

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

  protected addProviders(level: Level, modRefId: RestModRefId, meta: RestNormalizedMeta) {
    meta[`exportedProvidersPer${level}`].forEach((provider) => {
      const token1 = getToken(provider);
      const importObj = this[`importedProvidersPer${level}`].get(token1);
      if (importObj) {
        this.checkCollisionsPerLevel(modRefId, level, token1, provider, importObj);
        const hasResolvedCollision = this.meta[`resolvedCollisionsPer${level}`].some(([token2]) => token2 === token1);
        if (hasResolvedCollision) {
          const { providers, module2 } = this.getResolvedCollisionsPerLevel(level, token1);
          const newImportObj = new RestImportObj();
          newImportObj.modRefId = module2;
          newImportObj.providers.push(...providers);
          this[`importedProvidersPer${level}`].set(token1, newImportObj);
        }
      } else {
        const newImportObj = new RestImportObj();
        newImportObj.modRefId = modRefId;
        newImportObj.providers.push(provider);
        this[`importedProvidersPer${level}`].set(token1, newImportObj);
      }
    });
  }

  protected checkCollisionsPerLevel(
    modRefId: RestModRefId,
    level: Level,
    token: NonNullable<unknown>,
    provider: Provider,
    importObj: RestImportObj,
  ) {
    const declaredTokens = getTokens(this.meta[`providersPer${level}`]);
    const resolvedTokens = this.meta[`resolvedCollisionsPer${level}`].map(([token]) => token);
    const duplImpTokens = [...declaredTokens, ...resolvedTokens].includes(token) ? [] : [token];
    const collisions = getCollisions(duplImpTokens, [...importObj.providers, provider]);
    if (collisions.length) {
      const moduleName1 = getDebugClassName(importObj.modRefId);
      const moduleName2 = getDebugClassName(modRefId);
      throwProvidersCollisionError(
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
    const moduleName = getDebugClassName(modRefId2);
    const tokenName = token2.name || token2;
    const baseMeta2 = this.moduleManager.getMetadata(modRefId2);
    const meta2 = baseMeta2?.normDecorMeta.get(addRest) as RestNormalizedMeta | undefined;
    let errorMsg =
      `Resolving collisions for providersPer${level} in ${this.moduleName} failed: ` +
      `${tokenName} mapped with ${moduleName}, but `;
    if (!baseMeta2) {
      errorMsg += `${moduleName} is not imported into the application.`;
      throw new Error(errorMsg);
    }
    if (!meta2) {
      errorMsg += `${moduleName} does not have a "addRest" decorator.`;
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
    this.checkCollisionsWithLevelsMix(this.moduleManager.providersPerApp, ['Rou']);
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
            throwProvidersCollisionError(this.moduleName, [token], [hostModuleName], level, this.baseMeta.isExternal);
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

  protected checkImportsAndAppends(baseMeta: NormalizedMeta, meta1: RestNormalizedMeta) {
    [...meta1.appendsModules].forEach((modRefId) => {
      const appendedBaseMeta = this.moduleManager.getMetadata(modRefId, true);
      const meta2 = appendedBaseMeta.normDecorMeta.get(addRest) as RestNormalizedMeta | undefined;
      if (!meta2?.controllers.length) {
        const msg = `Appends to "${baseMeta.name}" failed: "${appendedBaseMeta.name}" must have controllers.`;
        throw new Error(msg);
      }
      const mod = getModule(modRefId);
      if (baseMeta.importsModules.includes(mod) || baseMeta.importsWithParams.some((imp) => imp.module === mod)) {
        const msg = `Appends to "${baseMeta.name}" failed: "${appendedBaseMeta.name}" includes in both: imports and appends arrays.`;
        throw new Error(msg);
      }
    });
  }
}
