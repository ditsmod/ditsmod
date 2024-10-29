import { injectable, reflector } from '#di';
import { getModuleMetadata } from '#utils/get-module-metadata.js';
import { defaultProvidersPerMod } from './constans.js';
import { ModuleExtract } from './types/module-extract.js';
import type { NormalizedModuleMetadata } from './types/normalized-module-metadata.js';
import { defaultProvidersPerReq } from './default-providers-per-req.js';
import type { ModuleManager } from './services/module-manager.js';
import type { GlobalProviders, MetadataPerMod1 } from './types/metadata-per-mod.js';
import { ImportObj } from './types/metadata-per-mod.js';
import type { ModuleType, Scope, Provider, GuardPerMod1 } from './types/mix.js';
import type { ModuleWithParams, AppendsWithParams } from './types/module-metadata.js';
import type { ExtensionProvider } from '#types/extension-types.js';
import { getCollisions } from './utils/get-collisions.js';
import { getImportedProviders, getImportedTokens } from './utils/get-imports.js';
import { getLastProviders } from './utils/get-last-providers.js';
import { getModuleName } from './utils/get-module-name.js';
import { getToken, getTokens } from './utils/get-tokens.js';
import { throwProvidersCollisionError } from './utils/throw-providers-collision-error.js';
import { isAppendsWithParams, isModuleWithParams, isNormRootModule } from './utils/type-guards.js';

type AnyModule = ModuleType | ModuleWithParams | AppendsWithParams;

/**
 * - exports and imports global providers;
 * - merges global and local providers;
 * - checks on providers collisions;
 * - collects module and controllers metadata.
 */
@injectable()
export class ModuleFactory {
  protected providersPerApp: Provider[];
  protected moduleName: string;
  protected prefixPerMod: string;
  protected guardsPerMod: GuardPerMod1[];
  /**
   * Module metadata.
   */
  protected meta: NormalizedModuleMetadata;

  protected importedProvidersPerMod = new Map<any, ImportObj>();
  protected importedProvidersPerRou = new Map<any, ImportObj>();
  protected importedProvidersPerReq = new Map<any, ImportObj>();
  protected importedMultiProvidersPerMod = new Map<AnyModule, Provider[]>();
  protected importedMultiProvidersPerRou = new Map<AnyModule, Provider[]>();
  protected importedMultiProvidersPerReq = new Map<AnyModule, Provider[]>();
  protected importedExtensions = new Map<AnyModule, ExtensionProvider[]>();

  /**
   * GlobalProviders.
   */
  protected glProviders: GlobalProviders;
  protected appMetadataMap = new Map<AnyModule, MetadataPerMod1>();
  protected unfinishedScanModules = new Set<AnyModule>();
  protected moduleManager: ModuleManager;

  exportGlobalProviders(moduleManager: ModuleManager, providersPerApp: Provider[]) {
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
    modOrObj: AnyModule,
    moduleManager: ModuleManager,
    unfinishedScanModules: Set<AnyModule>,
    guardsPerMod?: GuardPerMod1[],
    isAppends?: boolean,
  ) {
    const meta = moduleManager.getMetadata(modOrObj, true);
    this.moduleManager = moduleManager;
    this.providersPerApp = providersPerApp;
    this.glProviders = globalProviders;
    this.prefixPerMod = prefixPerMod || '';
    this.moduleName = meta.name;
    this.guardsPerMod = guardsPerMod || [];
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
      isModuleWithParams(meta.module) && (meta.module.path !== undefined || meta.module.absolutePath !== undefined);

    let applyControllers = false;
    if (isNormRootModule(meta) || isAppends || hasPath) {
      applyControllers = true;
    }

    let perMod: Map<any, ImportObj>;
    let perRou: Map<any, ImportObj>;
    let perReq: Map<any, ImportObj>;
    let multiPerMod: Map<ModuleType | ModuleWithParams, Provider[]>;
    let multiPerRou: Map<ModuleType | ModuleWithParams, Provider[]>;
    let multiPerReq: Map<ModuleType | ModuleWithParams, Provider[]>;
    let extensions: Map<ModuleType | ModuleWithParams, ExtensionProvider[]>;
    if (meta.isExternal) {
      // External modules do not require global providers and extensions from the application.
      perMod = new Map([...this.importedProvidersPerMod]);
      perRou = new Map([...this.importedProvidersPerRou]);
      perReq = new Map([...this.importedProvidersPerReq]);
      multiPerMod = new Map([...this.importedMultiProvidersPerMod]);
      multiPerRou = new Map([...this.importedMultiProvidersPerRou]);
      multiPerReq = new Map([...this.importedMultiProvidersPerReq]);
      extensions = new Map([...this.importedExtensions]);
    } else {
      perMod = new Map([...this.glProviders.importedProvidersPerMod, ...this.importedProvidersPerMod]);
      perRou = new Map([...this.glProviders.importedProvidersPerRou, ...this.importedProvidersPerRou]);
      perReq = new Map([...this.glProviders.importedProvidersPerReq, ...this.importedProvidersPerReq]);
      multiPerMod = new Map([...this.glProviders.importedMultiProvidersPerMod, ...this.importedMultiProvidersPerMod]);
      multiPerRou = new Map([...this.glProviders.importedMultiProvidersPerRou, ...this.importedMultiProvidersPerRou]);
      multiPerReq = new Map([...this.glProviders.importedMultiProvidersPerReq, ...this.importedMultiProvidersPerReq]);
      extensions = new Map([...this.glProviders.importedExtensions, ...this.importedExtensions]);
    }

    return this.appMetadataMap.set(modOrObj, {
      prefixPerMod,
      guardsPerMod: this.guardsPerMod,
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

  protected importAndAppendModules() {
    this.importOrAppendModules([...this.meta.importsModules, ...this.meta.importsWithParams], true);
    this.importOrAppendModules(this.meta.appendsWithParams);
    this.checkAllCollisionsWithScopesMix();
  }

  protected importOrAppendModules(inputs: Array<AnyModule>, isImport?: boolean) {
    for (const input of inputs) {
      const meta = this.moduleManager.getMetadata(input, true);
      if (isImport) {
        this.importProvidersAndExtensions(meta);
      }

      let prefixPerMod = '';
      let guardsPerMod: GuardPerMod1[] = [];
      if ((isImport && isModuleWithParams(input)) || isAppendsWithParams(input)) {
        if (typeof input.absolutePath == 'string') {
          prefixPerMod = input.absolutePath;
        } else {
          prefixPerMod = [this.prefixPerMod, input.path].filter((s) => s).join('/');
        }
        const impGuradsPerMod = meta.guardsPerMod.map<GuardPerMod1>((g) => ({ ...g, hostModule: this.meta.module }));
        guardsPerMod = [...this.guardsPerMod, ...impGuradsPerMod];
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
        guardsPerMod,
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
    const { module, exportsModules, exportsWithParams } = meta1;

    for (const mod of [...exportsModules, ...exportsWithParams]) {
      const meta2 = this.moduleManager.getMetadata(mod, true);
      // Reexported module
      this.importProvidersAndExtensions(meta2);
    }

    this.addProviders('Mod', meta1);
    this.addProviders('Rou', meta1);
    this.addProviders('Req', meta1);
    if (meta1.exportedMultiProvidersPerMod.length) {
      this.importedMultiProvidersPerMod.set(module, meta1.exportedMultiProvidersPerMod);
    }
    if (meta1.exportedMultiProvidersPerRou.length) {
      this.importedMultiProvidersPerRou.set(module, meta1.exportedMultiProvidersPerRou);
    }
    if (meta1.exportedMultiProvidersPerReq.length) {
      this.importedMultiProvidersPerReq.set(module, meta1.exportedMultiProvidersPerReq);
    }
    if (meta1.exportedExtensions.length) {
      this.importedExtensions.set(meta1.module, meta1.exportedExtensions);
    }
    this.throwIfTryResolvingMultiprovidersCollisions(module);
  }

  protected throwIfTryResolvingMultiprovidersCollisions(module: AnyModule) {
    const scopes: Scope[] = ['Mod', 'Rou', 'Req'];
    scopes.forEach((scope) => {
      const tokens: any[] = [];
      this[`importedMultiProvidersPer${scope}`].forEach((providers) => tokens.push(...getTokens(providers)));
      this.meta[`resolvedCollisionsPer${scope}`].some(([token]) => {
        if (tokens.includes(token)) {
          const moduleName = getModuleName(module);
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
        this.checkCollisionsPerScope(meta.module, scope, token1, provider, importObj);
        const hasResolvedCollision = this.meta[`resolvedCollisionsPer${scope}`].some(([token2]) => token2 === token1);
        if (hasResolvedCollision) {
          const { providers, module2 } = this.getResolvedCollisionsPerScope(scope, token1);
          const newImportObj = new ImportObj();
          newImportObj.module = module2;
          newImportObj.providers.push(...providers);
          this[`importedProvidersPer${scope}`].set(token1, newImportObj);
        }
      } else {
        const newImportObj = new ImportObj();
        newImportObj.module = meta.module;
        newImportObj.providers.push(provider);
        this[`importedProvidersPer${scope}`].set(token1, newImportObj);
      }
    });
  }

  protected checkCollisionsPerScope(
    module: AnyModule,
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
      const modulesNames = [importObj.module, module].map(getModuleName);
      throwProvidersCollisionError(this.moduleName, [token], modulesNames, scope, this.meta.isExternal);
    }
  }

  protected getResolvedCollisionsPerScope(scope: Scope, token1: any) {
    const [token2, module2] = this.meta[`resolvedCollisionsPer${scope}`].find(([token2]) => token1 === token2)!;
    const moduleName = getModuleName(module2);
    const tokenName = token2.name || token2;
    const meta2 = this.moduleManager.getMetadata(module2);
    let errorMsg =
      `Resolving collisions for providersPer${scope} in ${this.moduleName} failed: ` +
      `${tokenName} mapped with ${moduleName}, but `;
    if (!meta2) {
      errorMsg += `${moduleName} is not imported into the application.`;
      throw new Error(errorMsg);
    }
    const providers = getLastProviders(meta2[`providersPer${scope}`]).filter((p) => getToken(p) === token2);
    if (!providers) {
      errorMsg += `providersPer${scope} does not includes ${tokenName} in this module.`;
      throw new Error(errorMsg);
    }

    return { module2, providers };
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
    getTokens(providers).forEach((token1) => {
      for (const scope of scopes) {
        const declaredTokens = getTokens(this.meta[`providersPer${scope}`]);
        const importedTokens = getImportedTokens(this[`importedProvidersPer${scope}`]);
        const resolvedTokens = this.meta[`resolvedCollisionsPer${scope}`].map(([t]) => t);
        const collision = importedTokens.includes(token1) && ![...declaredTokens, ...resolvedTokens].includes(token1);
        if (collision) {
          const importObj = this[`importedProvidersPer${scope}`].get(token1)!;
          const hostModulePath = getModuleMetadata(importObj.module)?.declaredInDir || '';
          const collisionWithPath = reflector.getMetadata(token1)?.constructor.decorators.at(-1)?.declaredInDir || '';
          if (hostModulePath !== '.' && collisionWithPath !== '.' && collisionWithPath.startsWith(hostModulePath)) {
            // Allow collisions in host modules.
          } else {
            const hostModuleName = getModuleName(importObj.module);
            throwProvidersCollisionError(this.moduleName, [token1], [hostModuleName], scope, this.meta.isExternal);
          }
        }
        this.resolveCollisionsWithScopesMix(token1, scope, resolvedTokens);
      }
    });
  }

  protected resolveCollisionsWithScopesMix(token1: any, scope: Scope, resolvedTokens: any[]) {
    if (resolvedTokens.includes(token1)) {
      const [, module2] = this.meta[`resolvedCollisionsPer${scope}`].find(([token2]) => token1 === token2)!;
      if (this.meta.module === module2) {
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
    const appendedModules: Array<ModuleType | ModuleWithParams> = [];

    this.meta.appendsWithParams.forEach((mod) => {
      const appendedMeta = this.moduleManager.getMetadata(mod, true);
      if (!appendedMeta.controllers.length) {
        const msg = `Appends to "${meta.name}" failed: "${appendedMeta.name}" must have controllers.`;
        throw new Error(msg);
      }
      appendedModules.push(appendedMeta.module);
    });

    if (!appendedModules.length) {
      return;
    }

    [...meta.importsModules, ...meta.importsWithParams].forEach((imp) => {
      const importedMeta = this.moduleManager.getMetadata(imp, true);
      if (appendedModules.includes(importedMeta.module)) {
        const msg = `Appends to "${meta.name}" failed: "${importedMeta.name}" includes in both: imports and appends arrays.`;
        throw new Error(msg);
      }
    });
  }
}
