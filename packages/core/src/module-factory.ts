import { Injectable, reflector } from '@ts-stack/di';

import { defaultProvidersPerMod, NODE_REQ, NODE_RES } from './constans';
import { ModConfig } from './models/mod-config';
import { NormalizedModuleMetadata } from './models/normalized-module-metadata';
import { ProvidersMetadata } from './models/providers-metadata';
import { defaultProvidersPerReq } from './services/default-providers-per-req';
import { ModuleManager } from './services/module-manager';
import { ControllerAndMethodMetadata } from './types/controller-and-method-metadata';
import { ImportObj, ImportsMap, MetadataPerMod1 } from './types/metadata-per-mod';
import {
  DecoratorMetadata,
  ExtensionsProvider,
  GuardItem,
  ModuleType,
  ModuleWithParams,
  NormalizedGuard,
  ServiceProvider,
} from './types/mix';
import { deepFreeze } from './utils/deep-freeze';
import { getCollisions } from './utils/get-collisions';
import { getDuplicates } from './utils/get-duplicates';
import { getToken, getTokens } from './utils/get-tokens';
import { normalizeProviders } from './utils/ng-utils';
import { throwProvidersCollisionError } from './utils/throw-providers-collision-error';
import { isController, isModuleWithParams } from './utils/type-guards';

/**
 * - imports and exports global providers;
 * - merges global and local providers;
 * - checks on providers collisions;
 * - collects module and controllers metadata.
 */
@Injectable()
export class ModuleFactory {
  protected moduleName: string;
  protected prefixPerMod: string;
  protected guardsPerMod: NormalizedGuard[];
  /**
   * Module metadata.
   */
  protected meta: NormalizedModuleMetadata;

  // Used only to check providers collisions
  protected importedProvidersPerMod: ServiceProvider[] = [];
  protected importedProvidersPerRou: ServiceProvider[] = [];
  protected importedProvidersPerReq: ServiceProvider[] = [];

  protected importedPerMod = new Map<any, ImportObj>();
  protected importedPerRou = new Map<any, ImportObj>();
  protected importedPerReq = new Map<any, ImportObj>();
  protected importedExtensions = new Map<any, ImportObj<ExtensionsProvider>>();

  protected globalProviders: ProvidersMetadata & ImportsMap;
  protected appMetadataMap = new Map<ModuleType | ModuleWithParams, MetadataPerMod1>();
  protected unfinishedScanModules = new Set<ModuleType | ModuleWithParams>();
  protected moduleManager: ModuleManager;

  exportGlobalProviders(moduleManager: ModuleManager, globalProviders: ProvidersMetadata & ImportsMap) {
    this.moduleManager = moduleManager;
    const meta = moduleManager.getMetadata('root', true);
    this.moduleName = meta.name;
    this.meta = meta;
    this.globalProviders = globalProviders;
    this.importProviders(meta);
    this.checkProvidersCollisions();

    return {
      providersPerMod: this.importedProvidersPerMod,
      providersPerRou: this.importedProvidersPerRou,
      providersPerReq: this.importedProvidersPerReq,
      importedPerMod: this.importedPerMod,
      importedPerRou: this.importedPerRou,
      importedPerReq: this.importedPerReq,
      importedExtensions: this.importedExtensions,
    };
  }

  /**
   * Bootstraps a module.
   *
   * @param modOrObj Module that will bootstrapped.
   */
  bootstrap(
    globalProviders: ProvidersMetadata & ImportsMap,
    prefixPerMod: string,
    modOrObj: ModuleType | ModuleWithParams,
    moduleManager: ModuleManager,
    unfinishedScanModules: Set<ModuleType | ModuleWithParams>,
    guardsPerMod?: NormalizedGuard[]
  ) {
    const meta = moduleManager.getMetadata(modOrObj, true);
    this.moduleManager = moduleManager;
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
        perMod: new Map([...this.globalProviders.importedPerMod, ...this.importedPerMod]),
        perRou: new Map([...this.globalProviders.importedPerRou, ...this.importedPerRou]),
        perReq: new Map([...this.globalProviders.importedPerReq, ...this.importedPerReq]),
        extensions: new Map([...this.globalProviders.importedExtensions, ...this.importedExtensions]),
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
    this.checkProvidersCollisions();
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
      const importObj = this.importedExtensions.get(token);
      if (importObj && importObj.module === module) {
        obj.providers = importObj.providers.slice();
      }
      obj.providers.push(provider);
      this.importedExtensions.set(token, obj);
    });
  }

  protected addProviders(
    scope: 'Mod' | 'Rou' | 'Req',
    module: ModuleType | ModuleWithParams,
    meta: NormalizedModuleMetadata
  ) {
    const exp = meta[`exportsProvidersPer${scope}`];
    if (exp.length) {
      exp.forEach((provider) => {
        const token = getToken(provider);
        const obj = new ImportObj();
        obj.module = module;
        const importObj = this[`importedPer${scope}`].get(token);
        if (importObj && importObj.module === module) {
          obj.providers = importObj.providers.slice();
        }
        obj.providers.push(provider);
        this[`importedPer${scope}`].set(token, obj);
      });
      this[`importedProvidersPer${scope}`].push(...exp);
    }
  }

  /**
   * This method should be called before call `this.mergeProviders()`.
   */
  protected checkProvidersCollisions() {
    const scopes: ('Req' | 'Rou' | 'Mod')[] = ['Req', 'Rou', 'Mod'];
    scopes.forEach((scope) => {
      const declaredTokens = getTokens(this.meta[`providersPer${scope}`]);
      const importedTokens = getTokens(this[`importedProvidersPer${scope}`]);
      const duplImpTokens = getDuplicates(importedTokens).filter((d) => !declaredTokens.includes(d));
      const collisions = getCollisions(duplImpTokens, this[`importedProvidersPer${scope}`]);
      if (collisions.length) {
        throwProvidersCollisionError(this.moduleName, collisions);
      }
    });

    const mixPerApp = getTokens(this.globalProviders.providersPerApp).filter((p) => {
      for (const scope of scopes) {
        const declaredTokens = getTokens(this.meta[`providersPer${scope}`]);
        const importedTokens = getTokens(this[`importedProvidersPer${scope}`]);
        const collision = importedTokens.includes(p) && !declaredTokens.includes(p);
        if (collision) {
          return true;
        }
      }
      return false;
    });

    const defaultTokensPerMod = getTokens(defaultProvidersPerMod);
    const tokensPerMod = [
      ...defaultTokensPerMod,
      ...getTokens(this.meta.providersPerMod),
      ...getTokens(this.importedProvidersPerRou),
    ];
    const mixPerMod = tokensPerMod.filter((p) => {
      if (getTokens(this.importedProvidersPerRou).includes(p) && !getTokens(this.meta.providersPerRou).includes(p)) {
        return true;
      }
      return getTokens(this.importedProvidersPerReq).includes(p) && !getTokens(this.meta.providersPerReq).includes(p);
    });

    const defaultTokensPerReq = getTokens([...defaultProvidersPerReq]);
    const tokensPerRou = [...getTokens(this.meta.providersPerRou), ...getTokens(this.importedProvidersPerRou)];
    const mergedTokens = [...defaultTokensPerReq, ...tokensPerRou, NODE_REQ, NODE_RES];
    const mixPerRou = mergedTokens.filter((p) => {
      return getTokens(this.importedProvidersPerReq).includes(p) && !getTokens(this.meta.providersPerReq).includes(p);
    });

    const collisions = [...mixPerApp, ...mixPerMod, ...mixPerRou];
    if (collisions.length) {
      throwProvidersCollisionError(this.moduleName, collisions);
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
