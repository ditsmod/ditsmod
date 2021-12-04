import { Injectable, reflector } from '@ts-stack/di';

import { defaultProvidersPerMod, NODE_REQ, NODE_RES } from './constans';
import { ModConfig } from './models/mod-config';
import { NormalizedModuleMetadata } from './models/normalized-module-metadata';
import { defaultProvidersPerReq } from './services/default-providers-per-req';
import { ModuleManager } from './services/module-manager';
import { ControllerAndMethodMetadata } from './types/controller-and-method-metadata';
import { ImportObj, ImportsMap, MetadataPerMod1 } from './types/metadata-per-mod';
import {
  DecoratorMetadata,
  ExtensionsProvider,
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

  protected importsPerMod = new Map<any, ImportObj>();
  protected importsPerRou = new Map<any, ImportObj>();
  protected importsPerReq = new Map<any, ImportObj>();
  protected importsExtensions = new Map<any, ImportObj<ExtensionsProvider>>();

  protected globalProviders: ImportsMap;
  protected appMetadataMap = new Map<ModuleType | ModuleWithParams, MetadataPerMod1>();
  protected unfinishedScanModules = new Set<ModuleType | ModuleWithParams>();
  protected moduleManager: ModuleManager;

  exportGlobalProviders(moduleManager: ModuleManager, providersPerApp: ServiceProvider[]) {
    this.moduleManager = moduleManager;
    const meta = moduleManager.getMetadata('root', true);
    this.moduleName = meta.name;
    this.meta = meta;
    this.providersPerApp = providersPerApp;
    this.importProviders(meta);
    this.checkCollisionsWithScopesMix();

    return {
      importsPerMod: this.importsPerMod,
      importsPerRou: this.importsPerRou,
      importsPerReq: this.importsPerReq,
      importsExtensions: this.importsExtensions,
    };
  }

  /**
   * Bootstraps a module.
   *
   * @param modOrObj Module that will bootstrapped.
   */
  bootstrap(
    providersPerApp: ServiceProvider[],
    globalProviders: ImportsMap,
    prefixPerMod: string,
    modOrObj: ModuleType | ModuleWithParams,
    moduleManager: ModuleManager,
    unfinishedScanModules: Set<ModuleType | ModuleWithParams>,
    guardsPerMod?: NormalizedGuard[]
  ) {
    const meta = moduleManager.getMetadata(modOrObj, true);
    this.moduleManager = moduleManager;
    this.providersPerApp = providersPerApp;
    this.globalProviders = globalProviders;
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
        perMod: new Map([...this.globalProviders.importsPerMod, ...this.importsPerMod]),
        perRou: new Map([...this.globalProviders.importsPerRou, ...this.importsPerRou]),
        perReq: new Map([...this.globalProviders.importsPerReq, ...this.importsPerReq]),
        extensions: new Map([...this.globalProviders.importsExtensions, ...this.importsExtensions]),
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
        this.globalProviders,
        prefixPerMod,
        imp,
        this.moduleManager,
        this.unfinishedScanModules,
        guardsPerMod
      );
      this.unfinishedScanModules.delete(imp);

      this.appMetadataMap = new Map([...this.appMetadataMap, ...appMetadataMap]);
    }
    this.checkCollisionsWithScopesMix();
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
    meta1.exportsExtensions.forEach((provider) => {
      const token = getToken(provider);
      const newImportObj = new ImportObj<ExtensionsProvider>();
      newImportObj.module = module;
      const importObj = this.importsExtensions.get(token);
      if (importObj && importObj.module === module) {
        newImportObj.providers = importObj.providers.slice();
      }
      newImportObj.providers.push(provider);
      this.importsExtensions.set(token, newImportObj);
    });
  }

  protected addProviders(scope: Scope, module1: ModuleType | ModuleWithParams, meta: NormalizedModuleMetadata) {
    meta[`exportsProvidersPer${scope}`].forEach((provider) => {
      const token1 = getToken(provider);
      const importObj = this[`importsPer${scope}`].get(token1);
      if (importObj) {
        if (importObj.module === module1) {
          importObj.providers.push(provider);
        } else {
          this.checkCollisionsPerScope(module1, scope, token1, provider, importObj);
          const hasResolvedCollision = this.meta[`resolvedCollisionsPer${scope}`].some(([token2]) => token2 === token1);
          if (hasResolvedCollision) {
            const { provider2, module2 } = this.getResolvedCollisionsPerScope(scope, token1);
            const newImportObj = new ImportObj();
            newImportObj.module = module2;
            newImportObj.providers.push(provider2);
            this[`importsPer${scope}`].set(token1, newImportObj);
          }
        }
      } else {
        const newImportObj = new ImportObj();
        newImportObj.module = module1;
        newImportObj.providers.push(provider);
        this[`importsPer${scope}`].set(token1, newImportObj);
      }
    });
  }

  protected checkCollisionsPerScope(
    module: ModuleType | ModuleWithParams,
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
    const provider2 = getLastProviders(meta2[`providersPer${scope}`]).find((p) => getToken(p) === token2);
    if (!provider2) {
      errorMsg += `providersPer${scope} does not includes ${tokenName} in this module.`;
      throw new Error(errorMsg);
    }

    return { provider2, module2 };
  }

  /**
   * This method should be called before call `this.mergeProviders()`.
   */
  protected checkCollisionsWithScopesMix() {
    this.getCollisionsWithScopesMix(this.providersPerApp, ['Mod', 'Rou', 'Req']);
    const providersPerMod = [
      ...defaultProvidersPerMod,
      ...this.meta.providersPerMod,
      ...getImportedProviders(this.importsPerMod),
    ];
    this.getCollisionsWithScopesMix(providersPerMod, ['Rou', 'Req']);
    const mergedProvidersAndTokens = [
      ...this.meta.providersPerRou,
      ...getImportedProviders(this.importsPerRou),
      ...defaultProvidersPerReq,
      NODE_REQ,
      NODE_RES,
    ];
    this.getCollisionsWithScopesMix(mergedProvidersAndTokens, ['Req']);
  }

  protected getCollisionsWithScopesMix(providers: any[], scopes: Scope[]) {
    return getTokens(providers).forEach((token) => {
      for (const scope of scopes) {
        const declaredTokens = getTokens(this.meta[`providersPer${scope}`]);
        const importedTokens = getImportedTokens(this[`importsPer${scope}`]);
        const resolvedTokens = this.meta[`resolvedCollisionsPer${scope}`].map(([token]) => token);
        const collision = importedTokens.includes(token) && ![...declaredTokens, ...resolvedTokens].includes(token);
        if (collision) {
          const importObj = this[`importsPer${scope}`].get(token)!;
          const modulesName = getModuleName(importObj.module);
          throwProvidersCollisionError(this.moduleName, [token], [modulesName], scope);
        }
      }
    });
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
