import { injectable, reflector } from '#di';
import { defaultProvidersPerMod } from '#init/default-providers-per-mod.js';
import { ModuleExtract } from '#types/module-extract.js';
import type { NormalizedModuleMetadata } from '#types/normalized-module-metadata.js';
import { defaultProvidersPerReq } from './default-providers-per-req.js';
import type { ModuleManager } from '#init/module-manager.js';
import type { GlobalProviders, MetadataPerMod1 } from '#types/metadata-per-mod.js';
import { ImportObj } from '#types/metadata-per-mod.js';
import type { ModuleType, Scope, Provider, GuardPerMod1, ModRefId } from '#types/mix.js';
import type { ModuleWithParams } from '#types/module-metadata.js';
import { getCollisions } from '#utils/get-collisions.js';
import { getImportedProviders, getImportedTokens } from '#utils/get-imports.js';
import { getLastProviders } from '#utils/get-last-providers.js';
import { getToken, getTokens } from '#utils/get-tokens.js';
import { throwProvidersCollisionError } from '#utils/throw-providers-collision-error.js';
import { isAppendsWithParams, isModuleWithParams, isRootModule } from '#utils/type-guards.js';
import { hasDeclaredInDir } from '#utils/type-guards.js';
import { getModule } from '#utils/get-module.js';
import { getDebugClassName } from '#utils/get-debug-class-name.js';
import {
  ExtensionConfig,
  ExtensionConfig3,
  ExtensionConfigBase,
  isConfigWithOverrideExtension,
} from '#extension/get-extension-provider.js';
import { findCycle, GroupConfig } from '#extension/tarjan-graph.js';
import { getProviderName } from '#utils/get-provider-name.js';
import { topologicalSort } from '#extension/topological-sort.js';
import { ExtensionsGroupToken } from '#extension/extension-types.js';

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
  protected guardsPerMod1: GuardPerMod1[];
  /**
   * Module metadata.
   */
  protected meta: NormalizedModuleMetadata;

  protected importedProvidersPerMod = new Map<any, ImportObj>();
  protected importedProvidersPerRou = new Map<any, ImportObj>();
  protected importedProvidersPerReq = new Map<any, ImportObj>();
  protected importedMultiProvidersPerMod = new Map<ModuleType | ModuleWithParams, Provider[]>();
  protected importedMultiProvidersPerRou = new Map<ModuleType | ModuleWithParams, Provider[]>();
  protected importedMultiProvidersPerReq = new Map<ModuleType | ModuleWithParams, Provider[]>();
  protected importedExtensions = new Map<ModuleType | ModuleWithParams, Provider[]>();
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
    this.checkAllCollisionsWithScopesMix();

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
    guardsPerMod1?: GuardPerMod1[],
    isAppends?: boolean,
  ) {
    const meta = moduleManager.getMetadata(modOrObj, true);
    this.moduleManager = moduleManager;
    this.providersPerApp = providersPerApp;
    this.glProviders = globalProviders;
    this.prefixPerMod = prefixPerMod || '';
    this.moduleName = meta.name;
    this.guardsPerMod1 = guardsPerMod1 || [];
    this.unfinishedScanModules = unfinishedScanModules;
    this.meta = meta;
    this.checkImportsAndAppends(meta);
    this.importAndAppendModules();
    const moduleExtract: ModuleExtract = {
      path: this.prefixPerMod,
      moduleName: meta.name,
      isExternal: meta.isExternal,
    };
    this.meta.providersPerMod.unshift({ token: ModuleExtract, useValue: moduleExtract });

    const hasPath =
      isModuleWithParams(meta.modRefId) &&
      (meta.modRefId.path !== undefined || meta.modRefId.absolutePath !== undefined);

    let applyControllers = false;
    if (isRootModule(meta) || isAppends || hasPath) {
      applyControllers = true;
    }

    let perMod: Map<any, ImportObj>;
    let perRou: Map<any, ImportObj>;
    let perReq: Map<any, ImportObj>;
    let multiPerMod: Map<ModuleType | ModuleWithParams, Provider[]>;
    let multiPerRou: Map<ModuleType | ModuleWithParams, Provider[]>;
    let multiPerReq: Map<ModuleType | ModuleWithParams, Provider[]>;
    let extensions: Map<ModuleType | ModuleWithParams, Provider[]>;
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
    this.checkExtensionGroupsGraph(allExtensionConfigs);
    const aOrderedGroups = topologicalSort<ExtensionsGroupToken, ExtensionConfigBase>(allExtensionConfigs, true);
    aOrderedGroups.forEach(v => meta.sOrderedGroups.add(v));

    return this.appMetadataMap.set(modOrObj, {
      prefixPerMod,
      guardsPerMod1: this.guardsPerMod1,
      meta: this.meta,
      applyControllers,
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

  protected checkExtensionGroupsGraph(extensions: (GroupConfig<any> | ExtensionConfig3)[]) {
    const extensionWithBeforeGroup = extensions?.filter((config) => {
      return !isConfigWithOverrideExtension(config) && config.beforeGroup;
    }) as GroupConfig<any>[] | undefined;

    if (extensionWithBeforeGroup) {
      const path = findCycle(extensionWithBeforeGroup);
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
    this.importOrAppendModules([...this.meta.appendsModules, ...this.meta.appendsWithParams]);
    this.checkAllCollisionsWithScopesMix();
  }

  protected importOrAppendModules(inputs: ModRefId[], isImport?: boolean) {
    for (const input of inputs) {
      const meta = this.moduleManager.getMetadata(input, true);
      if (isImport) {
        this.importProvidersAndExtensions(meta);
      }

      let prefixPerMod = '';
      let guardsPerMod1: GuardPerMod1[] = [];
      const hasModuleParams = isModuleWithParams(input) || isAppendsWithParams(input);
      if (hasModuleParams || !isImport) {
        if (hasModuleParams && typeof input.absolutePath == 'string') {
          // Allow slash for absolutePath.
          prefixPerMod = input.absolutePath.startsWith('/') ? input.absolutePath.slice(1) : input.absolutePath;
        } else {
          const path = hasModuleParams ? input.path : '';
          prefixPerMod = [this.prefixPerMod, path].filter((s) => s).join('/');
        }
        const impGuradsPerMod1 = meta.guardsPerMod.map<GuardPerMod1>((g) => ({ ...g, meta: this.meta }));
        guardsPerMod1 = [...this.guardsPerMod1, ...impGuradsPerMod1];
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
        guardsPerMod1,
        !isImport,
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
  protected importProvidersAndExtensions(meta1: NormalizedModuleMetadata) {
    const { modRefId, exportsModules, exportsWithParams } = meta1;

    for (const modRefId of [...exportsModules, ...exportsWithParams]) {
      const meta2 = this.moduleManager.getMetadata(modRefId, true);
      // Reexported module
      this.importProvidersAndExtensions(meta2);
    }

    this.addProviders('Mod', meta1);
    this.addProviders('Rou', meta1);
    this.addProviders('Req', meta1);
    if (meta1.exportedMultiProvidersPerMod.length) {
      this.importedMultiProvidersPerMod.set(modRefId, meta1.exportedMultiProvidersPerMod);
    }
    if (meta1.exportedMultiProvidersPerRou.length) {
      this.importedMultiProvidersPerRou.set(modRefId, meta1.exportedMultiProvidersPerRou);
    }
    if (meta1.exportedMultiProvidersPerReq.length) {
      this.importedMultiProvidersPerReq.set(modRefId, meta1.exportedMultiProvidersPerReq);
    }
    if (meta1.exportedExtensionsProviders.length) {
      this.importedExtensions.set(meta1.modRefId, meta1.exportedExtensionsProviders);
      this.aImportedExtensionConfig.push(...meta1.aExportedExtensionConfig);
    }
    this.throwIfTryResolvingMultiprovidersCollisions(meta1.name);
  }

  protected throwIfTryResolvingMultiprovidersCollisions(moduleName: string) {
    const scopes: Scope[] = ['Mod', 'Rou', 'Req'];
    scopes.forEach((scope) => {
      const tokens: any[] = [];
      this[`importedMultiProvidersPer${scope}`].forEach((providers) => tokens.push(...getTokens(providers)));
      this.meta[`resolvedCollisionsPer${scope}`].some(([token]) => {
        if (tokens.includes(token)) {
          const tokenName = token.name || token;
          const errorMsg =
            `Resolving collisions for providersPer${scope} in ${this.moduleName} failed: ` +
            `${tokenName} mapped with ${moduleName}, but ${tokenName} is a token of the multi providers, ` +
            `and in this case it should not be included in resolvedCollisionsPer${scope}.`;
          throw new Error(errorMsg);
        }
      });
    });
  }

  protected addProviders(scope: Scope, meta: NormalizedModuleMetadata) {
    meta[`exportedProvidersPer${scope}`].forEach((provider) => {
      const token1 = getToken(provider);
      const importObj = this[`importedProvidersPer${scope}`].get(token1);
      if (importObj) {
        this.checkCollisionsPerScope(meta.modRefId, scope, token1, provider, importObj);
        const hasResolvedCollision = this.meta[`resolvedCollisionsPer${scope}`].some(([token2]) => token2 === token1);
        if (hasResolvedCollision) {
          const { providers, module2 } = this.getResolvedCollisionsPerScope(scope, token1);
          const newImportObj = new ImportObj();
          newImportObj.modRefId = module2;
          newImportObj.providers.push(...providers);
          this[`importedProvidersPer${scope}`].set(token1, newImportObj);
        }
      } else {
        const newImportObj = new ImportObj();
        newImportObj.modRefId = meta.modRefId;
        newImportObj.providers.push(provider);
        this[`importedProvidersPer${scope}`].set(token1, newImportObj);
      }
    });
  }

  protected checkCollisionsPerScope(
    modRefId: ModRefId,
    scope: Scope,
    token: NonNullable<unknown>,
    provider: Provider,
    importObj: ImportObj,
  ) {
    const declaredTokens = getTokens(this.meta[`providersPer${scope}`]);
    const resolvedTokens = this.meta[`resolvedCollisionsPer${scope}`].map(([token]) => token);
    const duplImpTokens = [...declaredTokens, ...resolvedTokens].includes(token) ? [] : [token];
    const collisions = getCollisions(duplImpTokens, [...importObj.providers, provider]);
    if (collisions.length) {
      const moduleName1 = getDebugClassName(importObj.modRefId);
      const moduleName2 = getDebugClassName(modRefId);
      throwProvidersCollisionError(this.moduleName, [token], [moduleName1, moduleName2], scope, this.meta.isExternal);
    }
  }

  protected getResolvedCollisionsPerScope(scope: Scope, token1: any) {
    const [token2, modRefId2] = this.meta[`resolvedCollisionsPer${scope}`].find(([token2]) => token1 === token2)!;
    const moduleName = getDebugClassName(modRefId2);
    const tokenName = token2.name || token2;
    const meta2 = this.moduleManager.getMetadata(modRefId2);
    let errorMsg =
      `Resolving collisions for providersPer${scope} in ${this.moduleName} failed: ` +
      `${tokenName} mapped with ${moduleName}, but `;
    if (!meta2) {
      errorMsg += `${moduleName} is not imported into the application.`;
      throw new Error(errorMsg);
    }
    const providers = getLastProviders(meta2[`providersPer${scope}`]).filter((p) => getToken(p) === token2);
    if (!providers.length) {
      errorMsg += `providersPer${scope} does not includes ${tokenName} in this module.`;
      throw new Error(errorMsg);
    }

    return { module2: modRefId2, providers };
  }

  protected checkAllCollisionsWithScopesMix() {
    this.checkCollisionsWithScopesMix(this.providersPerApp, ['Mod', 'Rou', 'Req']);
    const providersPerMod = [
      ...defaultProvidersPerMod,
      ...this.meta.providersPerMod,
      ...getImportedProviders(this.importedProvidersPerMod),
    ];
    this.checkCollisionsWithScopesMix(providersPerMod, ['Rou', 'Req']);
    const mergedProvidersAndTokens = [
      ...this.meta.providersPerRou,
      ...getImportedProviders(this.importedProvidersPerRou),
      ...defaultProvidersPerReq,
    ];
    this.checkCollisionsWithScopesMix(mergedProvidersAndTokens, ['Req']);
  }

  protected checkCollisionsWithScopesMix(providers: any[], scopes: Scope[]) {
    getTokens(providers).forEach((token) => {
      for (const scope of scopes) {
        const declaredTokens = getTokens(this.meta[`providersPer${scope}`]);
        const importedTokens = getImportedTokens(this[`importedProvidersPer${scope}`]);
        const resolvedTokens = this.meta[`resolvedCollisionsPer${scope}`].map(([t]) => t);
        const collision = importedTokens.includes(token) && ![...declaredTokens, ...resolvedTokens].includes(token);
        if (collision) {
          const importObj = this[`importedProvidersPer${scope}`].get(token)!;
          const hostModulePath = this.moduleManager.getMetadata(importObj.modRefId)?.declaredInDir || '.';
          const decorAndVal = reflector.getDecorators(token, hasDeclaredInDir)?.at(0);
          const collisionWithPath = decorAndVal?.declaredInDir || '.';
          if (hostModulePath !== '.' && collisionWithPath !== '.' && collisionWithPath.startsWith(hostModulePath)) {
            // Allow collisions in host modules.
          } else {
            const hostModuleName = getDebugClassName(importObj.modRefId);
            throwProvidersCollisionError(this.moduleName, [token], [hostModuleName], scope, this.meta.isExternal);
          }
        }
        this.resolveCollisionsWithScopesMix(token, scope, resolvedTokens);
      }
    });
  }

  protected resolveCollisionsWithScopesMix(token1: any, scope: Scope, resolvedTokens: any[]) {
    if (resolvedTokens.includes(token1)) {
      const [, module2] = this.meta[`resolvedCollisionsPer${scope}`].find(([token2]) => token1 === token2)!;
      if (this.meta.modRefId === module2) {
        if (!this[`importedProvidersPer${scope}`].delete(token1)) {
          const tokenName = token1.name || token1;
          const errorMsg =
            `Resolving collisions for providersPer${scope} in ${this.moduleName} failed: ` +
            `${tokenName} mapped with ${this.moduleName}, but ` +
            `providersPer${scope} does not imports ${tokenName} in this module.`;
          throw new Error(errorMsg);
        }
      } else {
        // Only check that the correct data is specified.
        this.getResolvedCollisionsPerScope(scope, token1);
      }
    }
  }

  protected checkImportsAndAppends(meta: NormalizedModuleMetadata) {
    [...meta.appendsWithParams, ...meta.appendsModules].forEach((append) => {
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
