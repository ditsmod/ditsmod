import {
  Provider,
  ModRefId,
  ModuleManager,
  isModuleWithParams,
  getTokens,
  getToken,
  getDebugClassName,
  getCollisions,
  isRootModule,
  getModule,
  BaseMeta,
  GlobalProviders,
  getLastProviders,
  getProxyForInitMeta,
} from '@ditsmod/core';
import {
  ProvidersCollision,
  ResolvingCollisionsNotExistsOnThisLevel,
  ResolvingCollisionsNotImportedInApplication,
} from '@ditsmod/core/errors';

import { GuardPerMod1 } from '#interceptors/guard.js';
import { RestModRefId, RestInitMeta } from '#init/rest-init-meta.js';
import { Level, RestGlobalProviders } from '#types/types.js';
import { initRest, RestInitHooks } from '#decorators/rest-init-hooks-and-metadata.js';
import { ImportModulesShallowConfig, RestProviderImport, RestShallowImports } from './types.js';
import { ModuleIncludesInImportsAndAppends } from '#errors';
import { ModuleMustHaveControllers } from '#services/rest-errors.js';

/**
 * Recursively collects providers taking into account module imports/exports,
 * but does not take provider dependencies into account.
 *
 * Also:
 * - exports global providers;
 * - merges global and local providers;
 * - checks on providers collisions.
 */
export class RestShallowModulesImporter {
  protected moduleName: string;
  protected prefixPerMod: string;
  protected guards1: GuardPerMod1[];
  protected baseMeta: BaseMeta;
  protected meta: RestInitMeta;

  /**
   * GlobalProviders.
   */
  protected glProviders: GlobalProviders;
  protected restGlProviders: RestGlobalProviders;
  protected shallowImportsMap = new Map<ModRefId, RestShallowImports>();
  protected unfinishedScanModules = new Set<ModRefId>();
  protected unfinishedExportModules = new Set<ModRefId>();
  protected moduleManager: ModuleManager;

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
    this.moduleName = baseMeta.name;
    this.baseMeta = baseMeta;
    this.meta = this.getInitMeta(baseMeta);

    return {
      initHooks: new RestInitHooks({}),
    };
  }

  /**
   * @param modRefId Module that will bootstrapped.
   */
  importModulesShallow({
    moduleManager,
    globalProviders,
    modRefId,
    unfinishedScanModules,
    prefixPerMod,
    guards1,
    isAppends,
  }: ImportModulesShallowConfig): Map<ModRefId, RestShallowImports> {
    this.moduleManager = moduleManager;
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

    return this.shallowImportsMap.set(modRefId, {
      baseMeta,
      prefixPerMod,
      guards1: this.guards1,
      meta: this.meta,
      applyControllers,
    });
  }

  protected getInitMeta(baseMeta: BaseMeta): RestInitMeta {
    let meta = baseMeta.initMeta.get(initRest);
    if (!meta) {
      meta = getProxyForInitMeta(baseMeta, RestInitMeta);
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
  }

  protected importOrAppendModules(aModRefIds: RestModRefId[], isImport?: boolean) {
    for (const modRefId of aModRefIds) {
      const baseMeta = this.moduleManager.getBaseMeta(modRefId, true);
      if (this.unfinishedScanModules.has(modRefId)) {
        continue;
      }
      const meta = this.getInitMeta(baseMeta);
      const { prefixPerMod, guards1 } = this.getPrefixAndGuards(modRefId, meta, isImport);
      const shallowModulesImporter = new RestShallowModulesImporter();
      this.unfinishedScanModules.add(modRefId);
      const shallowImportsBase = shallowModulesImporter.importModulesShallow({
        moduleManager: this.moduleManager,
        globalProviders: this.glProviders,
        modRefId,
        unfinishedScanModules: this.unfinishedScanModules,
        prefixPerMod,
        guards1,
        isAppends: !isImport,
      });
      this.unfinishedScanModules.delete(modRefId);

      shallowImportsBase.forEach((val, key) => this.shallowImportsMap.set(key, val));
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
    const meta2 = baseMeta2?.initMeta.get(initRest);
    if (!baseMeta2) {
      throw new ResolvingCollisionsNotImportedInApplication(this.moduleName, moduleName, level, tokenName);
    }
    const providers = getLastProviders(meta2?.[`providersPer${level}`] || []).filter((p) => getToken(p) === token2);
    if (!providers.length) {
      throw new ResolvingCollisionsNotExistsOnThisLevel(this.moduleName, moduleName, level, tokenName);
    }

    return { module2: modRefId2, providers };
  }

  protected checkImportsAndAppends(baseMeta: BaseMeta, meta1: RestInitMeta) {
    meta1.appendsModules.concat(meta1.appendsWithParams as any[]).forEach((modRefId) => {
      const appendedBaseMeta = this.moduleManager.getBaseMeta(modRefId, true);
      const meta2 = this.getInitMeta(appendedBaseMeta);
      if (!meta2.controllers.length) {
        throw new ModuleMustHaveControllers(baseMeta.name, appendedBaseMeta.name);
      }
      const mod = getModule(modRefId);
      if (baseMeta.importsModules.includes(mod) || baseMeta.importsWithParams.some((imp) => imp.module === mod)) {
        throw new ModuleIncludesInImportsAndAppends(baseMeta.name, appendedBaseMeta.name);
      }
    });
  }
}
