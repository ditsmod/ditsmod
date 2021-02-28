import { Provider, resolveForwardRef, Injectable, ReflectiveInjector, TypeProvider, reflector } from '@ts-stack/di';

import {
  ModuleMetadata,
  defaultProvidersPerReq,
  ModuleType,
  ModuleWithOptions,
  ProvidersMetadata,
} from './decorators/module';
import { flatten, normalizeProviders, NormalizedProvider } from './utils/ng-utils';
import { isRootModule, isImportWithOptions, isProvider, isController, isExtensionProvider } from './utils/type-guards';
import { NormalizedGuard } from './types/router';
import { NodeReqToken, NodeResToken } from './types/injection-tokens';
import { Core } from './core';
import { getDuplicates } from './utils/get-duplicates';
import { pickProperties } from './utils/pick-properties';
import { ExtensionMetadata } from './types/types';
import { GuardItem } from './decorators/route';
import { ControllerMetadata, MethodDecoratorObject } from './decorators/controller';
import { ImportWithOptions } from './types/import-with-options';
import { Counter } from './services/counter';
import { defaultExtensions } from './decorators/root-module';

/**
 * - creates `injectorPerMod` and `injectorPerReq`;
 * - settings routes.
 */
@Injectable()
export class ModuleFactory extends Core {
  protected moduleName: string;
  protected prefixPerMod: string;
  protected guardsPerMod: NormalizedGuard[];
  /**
   * Module metadata.
   */
  protected opts: ModuleMetadata;
  protected allExportedProvidersPerMod: Provider[] = [];
  protected allExportedProvidersPerReq: Provider[] = [];
  protected exportedProvidersPerMod: Provider[] = [];
  protected exportedProvidersPerReq: Provider[] = [];
  protected globalProviders: ProvidersMetadata;
  protected extensionMetadataMap = new Map<ModuleType, ExtensionMetadata>();

  constructor(protected injectorPerApp: ReflectiveInjector, protected counter: Counter) {
    super();
  }

  /**
   * Called only by `@RootModule` before called `ModuleFactory#boostrap()`.
   *
   * @param globalProviders Contains providersPerApp for now.
   */
  importGlobalProviders(rootModule: ModuleType, globalProviders: ProvidersMetadata) {
    this.moduleName = this.getModuleName(rootModule);
    const moduleMetadata = this.normalizeMetadata(rootModule);
    this.opts = new ModuleMetadata();
    pickProperties(this.opts, moduleMetadata);
    this.globalProviders = globalProviders;
    this.importProviders(true, rootModule);
    this.checkProvidersCollisions(true);

    return {
      providersPerMod: this.allExportedProvidersPerMod,
      providersPerReq: this.allExportedProvidersPerReq,
    };
  }

  /**
   * Bootstraps a module.
   *
   * @param modOrObject Module that will bootstrapped.
   */
  bootstrap(
    globalProviders: ProvidersMetadata,
    prefixPerMod: string,
    modOrObject: TypeProvider | ModuleWithOptions<any>,
    guardsPerMod?: NormalizedGuard[]
  ) {
    this.globalProviders = globalProviders;
    this.prefixPerMod = prefixPerMod || '';
    const mod = this.getModule(modOrObject);
    this.moduleName = mod.name;
    this.guardsPerMod = guardsPerMod || [];
    const moduleMetadata = this.normalizeMetadata(modOrObject);
    this.quickCheckMetadata(moduleMetadata);
    this.opts = new ModuleMetadata();
    Object.assign(this.opts, moduleMetadata);
    this.importModules();
    this.mergeProviders(moduleMetadata);

    const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(this.opts.providersPerMod);
    injectorPerMod.resolveAndInstantiate(mod); // Only check DI resolvable
    const controllersMetadata = this.getControllersMetadata();

    return this.extensionMetadataMap.set(mod, {
      prefixPerMod,
      guardsPerMod: this.guardsPerMod,
      moduleMetadata: this.opts,
      controllersMetadata,
    });
  }

  protected mergeProviders(moduleMetadata: ModuleMetadata) {
    const duplicatesProvidersPerMod = getDuplicates([
      ...this.globalProviders.providersPerMod,
      ...this.opts.providersPerMod,
    ]);
    const globalProvidersPerMod = isRootModule(moduleMetadata) ? [] : this.globalProviders.providersPerMod;
    this.opts.providersPerMod = [
      ...globalProvidersPerMod.filter((p) => !duplicatesProvidersPerMod.includes(p)),
      ...this.allExportedProvidersPerMod,
      ...this.opts.providersPerMod,
    ];

    const duplicatesProvidersPerReq = getDuplicates([
      ...this.globalProviders.providersPerReq,
      ...this.opts.providersPerReq,
    ]);
    const globalProvidersPerReq = isRootModule(moduleMetadata)
      ? defaultProvidersPerReq
      : this.globalProviders.providersPerReq;
    this.opts.providersPerReq = [
      ...globalProvidersPerReq.filter((p) => !duplicatesProvidersPerReq.includes(p)),
      ...this.allExportedProvidersPerReq,
      ...this.opts.providersPerReq,
    ];
  }

  protected quickCheckMetadata(moduleMetadata: ModuleMetadata) {
    if (
      !isRootModule(moduleMetadata as any) &&
      !moduleMetadata.providersPerApp.length &&
      !moduleMetadata.controllers.length &&
      !moduleMetadata.exports.length &&
      !moduleMetadata.extensions.length
    ) {
      const msg =
        `Importing ${this.moduleName} failed: this module should have "providersPerApp"` +
        ' or some controllers, or exports, or extensions.';
      throw new Error(msg);
    }

    const { providersPerApp, providersPerMod, providersPerReq } = moduleMetadata;
    const providers = [...providersPerApp, ...providersPerMod, ...defaultExtensions];
    const extensionsTokens = normalizeProviders(providers).map((np) => np.provide);
    const extensionsTokensPerReq = normalizeProviders(providersPerReq).map((np) => np.provide);
    moduleMetadata.extensions.forEach((Ext, i) => {
      if (!isExtensionProvider(Ext)) {
        const msg =
          `Importing ${this.moduleName} failed: Extensions with array index "${i}" ` +
          'must be a class with init() method.';
        throw new TypeError(msg);
      }
      if (extensionsTokensPerReq.includes(Ext)) {
        const msg = `Importing ${this.moduleName} failed: Extensions "${Ext.name}" cannot be includes in the "providersPerReq" array.`;
        throw new Error(msg);
      }
      if (!extensionsTokens.includes(Ext)) {
        const msg =
          `Importing ${this.moduleName} failed: Extensions "${Ext.name}" must be includes in ` +
          '"providersPerApp" or "providersPerMod" array.';
        throw new Error(msg);
      }
    });
  }

  /**
   * Collects and normalizes module metadata.
   */
  protected normalizeMetadata(mod: ModuleType | ModuleWithOptions<any>) {
    const modMetadata = this.getRawModuleMetadata(mod);
    const modName = this.getModuleName(mod);
    this.checkModuleMetadata(modMetadata, modName);

    /**
     * Setting initial properties of metadata.
     */
    const metadata = new ModuleMetadata();
    /**
     * `ngMetadataName` is used only internally and is hidden from the public API.
     */
    (metadata as any).ngMetadataName = (modMetadata as any).ngMetadataName;

    type FlattenedImports = TypeProvider | ModuleWithOptions<any> | ImportWithOptions;
    metadata.imports = flatten<FlattenedImports>(modMetadata.imports).map<ImportWithOptions>((imp) => {
      if (isImportWithOptions(imp)) {
        return {
          prefix: imp.prefix,
          module: resolveForwardRef(imp.module),
          guards: imp.guards || [],
        };
      }
      return {
        prefix: '',
        module: resolveForwardRef(imp),
        guards: [],
      };
    });
    metadata.exports = flatten(modMetadata.exports).map(resolveForwardRef);
    metadata.providersPerApp = flatten(modMetadata.providersPerApp);
    metadata.providersPerMod = flatten(modMetadata.providersPerMod);
    metadata.providersPerReq = flatten(modMetadata.providersPerReq);
    metadata.controllers = (modMetadata.controllers || []).slice();
    metadata.extensions = (modMetadata.extensions || []).slice();

    return metadata;
  }

  protected importModules() {
    for (const imp of this.opts.imports) {
      this.importProviders(true, imp.module);
      const prefixPerMod = [this.prefixPerMod, imp.prefix].filter((s) => s).join('/');
      const mod = imp.module;
      const normalizedGuardsPerMod = this.normalizeGuards(imp.guards);
      this.checkGuardsPerMod(normalizedGuardsPerMod);
      const guardsPerMod = [...this.guardsPerMod, ...normalizedGuardsPerMod];
      const moduleFactory = this.injectorPerApp.resolveAndInstantiate(ModuleFactory) as ModuleFactory;
      const extensionMetadataMap = moduleFactory.bootstrap(this.globalProviders, prefixPerMod, mod, guardsPerMod);
      this.extensionMetadataMap = new Map([...this.extensionMetadataMap, ...extensionMetadataMap]);
    }
    this.checkProvidersCollisions();
  }

  protected normalizeGuards(guards: GuardItem[]) {
    return guards.map((item) => {
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
   * @param modOrObject Module from where exports providers.
   */
  protected importProviders(isStarter: boolean, modOrObject: TypeProvider | ModuleWithOptions<any>) {
    const { exports: exp, providersPerMod, providersPerReq } = this.normalizeMetadata(modOrObject);
    const moduleName = this.getModuleName(modOrObject);

    for (const moduleOrProvider of exp) {
      const moduleMetadata = this.getRawModuleMetadata(moduleOrProvider as ModuleType);
      if (moduleMetadata) {
        const reexportedModuleOrObject = moduleOrProvider as ModuleType | ModuleWithOptions<any>;
        this.importProviders(false, reexportedModuleOrObject);
      } else {
        const provider = moduleOrProvider as Provider;
        const normProvider = normalizeProviders([provider])[0];
        const foundProvider = this.findAndSetProvider(provider, normProvider, providersPerMod, providersPerReq);
        if (!foundProvider) {
          const providerName = normProvider.provide.name || normProvider.provide;
          throw new Error(
            `Exported ${providerName} from ${moduleName} ` +
              'should includes in "providersPerMod" or "providersPerReq", ' +
              'or in some "exports" of imported modules. ' +
              'Tip: "providersPerApp" no need exports, they are automatically exported.'
          );
        }
      }
    }

    this.mergeWithAllExportedProviders(isStarter);
  }

  protected mergeWithAllExportedProviders(isStarter: boolean) {
    let perMod = this.exportedProvidersPerMod;
    let perReq = this.exportedProvidersPerReq;
    this.exportedProvidersPerMod = [];
    this.exportedProvidersPerReq = [];

    if (!isStarter) {
      /**
       * Removes duplicates of providers inside each child modules.
       */
      perMod = this.getUniqProviders(perMod);
      perReq = this.getUniqProviders(perReq);
    }

    this.allExportedProvidersPerMod.push(...perMod);
    this.allExportedProvidersPerReq.push(...perReq);
  }

  protected findAndSetProvider(
    provider: Provider,
    normProvider: NormalizedProvider,
    providersPerMod: Provider[],
    providersPerReq: Provider[]
  ) {
    if (hasProviderIn(providersPerMod)) {
      this.exportedProvidersPerMod.push(provider);
      return true;
    } else if (hasProviderIn(providersPerReq)) {
      this.exportedProvidersPerReq.push(provider);
      return true;
    }

    return false;

    function hasProviderIn(providers: Provider[]) {
      const normProviders = normalizeProviders(providers);
      return normProviders.some((p) => p.provide === normProvider.provide);
    }
  }

  /**
   * This method should called before call `this.mergeProviders()`.
   *
   * @param isGlobal Indicates that need find collision for global providers.
   */
  protected checkProvidersCollisions(isGlobal?: boolean) {
    const tokensPerApp = normalizeProviders(this.globalProviders.providersPerApp).map((np) => np.provide);

    const declaredTokensPerMod = normalizeProviders(this.opts.providersPerMod).map((np) => np.provide);
    const exportedNormProvidersPerMod = normalizeProviders(this.allExportedProvidersPerMod);
    const exportedTokensPerMod = exportedNormProvidersPerMod.map((np) => np.provide);
    const multiTokensPerMod = exportedNormProvidersPerMod.filter((np) => np.multi).map((np) => np.provide);
    let duplExpTokensPerMod = getDuplicates(exportedTokensPerMod).filter((d) => !multiTokensPerMod.includes(d));
    if (isGlobal) {
      const rootExports = this.opts.exports.filter(isProvider);
      const rootTokens = normalizeProviders(rootExports).map((np) => np.provide);
      duplExpTokensPerMod = duplExpTokensPerMod.filter((d) => !rootTokens.includes(d));
    } else {
      duplExpTokensPerMod = duplExpTokensPerMod.filter((d) => !declaredTokensPerMod.includes(d));
    }
    duplExpTokensPerMod = this.getTokensCollisions(duplExpTokensPerMod, this.allExportedProvidersPerMod);
    const tokensPerMod = [...declaredTokensPerMod, ...exportedTokensPerMod];

    const declaredTokensPerReq = normalizeProviders(this.opts.providersPerReq).map((np) => np.provide);
    const exportedNormalizedPerReq = normalizeProviders(this.allExportedProvidersPerReq);
    const exportedTokensPerReq = exportedNormalizedPerReq.map((np) => np.provide);
    const multiTokensPerReq = exportedNormalizedPerReq.filter((np) => np.multi).map((np) => np.provide);
    let duplExpPerReq = getDuplicates(exportedTokensPerReq).filter((d) => !multiTokensPerReq.includes(d));
    if (isGlobal) {
      const rootExports = this.opts.exports.filter(isProvider);
      const rootTokens = normalizeProviders(rootExports).map((np) => np.provide);
      duplExpPerReq = duplExpPerReq.filter((d) => !rootTokens.includes(d));
    } else {
      duplExpPerReq = duplExpPerReq.filter((d) => !declaredTokensPerReq.includes(d));
    }
    duplExpPerReq = this.getTokensCollisions(duplExpPerReq, this.allExportedProvidersPerReq);

    const mixPerApp = tokensPerApp.filter((p) => {
      if (exportedTokensPerMod.includes(p) && !declaredTokensPerMod.includes(p)) {
        return true;
      }
      return exportedTokensPerReq.includes(p) && !declaredTokensPerReq.includes(p);
    });

    const defaultTokens = normalizeProviders([...defaultProvidersPerReq]).map((np) => np.provide);
    const mergedTokens = [...defaultTokens, ...tokensPerMod, NodeReqToken, NodeResToken];
    const mixPerModOrReq = mergedTokens.filter((p) => {
      return exportedTokensPerReq.includes(p) && !declaredTokensPerReq.includes(p);
    });

    const collisions = [...duplExpTokensPerMod, ...duplExpPerReq, ...mixPerApp, ...mixPerModOrReq];
    if (collisions.length) {
      this.throwProvidersCollisionError(this.moduleName, collisions);
    }
  }

  protected getControllersMetadata() {
    const arrControllerMetadata: ControllerMetadata[] = [];
    for (const controller of this.opts.controllers) {
      const ctrlDecorValues = reflector.annotations(controller);
      if (!ctrlDecorValues.find(isController)) {
        throw new Error(
          `Collecting controller's metadata failed: class "${controller.name}" does not have the "@Controller()" decorator`
        );
      }
      const controllerMetadata: ControllerMetadata = { controller, ctrlDecorValues, methods: {} };
      const propMetadata = reflector.propMetadata(controller);
      for (const methodName in propMetadata) {
        const methodDecorValues = propMetadata[methodName];
        const methodId = this.counter.incrementCtrlMethodId();
        controllerMetadata.methods[methodName] = methodDecorValues.map<MethodDecoratorObject>((decoratorValue) => {
          const decoratorId = this.counter.incrementCtrlDecoratorId();
          return { methodId, decoratorId, value: decoratorValue };
        });
      }
      arrControllerMetadata.push(controllerMetadata);
    }

    return arrControllerMetadata;
  }
}
