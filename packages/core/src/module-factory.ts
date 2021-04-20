import { Injectable, InjectionToken, ReflectiveInjector, reflector } from '@ts-stack/di';

import { NormalizedModuleMetadata } from './models/normalized-module-metadata';
import { ProvidersMetadata } from './models/providers-metadata';
import { defaultProvidersPerReq } from './services/default-providers-per-req';
import { ModuleManager } from './services/module-manager';
import { ControllerAndMethodMetadata } from './types/controller-and-method-metadata';
import { MetadataPerMod } from './types/metadata-per-mod';
import {
  GuardItem,
  DecoratorMetadata,
  ModuleType,
  ModuleWithParams,
  NormalizedGuard,
  ServiceProvider,
  Extension
} from './types/mix';
import { getDuplicates } from './utils/get-duplicates';
import { getTokensCollisions } from './utils/get-tokens-collisions';
import { getUniqProviders } from './utils/get-uniq-providers';
import { NormalizedProvider, normalizeProviders } from './utils/ng-utils';
import { throwProvidersCollisionError } from './utils/throw-providers-collision-error';
import {
  isClassProvider,
  isController,
  isExtensionProvider,
  isInjectionToken,
  isRootModule,
} from './utils/type-guards';
import { deepFreeze } from './utils/deep-freeze';
import { defaultProvidersPerMod, NODE_REQ, NODE_RES } from './constans';
import { ModConfig } from './models/mod-config';
import { Log } from './services/log';

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
  protected allImportedProvidersPerMod: ServiceProvider[] = [];
  protected allImportedProvidersPerRou: ServiceProvider[] = [];
  protected allImportedProvidersPerReq: ServiceProvider[] = [];
  protected importedProvidersPerMod: ServiceProvider[] = [];
  protected importedProvidersPerRou: ServiceProvider[] = [];
  protected importedProvidersPerReq: ServiceProvider[] = [];
  protected globalProviders: ProvidersMetadata;
  protected appMetadataMap = new Map<ModuleType | ModuleWithParams, MetadataPerMod>();
  #moduleManager: ModuleManager;

  constructor(private injectorPerApp: ReflectiveInjector, private log: Log) {}

  /**
   * Calls only by `@RootModule` before calls `ModuleFactory#boostrap()`.
   *
   * @param globalProviders Contains providersPerApp for now.
   */
  exportGlobalProviders(moduleManager: ModuleManager, globalProviders: ProvidersMetadata) {
    this.#moduleManager = moduleManager;
    const meta = moduleManager.getMetadata('root', true);
    this.moduleName = meta.name;
    this.meta = meta;
    this.globalProviders = globalProviders;
    this.importProviders(meta, true);
    this.checkProvidersCollisions(true);

    return {
      providersPerMod: this.allImportedProvidersPerMod,
      providersPerRou: this.allImportedProvidersPerRou,
      providersPerReq: this.allImportedProvidersPerReq,
    };
  }

  /**
   * Bootstraps a module.
   *
   * @param modOrObj Module that will bootstrapped.
   */
  bootstrap(
    globalProviders: ProvidersMetadata,
    prefixPerMod: string,
    modOrObj: ModuleType | ModuleWithParams,
    moduleManager: ModuleManager,
    guardsPerMod?: NormalizedGuard[]
  ) {
    const meta = moduleManager.getMetadata(modOrObj, true);
    this.#moduleManager = moduleManager;
    this.globalProviders = globalProviders;
    this.prefixPerMod = prefixPerMod || '';
    this.moduleName = meta.name;
    this.guardsPerMod = guardsPerMod || [];
    this.quickCheckMetadata(meta);
    this.meta = meta;
    this.importModules();
    this.mergeProviders();
    const controllersMetadata = this.getControllersMetadata();

    return this.appMetadataMap.set(modOrObj, {
      prefixPerMod,
      guardsPerMod: this.guardsPerMod,
      moduleMetadata: this.meta,
      controllersMetadata: deepFreeze(controllersMetadata),
    });
  }

  protected mergeProviders() {
    this.meta.providersPerMod = getUniqProviders([
      ...defaultProvidersPerMod,
      { provide: ModConfig, useValue: { prefixPerMod: this.prefixPerMod } },
      ...this.globalProviders.providersPerMod,
      ...this.allImportedProvidersPerMod,
      ...this.meta.providersPerMod,
    ]);

    this.meta.providersPerRou = getUniqProviders([
      ...this.globalProviders.providersPerRou,
      ...this.allImportedProvidersPerRou,
      ...this.meta.providersPerRou,
    ]);

    this.meta.providersPerReq = getUniqProviders([
      ...defaultProvidersPerReq,
      ...this.globalProviders.providersPerReq,
      ...this.allImportedProvidersPerReq,
      ...this.meta.providersPerReq,
    ]);
  }

  protected quickCheckMetadata(meta: NormalizedModuleMetadata) {
    if (
      !isRootModule(meta as any) &&
      !meta.providersPerApp.length &&
      !meta.controllers.length &&
      !meta.exportsProviders.length &&
      !meta.exportsModules.length &&
      !meta.exportsWithParams.length &&
      !meta.extensions.length
    ) {
      const msg =
        `Importing ${this.moduleName} failed: this module should have "providersPerApp"` +
        ' or some controllers, or exports, or extensions.';
      throw new Error(msg);
    }

    const { providersPerApp, providersPerMod, providersPerRou, providersPerReq } = meta;
    const normalizedProvidersPerApp = normalizeProviders(providersPerApp);
    this.checkExtensionsRegistration(this.moduleName, providersPerApp, meta.extensions);
    meta.extensions.forEach((token, i) => {
      const provider = normalizedProvidersPerApp.find((np) => np.provide === token);
      if (!provider) {
        const msg = `Importing ${this.moduleName} failed: "${token}" must be includes in "providersPerApp" array.`;
        throw new Error(msg);
      }
      if (
        !provider.multi ||
        !isInjectionToken(token) ||
        !isClassProvider(provider) ||
        !isExtensionProvider(provider.useClass)
      ) {
        const msg =
          `Importing ${this.moduleName} failed: Extensions with array index "${i}" ` +
          'must be a value provider where "useClass: Class" must have init() method and "multi: true".';
        throw new TypeError(msg);
      }
      const normProviders = normalizeProviders([...providersPerMod, ...providersPerRou, ...providersPerReq]).map(
        (np) => np.provide
      );
      if (normProviders.includes(token)) {
        const msg = `Importing ${this.moduleName} failed: "${token}" can be includes in the "providersPerApp" array only.`;
        throw new Error(msg);
      }
    });
  }

  protected checkExtensionsRegistration(
    moduleName: string,
    providersPerApp: ServiceProvider[],
    extensions: InjectionToken<Extension<any>[]>[]
  ) {
    const extensionsProviders = providersPerApp
      .filter(isClassProvider)
      .filter(
        (p) =>
          p.multi &&
          isExtensionProvider(p.useClass) &&
          isInjectionToken(p.provide) &&
          p.provide.toString().toLowerCase().includes('extension')
      );

    getUniqProviders(extensionsProviders).forEach((p) => {
      if (!extensions.includes(p.provide)) {
        this.log.youForgotRegisterExtension('warn', [moduleName, p.provide, p.useClass.name]);
      }
    });
  }

  protected importModules() {
    for (const imp of this.meta.importsModules) {
      const meta = this.#moduleManager.getMetadata(imp, true);
      this.importProviders(meta, true);
      const moduleFactory = this.injectorPerApp.resolveAndInstantiate(ModuleFactory) as ModuleFactory;
      const appMetadataMap = moduleFactory.bootstrap(
        this.globalProviders,
        this.prefixPerMod,
        imp,
        this.#moduleManager,
        this.guardsPerMod
      );
      this.appMetadataMap = new Map([...this.appMetadataMap, ...appMetadataMap]);
    }
    for (const imp of this.meta.importsWithParams) {
      const meta = this.#moduleManager.getMetadata(imp, true);
      this.importProviders(meta, true);
      const prefixPerMod = [this.prefixPerMod, imp.prefix].filter((s) => s).join('/');
      const normalizedGuardsPerMod = this.normalizeGuards(imp.guards);
      this.checkGuardsPerMod(normalizedGuardsPerMod);
      const guardsPerMod = [...this.guardsPerMod, ...normalizedGuardsPerMod];
      const moduleFactory = this.injectorPerApp.resolveAndInstantiate(ModuleFactory) as ModuleFactory;
      const appMetadataMap = moduleFactory.bootstrap(
        this.globalProviders,
        prefixPerMod,
        imp,
        this.#moduleManager,
        guardsPerMod
      );
      this.appMetadataMap = new Map([...this.appMetadataMap, ...appMetadataMap]);
    }
    this.checkProvidersCollisions();
  }

  protected normalizeGuards(guards: GuardItem[]) {
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
   * @param metadata Module metadata from where imports providers.
   */
  protected importProviders(metadata: NormalizedModuleMetadata, isStarter?: boolean) {
    const {
      exportsModules,
      exportsWithParams,
      exportsProviders,
      providersPerMod,
      providersPerRou,
      providersPerReq,
    } = metadata;

    for (const mod of [...exportsModules, ...exportsWithParams]) {
      const meta = this.#moduleManager.getMetadata(mod, true);
      // Reexported module
      this.importProviders(meta);
    }

    for (const provider of exportsProviders) {
      const normProvider = normalizeProviders([provider])[0];
      const foundProvider = this.findAndSetProvider(
        provider,
        normProvider,
        providersPerMod,
        providersPerRou,
        providersPerReq
      );
      if (!foundProvider) {
        const providerName = normProvider.provide.name || normProvider.provide;
        throw new Error(
          `Importing ${providerName} from ${metadata.name} ` +
            'should includes in "providersPerMod" or "providersPerRou", or "providersPerReq", ' +
            'or in some "exports" of imported modules. ' +
            'Tip: "providersPerApp" no need exports, they are automatically exported.'
        );
      }
    }

    this.mergeWithAllImportedProviders(isStarter);
  }

  protected mergeWithAllImportedProviders(isStarter: boolean) {
    let perMod = this.importedProvidersPerMod;
    let perRou = this.importedProvidersPerRou;
    let perReq = this.importedProvidersPerReq;
    this.importedProvidersPerMod = [];
    this.importedProvidersPerRou = [];
    this.importedProvidersPerReq = [];

    if (!isStarter) {
      /**
       * Removes duplicates of providers inside each child modules.
       */
      perMod = getUniqProviders(perMod);
      perRou = getUniqProviders(perRou);
      perReq = getUniqProviders(perReq);
    }

    this.allImportedProvidersPerMod.push(...perMod);
    this.allImportedProvidersPerRou.push(...perRou);
    this.allImportedProvidersPerReq.push(...perReq);
  }

  protected findAndSetProvider(
    provider: ServiceProvider,
    normProvider: NormalizedProvider,
    providersPerMod: ServiceProvider[],
    providersPerRou: ServiceProvider[],
    providersPerReq: ServiceProvider[]
  ) {
    if (hasProviderIn(providersPerMod)) {
      this.importedProvidersPerMod.push(provider);
      return true;
    } else if (hasProviderIn(providersPerRou)) {
      this.importedProvidersPerRou.push(provider);
      return true;
    } else if (hasProviderIn(providersPerReq)) {
      this.importedProvidersPerReq.push(provider);
      return true;
    }

    return false;

    function hasProviderIn(providers: ServiceProvider[]) {
      const normProviders = normalizeProviders(providers);
      return normProviders.some((p) => p.provide === normProvider.provide);
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
    const importedNormProvidersPerMod = normalizeProviders(this.allImportedProvidersPerMod);
    const importedTokensPerMod = importedNormProvidersPerMod.map((np) => np.provide);
    const multiTokensPerMod = importedNormProvidersPerMod.filter((np) => np.multi).map((np) => np.provide);
    let duplExpTokensPerMod = getDuplicates(importedTokensPerMod).filter((d) => !multiTokensPerMod.includes(d));
    if (isGlobal) {
      const rootImports = this.meta.exportsProviders;
      const rootTokens = normalizeProviders(rootImports).map((np) => np.provide);
      duplExpTokensPerMod = duplExpTokensPerMod.filter((d) => !rootTokens.includes(d));
    } else {
      duplExpTokensPerMod = duplExpTokensPerMod.filter((d) => !declaredTokensPerMod.includes(d));
    }
    duplExpTokensPerMod = getTokensCollisions(duplExpTokensPerMod, this.allImportedProvidersPerMod);
    const defaultTokensPerMod = normalizeProviders([...defaultProvidersPerMod]).map((np) => np.provide);
    const tokensPerMod = [...defaultTokensPerMod, ...declaredTokensPerMod, ...importedTokensPerMod];

    const declaredTokensPerRou = normalizeProviders(this.meta.providersPerRou).map((np) => np.provide);
    const importedNormalizedPerRou = normalizeProviders(this.allImportedProvidersPerRou);
    const importedTokensPerRou = importedNormalizedPerRou.map((np) => np.provide);
    const multiTokensPerRou = importedNormalizedPerRou.filter((np) => np.multi).map((np) => np.provide);
    let duplExpPerRou = getDuplicates(importedTokensPerRou).filter((d) => !multiTokensPerRou.includes(d));
    if (isGlobal) {
      const rootImports = this.meta.exportsProviders;
      const rootTokens = normalizeProviders(rootImports).map((np) => np.provide);
      duplExpPerRou = duplExpPerRou.filter((d) => !rootTokens.includes(d));
    } else {
      duplExpPerRou = duplExpPerRou.filter((d) => !declaredTokensPerRou.includes(d));
    }
    duplExpPerRou = getTokensCollisions(duplExpPerRou, this.allImportedProvidersPerRou);
    const tokensPerRou = [...declaredTokensPerRou, ...importedTokensPerRou];

    const declaredTokensPerReq = normalizeProviders(this.meta.providersPerReq).map((np) => np.provide);
    const importedNormalizedPerReq = normalizeProviders(this.allImportedProvidersPerReq);
    const importedTokensPerReq = importedNormalizedPerReq.map((np) => np.provide);
    const multiTokensPerReq = importedNormalizedPerReq.filter((np) => np.multi).map((np) => np.provide);
    let duplExpPerReq = getDuplicates(importedTokensPerReq).filter((d) => !multiTokensPerReq.includes(d));
    if (isGlobal) {
      const rootImports = this.meta.exportsProviders;
      const rootTokens = normalizeProviders(rootImports).map((np) => np.provide);
      duplExpPerReq = duplExpPerReq.filter((d) => !rootTokens.includes(d));
    } else {
      duplExpPerReq = duplExpPerReq.filter((d) => !declaredTokensPerReq.includes(d));
    }
    duplExpPerReq = getTokensCollisions(duplExpPerReq, this.allImportedProvidersPerReq);

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
