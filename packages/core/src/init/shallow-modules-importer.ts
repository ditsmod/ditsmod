import { reflector } from '#di';
import type { BaseMeta } from '#types/base-meta.js';
import type { ModuleManager } from '#init/module-manager.js';
import type { GlobalProviders } from '#types/metadata-per-mod.js';
import { ProviderImport } from '#types/metadata-per-mod.js';
import type { Level, ModRefId, AnyFn, AnyObj } from '#types/mix.js';
import { ShallowImports } from '#init/types.js';
import type { Provider } from '#di/types-and-models.js';
import { getCollisions } from '#utils/get-collisions.js';
import { getImportedTokens } from '#utils/get-imports.js';
import { getLastProviders } from '#utils/get-last-providers.js';
import { getToken, getTokens } from '#utils/get-tokens.js';
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
import {
  extensionConfigCauseCyclicDeps,
  resolvingCollisionsNotExistsOnThisLevel,
  resolvingCollisionsNotImportedInModule,
  resolvingCollisionsNotImportedInApplication,
  donotResolveCollisionForMultiProviderPerLevel,
  ProvidersCollision,
} from '#errors';
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
  /**
   * Module metadata.
   */
  protected baseMeta: BaseMeta;

  protected importedProvidersPerMod = new Map<any, ProviderImport>();
  protected importedMultiProvidersPerMod = new Map<ModRefId, Provider[]>();
  protected importedExtensions = new Map<ModRefId, Provider[]>();
  protected aImportedExtensionConfig: ExtensionConfig[] = [];

  /**
   * GlobalProviders.
   */
  protected glProviders: GlobalProviders;
  protected shallowImportsMap = new Map<ModRefId, ShallowImports>();
  protected unfinishedScanModules = new Set<ModRefId>();
  protected unfinishedExportModules = new Set<ModRefId>();
  protected moduleManager: ModuleManager;

  exportGlobalProviders(moduleManager: ModuleManager): GlobalProviders {
    this.moduleManager = moduleManager;
    const baseMeta = moduleManager.getBaseMeta('root', true);
    this.moduleName = baseMeta.name;
    this.baseMeta = baseMeta;
    this.importProvidersAndExtensions(baseMeta);
    this.checkAllCollisionsWithLevelsMix();
    const mInitValue = new Map<AnyFn, AnyObj>();
    const globalProviders: GlobalProviders = {
      importedProvidersPerMod: this.importedProvidersPerMod,
      importedMultiProvidersPerMod: this.importedMultiProvidersPerMod,
      importedExtensions: this.importedExtensions,
      aImportedExtensionConfig: this.aImportedExtensionConfig,
      mInitValue,
    };

    baseMeta.allInitHooks.forEach((initHooks, decorator) => {
      const val = initHooks.exportGlobalProviders({ moduleManager, globalProviders, baseMeta });
      mInitValue.set(decorator, val);
    });

    return globalProviders;
  }

  importModulesShallow({
    globalProviders,
    modRefId,
    moduleManager,
    unfinishedScanModules,
  }: {
    globalProviders: GlobalProviders;
    modRefId: ModRefId;
    moduleManager: ModuleManager;
    unfinishedScanModules: Set<ModRefId>;
  }): Map<ModRefId, ShallowImports> {
    const baseMeta = moduleManager.getBaseMeta(modRefId, true);
    this.moduleManager = moduleManager;
    this.glProviders = globalProviders;
    this.moduleName = baseMeta.name;
    this.unfinishedScanModules = unfinishedScanModules;
    this.baseMeta = baseMeta;
    this.importAndScanModules();

    let perMod: Map<any, ProviderImport>;
    let multiPerMod: Map<ModRefId, Provider[]>;
    let extensions: Map<ModRefId, Provider[]>;
    let aExtensionConfig: ExtensionConfig[];
    if (baseMeta.isExternal) {
      // External modules do not require global providers and extensions from the application.
      perMod = new Map([...this.importedProvidersPerMod]);
      multiPerMod = new Map([...this.importedMultiProvidersPerMod]);
      extensions = new Map([...this.importedExtensions]);
      aExtensionConfig = [...this.aImportedExtensionConfig];
    } else {
      this.glProviders.mInitValue.forEach(({ initHooks }, decorator) => {
        if (initHooks && !baseMeta.allInitHooks.has(decorator)) {
          baseMeta.allInitHooks.set(decorator, initHooks);
        }
      });
      perMod = new Map([...this.glProviders.importedProvidersPerMod, ...this.importedProvidersPerMod]);
      multiPerMod = new Map([...this.glProviders.importedMultiProvidersPerMod, ...this.importedMultiProvidersPerMod]);
      extensions = new Map([...this.glProviders.importedExtensions, ...this.importedExtensions]);
      aExtensionConfig = [...this.glProviders.aImportedExtensionConfig, ...this.aImportedExtensionConfig];
    }

    const allExtensionConfigs = baseMeta.aExtensionConfig.concat(aExtensionConfig);
    this.checkExtensionsGraph(allExtensionConfigs);
    const aOrderedExtensions = topologicalSort<ExtensionClass, ExtensionConfigBase>(allExtensionConfigs, true);

    return this.shallowImportsMap.set(
      modRefId,
      new ShallowImports(this.baseMeta, aOrderedExtensions, {
        perMod,
        multiPerMod,
        extensions,
      }),
    );
  }

  protected importAndScanModules() {
    this.importModules();

    this.baseMeta.allInitHooks.forEach((initHooks, decorator) => {
      const meta = this.baseMeta.initMeta.get(decorator);
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
      const baseMeta = this.moduleManager.getBaseMeta(modRefId, true);
      this.importProvidersAndExtensions(baseMeta);
      if (this.unfinishedScanModules.has(modRefId)) {
        continue;
      }
      this.scanModule(modRefId);
    }
    this.checkAllCollisionsWithLevelsMix();
  }

  protected scanModule(modRefId: ModRefId) {
    const shallowModulesImporter = new ShallowModulesImporter();
    this.unfinishedScanModules.add(modRefId);
    const shallowImportsMap = shallowModulesImporter.importModulesShallow({
      globalProviders: this.glProviders,
      modRefId,
      moduleManager: this.moduleManager,
      unfinishedScanModules: this.unfinishedScanModules,
    });
    this.unfinishedScanModules.delete(modRefId);
    shallowImportsMap.forEach((val, key) => this.shallowImportsMap.set(key, val));
  }

  /**
   * Recursively imports providers and extensions.
   *
   * @param baseMeta1 Module metadata from where imports providers.
   */
  protected importProvidersAndExtensions(baseMeta1: BaseMeta) {
    const { modRefId, exportsModules, exportsWithParams } = baseMeta1;

    for (const modRefId2 of [...exportsModules, ...exportsWithParams]) {
      if (this.unfinishedExportModules.has(modRefId2)) {
        continue;
      }
      const baseMeta2 = this.moduleManager.getBaseMeta(modRefId2, true);
      // Reexported module
      this.unfinishedExportModules.add(baseMeta2.modRefId);
      this.importProvidersAndExtensions(baseMeta2);
      this.unfinishedExportModules.delete(baseMeta2.modRefId);
    }

    this.addProviders('Mod', baseMeta1);
    if (baseMeta1.exportedMultiProvidersPerMod.length) {
      this.importedMultiProvidersPerMod.set(modRefId, baseMeta1.exportedMultiProvidersPerMod);
    }
    if (baseMeta1.exportedExtensionsProviders.length) {
      this.importedExtensions.set(baseMeta1.modRefId, baseMeta1.exportedExtensionsProviders);
      this.aImportedExtensionConfig.push(...baseMeta1.aExportedExtensionConfig);
    }
    this.throwIfTryResolvingMultiprovidersCollisions(baseMeta1.name);
  }

  protected addProviders(level: Level, baseMeta: BaseMeta) {
    baseMeta[`exportedProvidersPer${level}`].forEach((provider) => {
      const token1 = getToken(provider);
      const providerImport = this[`importedProvidersPer${level}`].get(token1);
      if (providerImport) {
        this.checkCollisionsPerLevel(baseMeta.modRefId, level, token1, provider, providerImport);
        const hasResolvedCollision = this.baseMeta[`resolvedCollisionsPer${level}`].some(
          ([token2]) => token2 === token1,
        );
        if (hasResolvedCollision) {
          const { providers, module2 } = this.getResolvedCollisionsPerLevel(level, token1);
          const newProviderImport = new ProviderImport();
          newProviderImport.modRefId = module2;
          newProviderImport.providers.push(...providers);
          this[`importedProvidersPer${level}`].set(token1, newProviderImport);
        }
      } else {
        const newProviderImport = new ProviderImport();
        newProviderImport.modRefId = baseMeta.modRefId;
        newProviderImport.providers.push(provider);
        this[`importedProvidersPer${level}`].set(token1, newProviderImport);
      }
    });
  }

  protected checkCollisionsPerLevel(
    modRefId: ModRefId,
    level: Level,
    token: NonNullable<unknown>,
    provider: Provider,
    providerImport: ProviderImport,
  ) {
    const declaredTokens = getTokens(this.baseMeta[`providersPer${level}`]);
    const resolvedTokens = this.baseMeta[`resolvedCollisionsPer${level}`].map(([token]) => token);
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
    const [token2, modRefId2] = this.baseMeta[`resolvedCollisionsPer${level}`].find(([token2]) => token1 === token2)!;
    const moduleName = getDebugClassName(modRefId2) || '""';
    const tokenName = token2.name || token2;
    const meta2 = this.moduleManager.getBaseMeta(modRefId2);
    if (!meta2) {
      throw resolvingCollisionsNotImportedInApplication(this.moduleName, moduleName, level, tokenName);
    }
    const providers = getLastProviders(meta2[`providersPer${level}`]).filter((p) => getToken(p) === token2);
    if (!providers.length) {
      throw resolvingCollisionsNotExistsOnThisLevel(this.moduleName, moduleName, level, tokenName);
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
        throw extensionConfigCauseCyclicDeps(this.moduleName, strPath);
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
          throw donotResolveCollisionForMultiProviderPerLevel(this.moduleName, moduleName, level, tokenName);
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
      const [, module2] = this.baseMeta[`resolvedCollisionsPer${level}`].find(([token2]) => token1 === token2)!;
      if (this.baseMeta.modRefId === module2) {
        if (!this[`importedProvidersPer${level}`].delete(token1)) {
          const tokenName = token1.name || token1;
          throw resolvingCollisionsNotImportedInModule(this.moduleName, level, tokenName);
        }
      } else {
        // Only check that the correct data is specified.
        this.getResolvedCollisionsPerLevel(level, token1);
      }
    }
  }
}
