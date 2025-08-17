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
  isRootModule,
  getModule,
  BaseMeta,
  GlobalProviders,
  getLastProviders,
  defaultProvidersPerMod,
} from '@ditsmod/core';
import { providersCollision } from '@ditsmod/core/errors';

import { GuardPerMod1 } from '#interceptors/guard.js';
import { RestModRefId, RestInitMeta } from '#init/rest-init-meta.js';
import { Level, RestGlobalProviders, RestModuleExtract } from '#types/types.js';
import { getImportedProviders, getImportedTokens } from '#utils/get-imports.js';
import { defaultProvidersPerReq } from '#providers/default-providers-per-req.js';
import { AppendsWithParams } from './rest-init-raw-meta.js';
import { initRest, RestInitHooksAndRawMeta } from '#decorators/rest-init-hooks-and-metadata.js';
import { ImportModulesShallowConfig, RestProviderImport, RestMetadataPerMod1 } from './types.js';

/**
 * Recursively collects providers taking into account module imports/exports,
 * but does not take provider dependencies into account.
 *
 * Also:
 * - exports global providers;
 * - merges global and local providers;
 * - checks on providers collisions.
 */
export class ShallowModulesImporter {
  protected moduleName: string;
  protected prefixPerMod: string;
  protected guards1: GuardPerMod1[];
  protected baseMeta: BaseMeta;
  protected meta: RestInitMeta;
  protected providersPerApp: Provider[];

  protected importedProvidersPerMod = new Map<any, RestProviderImport>();
  protected importedProvidersPerRou = new Map<any, RestProviderImport>();
  protected importedProvidersPerReq = new Map<any, RestProviderImport>();
  protected importedMultiProvidersPerMod = new Map<ModRefId | AppendsWithParams, Provider[]>();
  protected importedMultiProvidersPerRou = new Map<ModRefId | AppendsWithParams, Provider[]>();
  protected importedMultiProvidersPerReq = new Map<ModRefId | AppendsWithParams, Provider[]>();

  /**
   * GlobalProviders.
   */
  protected glProviders: GlobalProviders;
  protected restGlProviders: RestGlobalProviders;
  protected shallowImports = new Map<ModRefId, RestMetadataPerMod1>();
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
  }): RestGlobalProviders {
    this.moduleManager = moduleManager;
    this.glProviders = globalProviders;
    this.providersPerApp = moduleManager.providersPerApp;
    this.moduleName = baseMeta.name;
    this.baseMeta = baseMeta;
    this.meta = this.getInitMeta(baseMeta);
    this.importProviders(baseMeta);
    this.checkAllCollisionsWithLevelsMix();

    let initHooks: RestInitHooksAndRawMeta | undefined;
    if (
      this.importedProvidersPerMod.size ||
      this.importedProvidersPerRou.size ||
      this.importedProvidersPerReq.size ||
      this.importedMultiProvidersPerMod.size ||
      this.importedMultiProvidersPerRou.size ||
      this.importedMultiProvidersPerReq.size
    ) {
      initHooks = new RestInitHooksAndRawMeta({});
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
    guards1,
    isAppends,
  }: ImportModulesShallowConfig): Map<ModRefId, RestMetadataPerMod1> {
    this.moduleManager = moduleManager;
    this.providersPerApp = providersPerApp;
    const baseMeta = this.moduleManager.getBaseMeta(modRefId, true);
    this.baseMeta = baseMeta;
    this.meta = this.getInitMeta(baseMeta);
    this.glProviders = globalProviders;
    this.restGlProviders = globalProviders.mInitValue.get(initRest) as RestGlobalProviders;
    this.prefixPerMod = prefixPerMod || '';
    this.moduleName = baseMeta.name;
    this.guards1 = guards1 || [];
    this.unfinishedScanModules = unfinishedScanModules;
    this.checkImportsAndAppends(baseMeta, this.meta);
    this.importAndAppendModules();

    let applyControllers = false;
    if (isRootModule(baseMeta) || isAppends || this.hasPath()) {
      applyControllers = true;
    }

    let perMod: Map<any, RestProviderImport>;
    let perRou: Map<any, RestProviderImport>;
    let perReq: Map<any, RestProviderImport>;
    let multiPerMod: Map<RestModRefId, Provider[]>;
    let multiPerRou: Map<RestModRefId, Provider[]>;
    let multiPerReq: Map<RestModRefId, Provider[]>;
    if (baseMeta.isExternal) {
      // External modules do not require global providers from the application.
      perMod = new Map([...this.importedProvidersPerMod]);
      perRou = new Map([...this.importedProvidersPerRou]);
      perReq = new Map([...this.importedProvidersPerReq]);
      multiPerMod = new Map([...this.importedMultiProvidersPerMod]);
      multiPerRou = new Map([...this.importedMultiProvidersPerRou]);
      multiPerReq = new Map([...this.importedMultiProvidersPerReq]);
    } else {
      perMod = new Map([...this.restGlProviders.importedProvidersPerMod, ...this.importedProvidersPerMod]);
      perRou = new Map([...this.restGlProviders.importedProvidersPerRou, ...this.importedProvidersPerRou]);
      perReq = new Map([...this.restGlProviders.importedProvidersPerReq, ...this.importedProvidersPerReq]);
      multiPerMod = new Map([
        ...this.restGlProviders.importedMultiProvidersPerMod,
        ...this.importedMultiProvidersPerMod,
      ]);
      multiPerRou = new Map([
        ...this.restGlProviders.importedMultiProvidersPerRou,
        ...this.importedMultiProvidersPerRou,
      ]);
      multiPerReq = new Map([
        ...this.restGlProviders.importedMultiProvidersPerReq,
        ...this.importedMultiProvidersPerReq,
      ]);
    }

    this.checkFalseResolvingCollisions();

    return this.shallowImports.set(modRefId, {
      baseMeta,
      prefixPerMod,
      guards1: this.guards1,
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

  protected getInitMeta(baseMeta: BaseMeta): RestInitMeta {
    let meta = baseMeta.initMeta.get(initRest);
    if (!meta) {
      meta = new RestInitMeta(baseMeta);
      baseMeta.initMeta.set(initRest, meta);
    }
    return meta;
  }

  protected hasPath() {
    return this.meta.params.path !== undefined || this.meta.params.absolutePath !== undefined;
  }

  protected importAndAppendModules() {
    this.importOrAppendModules([...this.baseMeta.importsModules, ...this.baseMeta.importsWithParams], true);
    this.importOrAppendModules([...this.meta.appendsModules, ...this.meta.appendsWithParams]);
    this.checkAllCollisionsWithLevelsMix();
  }

  protected importOrAppendModules(aModRefIds: RestModRefId[], isImport?: boolean) {
    for (const modRefId of aModRefIds) {
      const baseMeta = this.moduleManager.getBaseMeta(modRefId, true);
      if (isImport) {
        this.importProviders(baseMeta);
      }
      if (this.unfinishedScanModules.has(modRefId)) {
        continue;
      }
      const meta = this.getInitMeta(baseMeta);
      const { prefixPerMod, guards1 } = this.getPrefixAndGuards(modRefId, meta, isImport);
      const shallowModulesImporter = new ShallowModulesImporter();
      this.unfinishedScanModules.add(modRefId);
      const shallowImportsBase = shallowModulesImporter.importModulesShallow({
        moduleManager: this.moduleManager,
        providersPerApp: this.providersPerApp,
        globalProviders: this.glProviders,
        modRefId,
        unfinishedScanModules: this.unfinishedScanModules,
        prefixPerMod,
        guards1,
        isAppends: !isImport,
      });
      this.unfinishedScanModules.delete(modRefId);

      shallowImportsBase.forEach((val, key) => this.shallowImports.set(key, val));
    }
  }

  protected getPrefixAndGuards(modRefId: RestModRefId, meta: RestInitMeta, isImport?: boolean) {
    let prefixPerMod = '';
    let guards1: GuardPerMod1[] = [];
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
      const impGuradsPerMod1 = meta.params.guards.map<GuardPerMod1>((g) => {
        return {
          ...g,
          meta: this.meta,
          baseMeta: this.baseMeta,
        };
      });
      guards1 = [...this.guards1, ...impGuradsPerMod1];
    } else {
      prefixPerMod = this.prefixPerMod;
    }
    return { prefixPerMod, guards1 };
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

  protected addProviders(level: Level, modRefId: RestModRefId, meta: RestInitMeta) {
    meta[`exportedProvidersPer${level}`].forEach((provider) => {
      const token1 = getToken(provider);
      const providerImport = this[`importedProvidersPer${level}`].get(token1);
      if (providerImport) {
        this.checkCollisionsPerLevel(modRefId, level, token1, provider, providerImport);
        const hasResolvedCollision = this.meta[`resolvedCollisionsPer${level}`].some(([token2]) => token2 === token1);
        if (hasResolvedCollision) {
          const { providers, module2 } = this.getResolvedCollisionsPerLevel(level, token1);
          const newProviderImport = new RestProviderImport();
          newProviderImport.modRefId = module2;
          newProviderImport.providers.push(...providers);
          this[`importedProvidersPer${level}`].set(token1, newProviderImport);
        }
      } else {
        const newProviderImport = new RestProviderImport();
        newProviderImport.modRefId = modRefId;
        newProviderImport.providers.push(provider);
        this[`importedProvidersPer${level}`].set(token1, newProviderImport);
      }
    });
  }

  protected checkCollisionsPerLevel(
    modRefId: RestModRefId,
    level: Level,
    token: NonNullable<unknown>,
    provider: Provider,
    providerImport: RestProviderImport,
  ) {
    const declaredTokens = getTokens(this.meta[`providersPer${level}`]);
    const resolvedTokens = this.meta[`resolvedCollisionsPer${level}`].map(([token]) => token);
    const duplImpTokens = [...declaredTokens, ...resolvedTokens].includes(token) ? [] : [token];
    const collisions = getCollisions(duplImpTokens, [...providerImport.providers, provider]);
    if (collisions.length) {
      const moduleName1 = getDebugClassName(providerImport.modRefId) || 'unknown-1';
      const moduleName2 = getDebugClassName(modRefId) || 'unknown-2';
      throw providersCollision(this.moduleName, [token], [moduleName1, moduleName2], level, this.baseMeta.isExternal);
    }
  }

  protected getResolvedCollisionsPerLevel(level: Level, token1: any) {
    const [token2, modRefId2] = this.meta[`resolvedCollisionsPer${level}`].find(([token2]) => token1 === token2)!;
    const moduleName = getDebugClassName(modRefId2);
    const tokenName = token2.name || token2;
    const baseMeta2 = this.moduleManager.getBaseMeta(modRefId2);
    const meta2 = baseMeta2?.initMeta.get(initRest);
    let errorMsg =
      `Resolving collisions for providersPer${level} in ${this.moduleName} failed: ` +
      `${tokenName} mapped with ${moduleName}, but `;
    if (!baseMeta2) {
      errorMsg += `${moduleName} is not imported into the application.`;
      throw new Error(errorMsg);
    }
    if (!meta2?.[`exportedProvidersPer${level}`].some((p) => getToken(p) === token2)) {
      errorMsg += `${moduleName} does not exports ${tokenName}.`;
      throw new Error(errorMsg);
    }
    const providers = getLastProviders(meta2[`providersPer${level}`]).filter((p) => getToken(p) === token2);
    if (!providers.length) {
      errorMsg += `providersPer${level} does not includes ${tokenName} in this module.`;
      throw new Error(errorMsg);
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
          const moduleName = getDebugClassName(module);
          const tokenName = token.name || token;
          const errorMsg =
            `Resolving collisions for providersPer${level} in ${this.moduleName} failed: ` +
            `${tokenName} mapped with ${moduleName}, but there are no collisions ` +
            `with ${tokenName} in the providersPer${level} array.`;
          throw new Error(errorMsg);
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
    // let perMod: Map<any, ProviderImport<Provider>>;
    // if (this.shallowImportsBase) {
    //   // When calling this.importModulesShallow()
    //   const metadataPerMod1 = this.shallowImportsBase.get(this.baseMeta.modRefId)!;
    //   perMod = metadataPerMod1.baseImportRegistry.perMod;
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
          const providerImport = this[`importedProvidersPer${level}`].get(token)!;
          const hostModulePath = this.moduleManager.getBaseMeta(providerImport.modRefId)?.declaredInDir || '.';
          const decorAndVal = reflector.getDecorators(token, hasDeclaredInDir)?.at(0);
          const collisionWithPath = decorAndVal?.declaredInDir || '.';
          if (hostModulePath !== '.' && collisionWithPath !== '.' && collisionWithPath.startsWith(hostModulePath)) {
            // Allow collisions in host modules.
          } else {
            const hostModuleName = getDebugClassName(providerImport.modRefId) || 'unknown';
            throw providersCollision(this.moduleName, [token], [hostModuleName], level, this.baseMeta.isExternal);
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

  protected checkImportsAndAppends(baseMeta: BaseMeta, meta1: RestInitMeta) {
    meta1.appendsModules.concat(meta1.appendsWithParams as any[]).forEach((modRefId) => {
      const appendedBaseMeta = this.moduleManager.getBaseMeta(modRefId, true);
      const meta2 = this.getInitMeta(appendedBaseMeta);
      if (!meta2.controllers.length) {
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
