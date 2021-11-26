import { Injectable, ReflectiveInjector, reflector } from '@ts-stack/di';

import { NormalizedModuleMetadata } from './models/normalized-module-metadata';
import { ProvidersMetadata } from './models/providers-metadata';
import { defaultProvidersPerReq } from './services/default-providers-per-req';
import { ModuleManager } from './services/module-manager';
import { ControllerAndMethodMetadata } from './types/controller-and-method-metadata';
import { MetadataPerMod1, ImportsMap, ImportObj } from './types/metadata-per-mod';
import {
  GuardItem,
  DecoratorMetadata,
  ModuleType,
  ModuleWithParams,
  NormalizedGuard,
  ServiceProvider,
  ExtensionsProvider,
} from './types/mix';
import { getDuplicates } from './utils/get-duplicates';
import { getTokensCollisions } from './utils/get-tokens-collisions';
import { normalizeProviders } from './utils/ng-utils';
import { throwProvidersCollisionError } from './utils/throw-providers-collision-error';
import { isController, isNormalizedProvider, isRootModule } from './utils/type-guards';
import { deepFreeze } from './utils/deep-freeze';
import { defaultProvidersPerMod, HTTP_INTERCEPTORS, NODE_REQ, NODE_RES } from './constans';
import { ModConfig } from './models/mod-config';
import { getToken } from './utils/get-tokens';

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
  #moduleManager: ModuleManager;

  constructor(private injectorPerApp: ReflectiveInjector) {}

  /**
   * Calls only by `@RootModule` before calls `ModuleFactory#boostrap()`.
   *
   * @param globalProviders Contains providersPerApp for now.
   */
  exportGlobalProviders(moduleManager: ModuleManager, globalProviders: ProvidersMetadata & ImportsMap) {
    this.#moduleManager = moduleManager;
    const meta = moduleManager.getMetadata('root', true);
    this.moduleName = meta.name;
    this.meta = meta;
    this.globalProviders = globalProviders;
    this.importProviders(meta);
    this.checkProvidersCollisions(true);

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
    guardsPerMod?: NormalizedGuard[],
  ) {
    const meta = moduleManager.getMetadata(modOrObj, true);
    this.#moduleManager = moduleManager;
    this.globalProviders = globalProviders;
    this.prefixPerMod = prefixPerMod || '';
    this.moduleName = meta.name;
    this.guardsPerMod = guardsPerMod || [];
    this.unfinishedScanModules = unfinishedScanModules;
    this.quickCheckMetadata(meta);
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

  protected quickCheckMetadata(meta: NormalizedModuleMetadata) {
    if (
      !isRootModule(meta as any) &&
      !meta.providersPerApp.length &&
      !meta.controllers.length &&
      !meta.exportsProvidersPerMod.length &&
      !meta.exportsProvidersPerRou.length &&
      !meta.exportsProvidersPerReq.length &&
      !meta.exportsModules.length &&
      !meta.exportsWithParams.length &&
      !meta.extensions.length
    ) {
      const msg =
        `Importing ${this.moduleName} failed: this module should have "providersPerApp"` +
        ' or some controllers, or exports, or extensions.';
      throw new Error(msg);
    }

    this.checkHttpInterceptors(meta);
  }

  protected checkHttpInterceptors(meta: NormalizedModuleMetadata) {
    const normProviders = [...meta.providersPerApp, ...meta.providersPerMod, ...meta.providersPerRou].filter(
      isNormalizedProvider
    );
    if (normProviders.find((np) => np.provide === HTTP_INTERCEPTORS)) {
      const msg = `Importing ${this.moduleName} failed: "HTTP_INTERCEPTORS" can be includes in the "providersPerReq" array only.`;
      throw new Error(msg);
    }
  }

  protected importModules() {
    for (const imp of this.meta.importsModules) {
      const meta = this.#moduleManager.getMetadata(imp, true);
      this.importProviders(meta);
      const moduleFactory = this.injectorPerApp.resolveAndInstantiate(ModuleFactory) as ModuleFactory;

      if (this.unfinishedScanModules.has(imp)) {
        continue;
      }
      this.unfinishedScanModules.add(imp);
      const appMetadataMap = moduleFactory.bootstrap(
        this.globalProviders,
        this.prefixPerMod,
        imp,
        this.#moduleManager,
        this.unfinishedScanModules,
        this.guardsPerMod
      );
      this.unfinishedScanModules.delete(imp);

      this.appMetadataMap = new Map([...this.appMetadataMap, ...appMetadataMap]);
    }
    for (const imp of this.meta.importsWithParams) {
      const meta = this.#moduleManager.getMetadata(imp, true);
      this.importProviders(meta);
      const prefixPerMod = [this.prefixPerMod, imp.prefix].filter((s) => s).join('/');
      const normalizedGuardsPerMod = this.normalizeGuards(imp.guards);
      this.checkGuardsPerMod(normalizedGuardsPerMod);
      const guardsPerMod = [...this.guardsPerMod, ...normalizedGuardsPerMod];
      const moduleFactory = this.injectorPerApp.resolveAndInstantiate(ModuleFactory) as ModuleFactory;

      if (this.unfinishedScanModules.has(imp)) {
        continue;
      }
      this.unfinishedScanModules.add(imp);
      const appMetadataMap = moduleFactory.bootstrap(
        this.globalProviders,
        prefixPerMod,
        imp,
        this.#moduleManager,
        this.unfinishedScanModules,
        guardsPerMod
      );
      this.unfinishedScanModules.delete(imp);

      this.appMetadataMap = new Map([...this.appMetadataMap, ...appMetadataMap]);
    }
    this.checkProvidersCollisions();
  }

  protected normalizeGuards(guards?: GuardItem[]) {
    return (guards || []).map((item) => {
      if (Array.isArray(item)) {
        return { guard: item[0], params: item.slice(1) } as NormalizedGuard;
      } else {
        return { guard: item } as NormalizedGuard;
      }
    });
  }

  protected checkGuardsPerMod(guards: NormalizedGuard[]) {
    for (const Guard of guards.map((n) => n.guard)) {
      const type = typeof Guard?.prototype.canActivate;
      if (type != 'function') {
        throw new TypeError(
          `Import ${this.moduleName} with guards failed: Guard.prototype.canActivate must be a function, got: ${type}`
        );
      }
    }
  }

  /**
   * Recursively imports providers.
   *
   * @param meta1 Module metadata from where imports providers.
   */
  protected importProviders(meta1: NormalizedModuleMetadata) {
    const { module, exportsModules, exportsWithParams } = meta1;

    for (const mod of [...exportsModules, ...exportsWithParams]) {
      const meta2 = this.#moduleManager.getMetadata(mod, true);
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
   *
   * @param isGlobal Indicates that need find collision for global providers.
   */
  protected checkProvidersCollisions(isGlobal?: boolean) {
    const tokensPerApp = normalizeProviders(this.globalProviders.providersPerApp).map((np) => np.provide);

    const declaredTokensPerMod = normalizeProviders(this.meta.providersPerMod).map((np) => np.provide);
    const importedNormProvidersPerMod = normalizeProviders(this.importedProvidersPerMod);
    const importedTokensPerMod = importedNormProvidersPerMod.map((np) => np.provide);
    const multiTokensPerMod = importedNormProvidersPerMod.filter((np) => np.multi).map((np) => np.provide);
    let duplExpTokensPerMod = getDuplicates(importedTokensPerMod).filter((d) => !multiTokensPerMod.includes(d));
    if (isGlobal) {
      const rootImports = [
        ...this.meta.exportsProvidersPerMod,
        ...this.meta.exportsProvidersPerRou,
        ...this.meta.exportsProvidersPerReq,
      ];
      const rootTokens = normalizeProviders(rootImports).map((np) => np.provide);
      duplExpTokensPerMod = duplExpTokensPerMod.filter((d) => !rootTokens.includes(d));
    } else {
      duplExpTokensPerMod = duplExpTokensPerMod.filter((d) => !declaredTokensPerMod.includes(d));
    }
    duplExpTokensPerMod = getTokensCollisions(duplExpTokensPerMod, this.importedProvidersPerMod);
    const defaultTokensPerMod = normalizeProviders([...defaultProvidersPerMod]).map((np) => np.provide);
    const tokensPerMod = [...defaultTokensPerMod, ...declaredTokensPerMod, ...importedTokensPerMod];

    const declaredTokensPerRou = normalizeProviders(this.meta.providersPerRou).map((np) => np.provide);
    const importedNormalizedPerRou = normalizeProviders(this.importedProvidersPerRou);
    const importedTokensPerRou = importedNormalizedPerRou.map((np) => np.provide);
    const multiTokensPerRou = importedNormalizedPerRou.filter((np) => np.multi).map((np) => np.provide);
    let duplExpPerRou = getDuplicates(importedTokensPerRou).filter((d) => !multiTokensPerRou.includes(d));
    if (isGlobal) {
      const rootImports = [
        ...this.meta.exportsProvidersPerMod,
        ...this.meta.exportsProvidersPerRou,
        ...this.meta.exportsProvidersPerReq,
      ];
      const rootTokens = normalizeProviders(rootImports).map((np) => np.provide);
      duplExpPerRou = duplExpPerRou.filter((d) => !rootTokens.includes(d));
    } else {
      duplExpPerRou = duplExpPerRou.filter((d) => !declaredTokensPerRou.includes(d));
    }
    duplExpPerRou = getTokensCollisions(duplExpPerRou, this.importedProvidersPerRou);
    const tokensPerRou = [...declaredTokensPerRou, ...importedTokensPerRou];

    const declaredTokensPerReq = normalizeProviders(this.meta.providersPerReq).map((np) => np.provide);
    const importedNormalizedPerReq = normalizeProviders(this.importedProvidersPerReq);
    const importedTokensPerReq = importedNormalizedPerReq.map((np) => np.provide);
    const multiTokensPerReq = importedNormalizedPerReq.filter((np) => np.multi).map((np) => np.provide);
    let duplExpPerReq = getDuplicates(importedTokensPerReq).filter((d) => !multiTokensPerReq.includes(d));
    if (isGlobal) {
      const rootImports = [
        ...this.meta.exportsProvidersPerMod,
        ...this.meta.exportsProvidersPerRou,
        ...this.meta.exportsProvidersPerReq,
      ];
      const rootTokens = normalizeProviders(rootImports).map((np) => np.provide);
      duplExpPerReq = duplExpPerReq.filter((d) => !rootTokens.includes(d));
    } else {
      duplExpPerReq = duplExpPerReq.filter((d) => !declaredTokensPerReq.includes(d));
    }
    duplExpPerReq = getTokensCollisions(duplExpPerReq, this.importedProvidersPerReq);

    const mixPerApp = tokensPerApp.filter((p) => {
      if (importedTokensPerMod.includes(p) && !declaredTokensPerMod.includes(p)) {
        return true;
      }
      if (importedTokensPerRou.includes(p) && !declaredTokensPerRou.includes(p)) {
        return true;
      }
      return importedTokensPerReq.includes(p) && !declaredTokensPerReq.includes(p);
    });

    const mixPerMod = tokensPerMod.filter((p) => {
      if (importedTokensPerRou.includes(p) && !declaredTokensPerRou.includes(p)) {
        return true;
      }
      return importedTokensPerReq.includes(p) && !declaredTokensPerReq.includes(p);
    });

    const defaultTokensPerReq = normalizeProviders([...defaultProvidersPerReq]).map((np) => np.provide);
    const mergedTokens = [...defaultTokensPerReq, ...tokensPerRou, NODE_REQ, NODE_RES];
    const mixPerRou = mergedTokens.filter((p) => {
      return importedTokensPerReq.includes(p) && !declaredTokensPerReq.includes(p);
    });

    const collisions = [
      ...duplExpTokensPerMod,
      ...duplExpPerRou,
      ...duplExpPerReq,
      ...mixPerApp,
      ...mixPerMod,
      ...mixPerRou,
    ];
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
