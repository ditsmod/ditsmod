import { reflector } from '#di';
import { ModuleExtract } from '#types/module-extract.js';
import type { NormalizedMeta } from '#types/normalized-meta.js';
import type { ModuleManager } from '#init/module-manager.js';
import type { GlobalProviders, MetadataPerMod1 } from '#types/metadata-per-mod.js';
import { ImportObj } from '#types/metadata-per-mod.js';
import type { ModuleType, Level, ModRefId, AnyFn, AnyObj } from '#types/mix.js';
import type { ShallowImportsBase } from '#init/types.js';
import type { Provider } from '#di/types-and-models.js';
import type { ModuleWithParams } from '#types/module-metadata.js';
import { getCollisions } from '#utils/get-collisions.js';
import { getImportedTokens } from '#utils/get-imports.js';
import { getLastProviders } from '#utils/get-last-providers.js';
import { getToken, getTokens } from '#utils/get-tokens.js';
import { throwProvidersCollisionError } from '#utils/throw-providers-collision-error.js';
import { hasDeclaredInDir } from '#utils/type-guards.js';
import { getDebugClassName } from '#utils/get-debug-class-name.js';
import {
  ExtensionConfig,
  ExtensionConfig3,
  ExtensionConfigBase,
  isConfigWithOverrideExtension,
} from '#extension/get-extension-provider.js';
import { findCycle } from '#extension/tarjan-graph.js';
import { getProviderName } from '#utils/get-provider-name.js';
import { topologicalSort } from '#extension/topological-sort.js';
import { ExtensionClass } from '#extension/extension-types.js';
/**
 * Recursively collects providers taking into account module imports/exports,
 * but does not take provider dependencies into account.
 *
 * Also:
 * - exports global providers;
 * - merges global and local providers;
 * - checks on providers collisions.
 */
export class ShallowProvidersCollector {
  protected moduleName: string;
  /**
   * Module metadata.
   */
  protected baseMeta: NormalizedMeta;

  protected importedProvidersPerMod = new Map<any, ImportObj>();
  protected importedMultiProvidersPerMod = new Map<ModuleType | ModuleWithParams, Provider[]>();
  protected importedExtensions = new Map<ModuleType | ModuleWithParams, Provider[]>();
  protected aImportedExtensionConfig: ExtensionConfig[] = [];

  /**
   * GlobalProviders.
   */
  protected glProviders: GlobalProviders;
  protected shallowImportsBase = new Map<ModRefId, MetadataPerMod1>();
  protected unfinishedScanModules = new Set<ModRefId>();
  protected moduleManager: ModuleManager;

  exportGlobalProviders(moduleManager: ModuleManager): GlobalProviders {
    this.moduleManager = moduleManager;
    const meta = moduleManager.getMetadata('root', true);
    this.moduleName = meta.name;
    this.baseMeta = meta;
    this.importProvidersAndExtensions(meta);
    this.checkAllCollisionsWithLevelsMix();
    const providersFromDecorators = new Map<AnyFn, AnyObj | undefined>();

    meta.rawDecorMeta.forEach((initHooksAndMetadata, decorator) => {
      const val = initHooksAndMetadata.exportGlobalProviders(moduleManager, meta);
      if (val) {
        providersFromDecorators.set(decorator, val);
      }
    });

    return {
      importedProvidersPerMod: this.importedProvidersPerMod,
      importedMultiProvidersPerMod: this.importedMultiProvidersPerMod,
      importedExtensions: this.importedExtensions,
      aImportedExtensionConfig: this.aImportedExtensionConfig,
      providersFromDecorators,
    };
  }

  /**
   * Bootstraps a module.
   *
   * @param modRefId Module that will bootstrapped.
   */
  collectProvidersShallow(
    globalProviders: GlobalProviders,
    modRefId: ModRefId,
    moduleManager: ModuleManager,
    unfinishedScanModules: Set<ModRefId>,
  ): ShallowImportsBase {
    const baseMeta = moduleManager.getMetadata(modRefId, true);
    this.moduleManager = moduleManager;
    this.glProviders = globalProviders;
    this.moduleName = baseMeta.name;
    this.unfinishedScanModules = unfinishedScanModules;
    this.baseMeta = baseMeta;
    this.importAndScanModules();
    const moduleExtract: ModuleExtract = {
      moduleName: baseMeta.name,
      isExternal: baseMeta.isExternal,
    };
    this.baseMeta.providersPerMod.unshift({ token: ModuleExtract, useValue: moduleExtract });

    let perMod: Map<any, ImportObj>;
    let multiPerMod: Map<ModuleType | ModuleWithParams, Provider[]>;
    let extensions: Map<ModuleType | ModuleWithParams, Provider[]>;
    let aExtensionConfig: ExtensionConfig[];
    if (baseMeta.isExternal) {
      // External modules do not require global providers and extensions from the application.
      perMod = new Map([...this.importedProvidersPerMod]);
      multiPerMod = new Map([...this.importedMultiProvidersPerMod]);
      extensions = new Map([...this.importedExtensions]);
      aExtensionConfig = [...this.aImportedExtensionConfig];
    } else {
      perMod = new Map([...this.glProviders.importedProvidersPerMod, ...this.importedProvidersPerMod]);
      multiPerMod = new Map([...this.glProviders.importedMultiProvidersPerMod, ...this.importedMultiProvidersPerMod]);
      extensions = new Map([...this.glProviders.importedExtensions, ...this.importedExtensions]);
      aExtensionConfig = [...this.glProviders.aImportedExtensionConfig, ...this.aImportedExtensionConfig];
    }

    const allExtensionConfigs = baseMeta.aExtensionConfig.concat(aExtensionConfig);
    this.checkExtensionsGraph(allExtensionConfigs);
    baseMeta.aOrderedExtensions = topologicalSort<ExtensionClass, ExtensionConfigBase>(allExtensionConfigs, true);

    return this.shallowImportsBase.set(modRefId, {
      baseMeta: this.baseMeta,
      importedTokensMap: {
        perMod,
        multiPerMod,
        extensions,
      },
    });
  }

  protected importAndScanModules() {
    this.importModules();

    this.moduleManager.allInitHooks.forEach((initHooks, decorator) => {
      const meta = this.baseMeta.normDecorMeta.get(decorator);
      for (const modRefId of initHooks.getModulesToScan(meta)) {
        if (this.unfinishedScanModules.has(modRefId)) {
          continue;
        }
        this.scanModule(modRefId);
      }
    });
  }

  protected importModules() {
    const aModRefIds = this.baseMeta.importsModules.concat(this.baseMeta.importsWithParams as any[]) as ModRefId[];
    for (const modRefId of aModRefIds) {
      const baseMeta = this.moduleManager.getMetadata(modRefId, true);
      this.importProvidersAndExtensions(baseMeta);
      if (this.unfinishedScanModules.has(modRefId)) {
        continue;
      }
      this.scanModule(modRefId);
    }
    this.checkAllCollisionsWithLevelsMix();
  }

  protected scanModule(modRefId: ModRefId) {
    const shallowProvidersCollector = new ShallowProvidersCollector();
    this.unfinishedScanModules.add(modRefId);
    const shallowImportsBase = shallowProvidersCollector.collectProvidersShallow(
      this.glProviders,
      modRefId,
      this.moduleManager,
      this.unfinishedScanModules,
    );
    this.unfinishedScanModules.delete(modRefId);
    shallowImportsBase.forEach((val, key) => this.shallowImportsBase.set(key, val));
  }

  /**
   * Recursively imports providers and extensions.
   *
   * @param meta1 Module metadata from where imports providers.
   */
  protected importProvidersAndExtensions(meta1: NormalizedMeta) {
    const { modRefId, exportsModules, exportsWithParams } = meta1;

    for (const modRefId of [...exportsModules, ...exportsWithParams]) {
      const meta2 = this.moduleManager.getMetadata(modRefId, true);
      // Reexported module
      this.importProvidersAndExtensions(meta2);
    }

    this.addProviders('Mod', meta1);
    if (meta1.exportedMultiProvidersPerMod.length) {
      this.importedMultiProvidersPerMod.set(modRefId, meta1.exportedMultiProvidersPerMod);
    }
    if (meta1.exportedExtensionsProviders.length) {
      this.importedExtensions.set(meta1.modRefId, meta1.exportedExtensionsProviders);
      this.aImportedExtensionConfig.push(...meta1.aExportedExtensionConfig);
    }
    this.throwIfTryResolvingMultiprovidersCollisions(meta1.name);
  }

  protected addProviders(level: Level, meta: NormalizedMeta) {
    meta[`exportedProvidersPer${level}`].forEach((provider) => {
      const token1 = getToken(provider);
      const importObj = this[`importedProvidersPer${level}`].get(token1);
      if (importObj) {
        this.checkCollisionsPerLevel(meta.modRefId, level, token1, provider, importObj);
        const hasResolvedCollision = this.baseMeta[`resolvedCollisionsPer${level}`].some(
          ([token2]) => token2 === token1,
        );
        if (hasResolvedCollision) {
          const { providers, module2 } = this.getResolvedCollisionsPerLevel(level, token1);
          const newImportObj = new ImportObj();
          newImportObj.modRefId = module2;
          newImportObj.providers.push(...providers);
          this[`importedProvidersPer${level}`].set(token1, newImportObj);
        }
      } else {
        const newImportObj = new ImportObj();
        newImportObj.modRefId = meta.modRefId;
        newImportObj.providers.push(provider);
        this[`importedProvidersPer${level}`].set(token1, newImportObj);
      }
    });
  }

  protected checkCollisionsPerLevel(
    modRefId: ModRefId,
    level: Level,
    token: NonNullable<unknown>,
    provider: Provider,
    importObj: ImportObj,
  ) {
    const declaredTokens = getTokens(this.baseMeta[`providersPer${level}`]);
    const resolvedTokens = this.baseMeta[`resolvedCollisionsPer${level}`].map(([token]) => token);
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
    const [token2, modRefId2] = this.baseMeta[`resolvedCollisionsPer${level}`].find(([token2]) => token1 === token2)!;
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

  protected checkExtensionsGraph(extensions: (ExtensionConfig | ExtensionConfig3)[]) {
    const extensionWithBeforeExtension = extensions?.filter((config) => {
      return !isConfigWithOverrideExtension(config) && config.beforeExtensions;
    }) as ExtensionConfig[] | undefined;

    if (extensionWithBeforeExtension) {
      const path = findCycle(extensionWithBeforeExtension);
      if (path) {
        const strPath = path.map(getProviderName).join(' -> ');
        let msg = `A configuration of extensions detected in ${this.moduleName}`;
        msg += ` creates a cyclic dependency in the startup sequence of different groups: ${strPath}.`;
        throw new Error(msg);
      }
    }
  }

  protected throwIfTryResolvingMultiprovidersCollisions(moduleName: string) {
    const levels: Level[] = ['Mod'];
    levels.forEach((level) => {
      const tokens: any[] = [];
      this[`importedMultiProvidersPer${level}`].forEach((providers) => tokens.push(...getTokens(providers)));
      this.baseMeta[`resolvedCollisionsPer${level}`].some(([token]) => {
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
    this.checkCollisionsWithLevelsMix(this.moduleManager.providersPerApp, ['Mod']);
  }

  protected checkCollisionsWithLevelsMix(providers: any[], levels: Level[]) {
    getTokens(providers).forEach((token) => {
      for (const level of levels) {
        const declaredTokens = getTokens(this.baseMeta[`providersPer${level}`]);
        const importedTokens = getImportedTokens(this[`importedProvidersPer${level}`]);
        const resolvedTokens = this.baseMeta[`resolvedCollisionsPer${level}`].map(([t]) => t);
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
      const [, module2] = this.baseMeta[`resolvedCollisionsPer${level}`].find(([token2]) => token1 === token2)!;
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
}
