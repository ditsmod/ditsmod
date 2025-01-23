import { injectable, reflector } from '#di';
import { defaultProvidersPerMod } from '#init/default-providers-per-mod.js';
import { ModuleExtract } from '#types/module-extract.js';
import type { NormalizedMeta } from '#types/normalized-meta.js';
import type { ModuleManager } from '#init/module-manager.js';
import type { GlobalProviders, MetadataPerMod1 } from '#types/metadata-per-mod.js';
import { ImportObj } from '#types/metadata-per-mod.js';
import type { ModuleType, Level, ModRefId } from '#types/mix.js';
import type { Provider } from '#di/types-and-models.js';
import type { BaseModuleWithParams } from '#types/module-metadata.js';
import { getCollisions } from '#utils/get-collisions.js';
import { getImportedProviders, getImportedTokens } from '#utils/get-imports.js';
import { getLastProviders } from '#utils/get-last-providers.js';
import { getToken, getTokens } from '#utils/get-tokens.js';
import { throwProvidersCollisionError } from '#utils/throw-providers-collision-error.js';
import { isModuleWithParams, isRootModule } from '#utils/type-guards.js';
import { hasDeclaredInDir } from '#utils/type-guards.js';
import { getModule } from '#utils/get-module.js';
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
 * - exports global providers;
 * - merges global and local providers;
 * - checks on providers collisions.
 */
@injectable()
export class ModuleFactory {
  protected providersPerApp: Provider[];
  protected moduleName: string;
  protected prefixPerMod: string;
  // protected guardsPerMod1: GuardPerMod1[];
  /**
   * Module metadata.
   */
  protected meta: NormalizedMeta;

  protected importedProvidersPerMod = new Map<any, ImportObj>();
  protected importedProvidersPerRou = new Map<any, ImportObj>();
  protected importedProvidersPerReq = new Map<any, ImportObj>();
  protected importedMultiProvidersPerMod = new Map<ModuleType | BaseModuleWithParams, Provider[]>();
  protected importedMultiProvidersPerRou = new Map<ModuleType | BaseModuleWithParams, Provider[]>();
  protected importedMultiProvidersPerReq = new Map<ModuleType | BaseModuleWithParams, Provider[]>();
  protected importedExtensions = new Map<ModuleType | BaseModuleWithParams, Provider[]>();
  protected aImportedExtensionConfig: ExtensionConfig[] = [];

  /**
   * GlobalProviders.
   */
  protected glProviders: GlobalProviders;
  protected appMetadataMap = new Map<ModRefId, MetadataPerMod1>();
  protected unfinishedScanModules = new Set<ModRefId>();
  protected moduleManager: ModuleManager;

  exportGlobalProviders(moduleManager: ModuleManager, providersPerApp: Provider[]): GlobalProviders {
    this.moduleManager = moduleManager;
    const meta = moduleManager.getMetadata('root', true);
    this.moduleName = meta.name;
    this.meta = meta;
    this.providersPerApp = providersPerApp;
    this.importProvidersAndExtensions(meta);
    this.checkAllCollisionsWithLevelsMix();

    return {
      importedProvidersPerMod: this.importedProvidersPerMod,
      importedProvidersPerRou: this.importedProvidersPerRou,
      importedProvidersPerReq: this.importedProvidersPerReq,
      importedMultiProvidersPerMod: this.importedMultiProvidersPerMod,
      importedMultiProvidersPerRou: this.importedMultiProvidersPerRou,
      importedMultiProvidersPerReq: this.importedMultiProvidersPerReq,
      importedExtensions: this.importedExtensions,
      aImportedExtensionConfig: this.aImportedExtensionConfig,
    };
  }

  /**
   * Bootstraps a module.
   *
   * @param modOrObj Module that will bootstrapped.
   */
  bootstrap(
    providersPerApp: Provider[],
    globalProviders: GlobalProviders,
    prefixPerMod: string,
    modOrObj: ModRefId,
    moduleManager: ModuleManager,
    unfinishedScanModules: Set<ModRefId>,
    // guardsPerMod1?: GuardPerMod1[],
    // isAppends?: boolean,
  ) {
    const meta = moduleManager.getMetadata(modOrObj, true);
    this.moduleManager = moduleManager;
    this.providersPerApp = providersPerApp;
    this.glProviders = globalProviders;
    this.prefixPerMod = prefixPerMod || '';
    this.moduleName = meta.name;
    // this.guardsPerMod1 = guardsPerMod1 || [];
    this.unfinishedScanModules = unfinishedScanModules;
    this.meta = meta;
    this.checkImportsAndAppends(meta);
    this.importAndAppendModules();
    const moduleExtract: ModuleExtract = {
      // path: this.prefixPerMod,
      moduleName: meta.name,
      isExternal: meta.isExternal,
    };
    this.meta.providersPerMod.unshift({ token: ModuleExtract, useValue: moduleExtract });

    // const hasPath =
    //   isModuleWithParams(meta.modRefId) &&
    //   (meta.modRefId.path !== undefined || meta.modRefId.absolutePath !== undefined);

    // let applyControllers = false;
    // if (isRootModule(meta) || isAppends || hasPath) {
    //   applyControllers = true;
    // }

    let perMod: Map<any, ImportObj>;
    let perRou: Map<any, ImportObj>;
    let perReq: Map<any, ImportObj>;
    let multiPerMod: Map<ModuleType | BaseModuleWithParams, Provider[]>;
    let multiPerRou: Map<ModuleType | BaseModuleWithParams, Provider[]>;
    let multiPerReq: Map<ModuleType | BaseModuleWithParams, Provider[]>;
    let extensions: Map<ModuleType | BaseModuleWithParams, Provider[]>;
    let aExtensionConfig: ExtensionConfig[];
    if (meta.isExternal) {
      // External modules do not require global providers and extensions from the application.
      perMod = new Map([...this.importedProvidersPerMod]);
      perRou = new Map([...this.importedProvidersPerRou]);
      perReq = new Map([...this.importedProvidersPerReq]);
      multiPerMod = new Map([...this.importedMultiProvidersPerMod]);
      multiPerRou = new Map([...this.importedMultiProvidersPerRou]);
      multiPerReq = new Map([...this.importedMultiProvidersPerReq]);
      extensions = new Map([...this.importedExtensions]);
      aExtensionConfig = [...this.aImportedExtensionConfig];
    } else {
      perMod = new Map([...this.glProviders.importedProvidersPerMod, ...this.importedProvidersPerMod]);
      perRou = new Map([...this.glProviders.importedProvidersPerRou, ...this.importedProvidersPerRou]);
      perReq = new Map([...this.glProviders.importedProvidersPerReq, ...this.importedProvidersPerReq]);
      multiPerMod = new Map([...this.glProviders.importedMultiProvidersPerMod, ...this.importedMultiProvidersPerMod]);
      multiPerRou = new Map([...this.glProviders.importedMultiProvidersPerRou, ...this.importedMultiProvidersPerRou]);
      multiPerReq = new Map([...this.glProviders.importedMultiProvidersPerReq, ...this.importedMultiProvidersPerReq]);
      extensions = new Map([...this.glProviders.importedExtensions, ...this.importedExtensions]);
      aExtensionConfig = [...this.glProviders.aImportedExtensionConfig, ...this.aImportedExtensionConfig];
    }

    const allExtensionConfigs = meta.aExtensionConfig.concat(aExtensionConfig);
    this.checkExtensionsGraph(allExtensionConfigs);
    meta.aOrderedExtensions = topologicalSort<ExtensionClass, ExtensionConfigBase>(allExtensionConfigs, true);

    return this.appMetadataMap.set(modOrObj, {
      prefixPerMod,
      // guardsPerMod1: this.guardsPerMod1,
      meta: this.meta,
      // applyControllers,
      importedTokensMap: {
        perMod,
        perRou,
        perReq,
        multiPerMod,
        multiPerRou,
        multiPerReq,
        extensions,
      },
    });
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

  protected importAndAppendModules() {
    this.importOrAppendModules([...this.meta.importsModules, ...this.meta.importsWithParams], true);
    // this.importOrAppendModules([...this.meta.appendsModules, ...this.meta.appendsWithParams]);
    this.checkAllCollisionsWithLevelsMix();
  }

  protected importOrAppendModules(inputs: ModRefId[], isImport?: boolean) {
    for (const input of inputs) {
      const meta = this.moduleManager.getMetadata(input, true);
      if (isImport) {
        this.importProvidersAndExtensions(meta);
      }

      let prefixPerMod = '';
      // let guardsPerMod1: GuardPerMod1[] = [];
      const hasModuleParams = isModuleWithParams(input);
      if (hasModuleParams || !isImport) {
        // if (hasModuleParams && typeof input.absolutePath == 'string') {
        //   // Allow slash for absolutePath.
        //   prefixPerMod = input.absolutePath.startsWith('/') ? input.absolutePath.slice(1) : input.absolutePath;
        // } else {
          // const path = hasModuleParams ? input.path : '';
          prefixPerMod = [this.prefixPerMod, ''].filter((s) => s).join('/');
        // }
        // const impGuradsPerMod1 = meta.guardsPerMod.map<GuardPerMod1>((g) => ({ ...g, meta: this.meta }));
        // guardsPerMod1 = [...this.guardsPerMod1, ...impGuradsPerMod1];
      } else {
        prefixPerMod = this.prefixPerMod;
      }

      if (this.unfinishedScanModules.has(input)) {
        continue;
      }

      const moduleFactory = new ModuleFactory();
      this.unfinishedScanModules.add(input);
      const appMetadataMap = moduleFactory.bootstrap(
        this.providersPerApp,
        this.glProviders,
        prefixPerMod,
        input,
        this.moduleManager,
        this.unfinishedScanModules,
        // guardsPerMod1,
        // !isImport,
      );
      this.unfinishedScanModules.delete(input);

      this.appMetadataMap = new Map([...this.appMetadataMap, ...appMetadataMap]);
    }
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
    // if (meta1.exportedMultiProvidersPerRou.length) {
    //   this.importedMultiProvidersPerRou.set(modRefId, meta1.exportedMultiProvidersPerRou);
    // }
    // if (meta1.exportedMultiProvidersPerReq.length) {
    //   this.importedMultiProvidersPerReq.set(modRefId, meta1.exportedMultiProvidersPerReq);
    // }
    if (meta1.exportedExtensionsProviders.length) {
      this.importedExtensions.set(meta1.modRefId, meta1.exportedExtensionsProviders);
      this.aImportedExtensionConfig.push(...meta1.aExportedExtensionConfig);
    }
    this.throwIfTryResolvingMultiprovidersCollisions(meta1.name);
  }

  protected throwIfTryResolvingMultiprovidersCollisions(moduleName: string) {
    const levels: Level[] = ['Mod'];
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

  protected addProviders(level: Level, meta: NormalizedMeta) {
    meta[`exportedProvidersPer${level}`].forEach((provider) => {
      const token1 = getToken(provider);
      const importObj = this[`importedProvidersPer${level}`].get(token1);
      if (importObj) {
        this.checkCollisionsPerLevel(meta.modRefId, level, token1, provider, importObj);
        const hasResolvedCollision = this.meta[`resolvedCollisionsPer${level}`].some(([token2]) => token2 === token1);
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

  protected checkAllCollisionsWithLevelsMix() {
    this.checkCollisionsWithLevelsMix(this.providersPerApp, ['Mod']);
    // const providersPerMod = [
    //   ...defaultProvidersPerMod,
    //   ...this.meta.providersPerMod,
    //   ...getImportedProviders(this.importedProvidersPerMod),
    // ];
    // this.checkCollisionsWithLevelsMix(providersPerMod, ['Rou', 'Req']);
    // const mergedProvidersAndTokens = [
    //   ...this.meta.providersPerRou,
    //   ...getImportedProviders(this.importedProvidersPerRou),
    //   // ...defaultProvidersPerReq,
    // ];
    // this.checkCollisionsWithLevelsMix(mergedProvidersAndTokens, ['Req']);
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

  protected checkImportsAndAppends(meta: NormalizedMeta) {
    // [...meta.appendsModules].forEach((append) => {
    //   const appendedMeta = this.moduleManager.getMetadata(append, true);
    //   if (!appendedMeta.controllers.length) {
    //     const msg = `Appends to "${meta.name}" failed: "${appendedMeta.name}" must have controllers.`;
    //     throw new Error(msg);
    //   }
    //   const mod = getModule(append);
    //   if (meta.importsModules.includes(mod) || meta.importsWithParams.some((imp) => imp.module === mod)) {
    //     const msg = `Appends to "${meta.name}" failed: "${appendedMeta.name}" includes in both: imports and appends arrays.`;
    //     throw new Error(msg);
    //   }
    // });
  }
}
