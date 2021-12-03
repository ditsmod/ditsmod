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

/**
 * - exports and imports global providers;
 * - merges global and local providers;
 * - checks on providers collisions;
 * - collects module and controllers metadata.
 */
@Injectable()
export class ModuleFactory {
  protected moduleName: string;
  protected prefixPerMod: string;
  protected guardsPerMod: NormalizedGuard[];
  protected providersPerApp: ServiceProvider[];
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
      const obj = new ImportObj<ExtensionsProvider>();
      obj.module = module;
      const importObj = this.importsExtensions.get(token);
      if (importObj && importObj.module === module) {
        obj.providers = importObj.providers.slice();
      }
      obj.providers.push(provider);
      this.importsExtensions.set(token, obj);
    });
  }

  protected addProviders(scope: Scope, module: ModuleType | ModuleWithParams, meta: NormalizedModuleMetadata) {
    const exp = meta[`exportsProvidersPer${scope}`];
    if (exp.length) {
      exp.forEach((provider) => {
        const token = getToken(provider);
        const obj = new ImportObj();
        obj.module = module;
        const importObj = this[`importsPer${scope}`].get(token);
        if (importObj) {
          if (importObj.module === module) {
            obj.providers = importObj.providers.slice();
          } else {
            this.checkCollisionsPerScope(module, scope, token, provider, importObj);
          }
        }
        obj.providers.push(provider);
        this[`importsPer${scope}`].set(token, obj);
      });
    }
  }

  protected checkCollisionsPerScope(
    module: ModuleType | ModuleWithParams,
    scope: Scope,
    token: any,
    provider: ServiceProvider,
    importObj: ImportObj
  ) {
    const declaredTokens = getTokens(this.meta[`providersPer${scope}`]);
    const duplImpTokens = declaredTokens.includes(token) ? [] : [token];
    const collisions = getCollisions(duplImpTokens, [...importObj.providers, provider]);
    if (collisions.length) {
      const modulesNames = [importObj.module, module].map(getModuleName);
      throwProvidersCollisionError(this.moduleName, [token], modulesNames, scope);
    }
  }

  /**
   * This method should be called before call `this.mergeProviders()`.
   */
  protected checkCollisionsWithScopesMix() {
    const mixPerApp = this.getCollisionsWithScopesMix(this.providersPerApp, ['Mod', 'Rou', 'Req']);
    const providersPerMod = [
      ...defaultProvidersPerMod,
      ...this.meta.providersPerMod,
      ...getImportedProviders(this.importsPerMod),
    ];
    const mixPerMod = this.getCollisionsWithScopesMix(providersPerMod, ['Rou', 'Req']);
    const mergedProvidersAndTokens = [
      ...this.meta.providersPerRou,
      ...getImportedProviders(this.importsPerRou),
      ...defaultProvidersPerReq,
      NODE_REQ,
      NODE_RES,
    ];
    const mixPerRou = this.getCollisionsWithScopesMix(mergedProvidersAndTokens, ['Req']);

    const collisions = [...mixPerApp, ...mixPerMod, ...mixPerRou];
    if (collisions.length) {
      throwProvidersCollisionError(this.moduleName, collisions);
    }
  }

  protected getCollisionsWithScopesMix(providers: any[], scopes: Scope[]) {
    return getTokens(providers).filter((p) => {
      for (const scope of scopes) {
        const declaredTokens = getTokens(this.meta[`providersPer${scope}`]);
        const importedTokens = getImportedTokens(this[`importsPer${scope}`]);
        const collision = importedTokens.includes(p) && !declaredTokens.includes(p);
        if (collision) {
          return true;
        }
      }
      return false;
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
