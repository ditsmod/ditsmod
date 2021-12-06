import { Injectable, reflector } from '@ts-stack/di';

import { defaultProvidersPerMod, NODE_REQ, NODE_RES } from './constans';
import { ModConfig } from './models/mod-config';
import { NormalizedModuleMetadata } from './models/normalized-module-metadata';
import { defaultProvidersPerReq } from './services/default-providers-per-req';
import { ModuleManager } from './services/module-manager';
import { ControllerAndMethodMetadata } from './types/controller-and-method-metadata';
import { ImportObj, GlobalProviders, MetadataPerMod1 } from './types/metadata-per-mod';
import {
  DecoratorMetadata,
  ExtensionProvider,
  ModuleType,
  ModuleWithParams,
  NormalizedGuard,
  Scope,
  ServiceProvider,
} from './types/mix';
import { deepFreeze } from './utils/deep-freeze';
import { getCollisions } from './utils/get-collisions';
import { getToken, getTokens } from './utils/get-tokens';
import { throwProvidersCollisionError } from './utils/throw-providers-collision-error';
import { isController, isModuleWithParams } from './utils/type-guards';
import { getImportedProviders, getImportedTokens } from './utils/get-imports';
import { getModuleName } from './utils/get-module-name';
import { getLastProviders } from './utils/get-last-providers';

type AnyModule = ModuleType | ModuleWithParams;

/**
 * - exports and imports global providers;
 * - merges global and local providers;
 * - checks on providers collisions;
 * - collects module and controllers metadata.
 */
@Injectable()
export class ModuleFactory {
  protected providersPerApp: ServiceProvider[];
  protected moduleName: string;
  protected prefixPerMod: string;
  protected guardsPerMod: NormalizedGuard[];
  /**
   * Module metadata.
   */
  protected meta: NormalizedModuleMetadata;

  protected importedProvidersPerMod = new Map<any, ImportObj>();
  protected importedProvidersPerRou = new Map<any, ImportObj>();
  protected importedProvidersPerReq = new Map<any, ImportObj>();
  protected importedMultiProvidersPerMod = new Map<AnyModule, ServiceProvider[]>();
  protected importedMultiProvidersPerRou = new Map<AnyModule, ServiceProvider[]>();
  protected importedMultiProvidersPerReq = new Map<AnyModule, ServiceProvider[]>();
  protected importedExtensions = new Map<AnyModule, ExtensionProvider[]>();

  /**
   * GlobalProviders.
   */
  protected glProviders: GlobalProviders;
  protected appMetadataMap = new Map<AnyModule, MetadataPerMod1>();
  protected unfinishedScanModules = new Set<AnyModule>();
  protected moduleManager: ModuleManager;

  exportGlobalProviders(moduleManager: ModuleManager, providersPerApp: ServiceProvider[]) {
    this.moduleManager = moduleManager;
    const meta = moduleManager.getMetadata('root', true);
    this.moduleName = meta.name;
    this.meta = meta;
    this.providersPerApp = providersPerApp;
    this.importProviders(meta);
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
    providersPerApp: ServiceProvider[],
    globalProviders: GlobalProviders,
    prefixPerMod: string,
    modOrObj: AnyModule,
    moduleManager: ModuleManager,
    unfinishedScanModules: Set<AnyModule>,
    guardsPerMod?: NormalizedGuard[]
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
    this.importModules();
    const modConfig: ModConfig = { prefixPerMod: this.prefixPerMod };
    this.meta.providersPerMod.unshift({ provide: ModConfig, useValue: modConfig });
    const controllersMetadata = this.getControllersMetadata();

    return this.appMetadataMap.set(modOrObj, {
      prefixPerMod,
      guardsPerMod: this.guardsPerMod,
      meta: this.meta,
      controllersMetadata: deepFreeze(controllersMetadata),
      importedTokensMap: {
        perMod: new Map([...this.glProviders.importedProvidersPerMod, ...this.importedProvidersPerMod]),
        perRou: new Map([...this.glProviders.importedProvidersPerRou, ...this.importedProvidersPerRou]),
        perReq: new Map([...this.glProviders.importedProvidersPerReq, ...this.importedProvidersPerReq]),
        multiPerMod: new Map([...this.glProviders.importedMultiProvidersPerMod, ...this.importedMultiProvidersPerMod]),
        multiPerRou: new Map([...this.glProviders.importedMultiProvidersPerRou, ...this.importedMultiProvidersPerRou]),
        multiPerReq: new Map([...this.glProviders.importedMultiProvidersPerReq, ...this.importedMultiProvidersPerReq]),
        extensions: new Map([...this.glProviders.importedExtensions, ...this.importedExtensions]),
      },
    });
  }

  protected importModules() {
    for (const imp of [...this.meta.importsModules, ...this.meta.importsWithParams]) {
      const meta = this.moduleManager.getMetadata(imp, true);
      this.importProviders(meta);

      let prefixPerMod = '';
      let guardsPerMod: NormalizedGuard[] = [];
      if (isModuleWithParams(imp)) {
        prefixPerMod = [this.prefixPerMod, imp.prefix].filter((s) => s).join('/');
        guardsPerMod = [...this.guardsPerMod, ...meta.normalizedGuardsPerMod];
      }

      const moduleFactory = new ModuleFactory();

      if (this.unfinishedScanModules.has(imp)) {
        continue;
      }
      this.unfinishedScanModules.add(imp);
      const appMetadataMap = moduleFactory.bootstrap(
        this.providersPerApp,
        this.glProviders,
        prefixPerMod,
        imp,
        this.moduleManager,
        this.unfinishedScanModules,
        guardsPerMod
      );
      this.unfinishedScanModules.delete(imp);

      this.appMetadataMap = new Map([...this.appMetadataMap, ...appMetadataMap]);
    }
    this.checkAllCollisionsWithScopesMix();
  }

  /**
   * Recursively imports providers.
   *
   * @param meta1 Module metadata from where imports providers.
   */
  protected importProviders(meta1: NormalizedModuleMetadata) {
    const { module, exportsModules, exportsWithParams } = meta1;

    for (const mod of [...exportsModules, ...exportsWithParams]) {
      const meta2 = this.moduleManager.getMetadata(mod, true);
      // Reexported module
      this.importProviders(meta2);
    }

    this.addProviders('Mod', module, meta1);
    this.addProviders('Rou', module, meta1);
    this.addProviders('Req', module, meta1);
    this.importedMultiProvidersPerMod.set(module, meta1.exportedMultiProvidersPerMod);
    this.importedMultiProvidersPerRou.set(module, meta1.exportedMultiProvidersPerRou);
    this.importedMultiProvidersPerReq.set(module, meta1.exportedMultiProvidersPerReq);
    this.importedExtensions.set(meta1.module, meta1.exportedExtensions);
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
          let errorMsg =
            `Resolving collisions for providersPer${scope} in ${this.moduleName} failed: ` +
            `${tokenName} mapped with ${moduleName}, but ${tokenName} is a token of the multi providers, ` +
            `and in this case it should not be included in resolvedCollisionsPer${scope}.`;
          throw new Error(errorMsg);
        }
      });
    });
  }

  protected addProviders(scope: Scope, module1: AnyModule, meta: NormalizedModuleMetadata) {
    meta[`exportedProvidersPer${scope}`].forEach((provider) => {
      const token1 = getToken(provider);
      const importObj = this[`importedProvidersPer${scope}`].get(token1);
      if (importObj) {
        this.checkCollisionsPerScope(module1, scope, token1, provider, importObj);
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
        newImportObj.module = module1;
        newImportObj.providers.push(provider);
        this[`importedProvidersPer${scope}`].set(token1, newImportObj);
      }
    });
  }

  protected checkCollisionsPerScope(
    module: AnyModule,
    scope: Scope,
    token: any,
    provider: ServiceProvider,
    importObj: ImportObj
  ) {
    const declaredTokens = getTokens(this.meta[`providersPer${scope}`]);
    const resolvedTokens = this.meta[`resolvedCollisionsPer${scope}`].map(([token]) => token);
    const duplImpTokens = [...declaredTokens, ...resolvedTokens].includes(token) ? [] : [token];
    const collisions = getCollisions(duplImpTokens, [...importObj.providers, provider]);
    if (collisions.length) {
      const modulesNames = [importObj.module, module].map(getModuleName);
      throwProvidersCollisionError(this.moduleName, [token], modulesNames, scope);
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

  /**
   * This method should be called before call `this.mergeProviders()`.
   */
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
      NODE_REQ,
      NODE_RES,
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
          const modulesName = getModuleName(importObj.module);
          throwProvidersCollisionError(this.moduleName, [token1], [modulesName], scope);
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
          let errorMsg =
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

  protected getControllersMetadata() {
    const arrControllerMetadata: ControllerAndMethodMetadata[] = [];
    for (const controller of this.meta.controllers) {
      const ctrlDecorValues = reflector.annotations(controller);
      if (!ctrlDecorValues.find(isController)) {
        throw new Error(
          `Collecting controller's metadata failed: class "${controller.name}" does not have the "@Controller()" decorator`
        );
      }
      const controllerMetadata: ControllerAndMethodMetadata = { controller, ctrlDecorValues, methods: {} };
      const propMetadata = reflector.propMetadata(controller);
      for (const methodName in propMetadata) {
        const methodDecorValues = propMetadata[methodName];
        controllerMetadata.methods[methodName] = methodDecorValues.map<DecoratorMetadata>((decoratorValue, i) => {
          const otherDecorators = methodDecorValues.slice();
          otherDecorators.splice(i, 1);
          return { otherDecorators, value: decoratorValue };
        });
      }
      arrControllerMetadata.push(controllerMetadata);
    }

    return arrControllerMetadata;
  }
}
