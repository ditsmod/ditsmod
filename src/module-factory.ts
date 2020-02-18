import {
  reflector,
  TypeProvider,
  Provider,
  Type,
  resolveForwardRef,
  Injectable,
  ResolvedReflectiveProvider,
  ReflectiveInjector
} from 'ts-di';
import assert = require('assert-plus');

import {
  ModuleMetadata,
  defaultProvidersPerReq,
  ModuleType,
  ModuleWithOptions,
  ModuleDecorator
} from './decorators/module';
import { ControllerDecorator } from './decorators/controller';
import { RouteDecoratorMetadata } from './decorators/route';
import { BodyParserConfig } from './types/types';
import { flatten, normalizeProviders, NormalizedProvider } from './utils/ng-utils';
import { isRootModule, isController, isRoute, isModule, isModuleWithOptions } from './utils/type-guards';
import { mergeArrays } from './utils/merge-arrays-options';
import { Router, RouteConfig } from './types/router';
import { NodeReqToken, NodeResToken } from './types/injection-tokens';
import { defaultProvidersPerApp } from './decorators/root-module';
import { Logger } from './types/logger';
import { getStackTrace } from './utils/get-stack-trace';

/**
 * - creates `injectorPerMod` and `injectorPerReq`;
 * - settings routes.
 */
@Injectable()
export class ModuleFactory {
  protected static singletons: any[] = [];
  protected moduleName: string;
  protected routesPrefixPerApp: string;
  protected routesPrefixPerMod: string;
  protected resolvedProvidersPerReq: ResolvedReflectiveProvider[];

  /**
   * Setting default module metadata.
   */
  protected opts = new ModuleMetadata();
  /**
   * Injector per the module.
   */
  protected injectorPerMod: ReflectiveInjector;

  constructor(protected router: Router, protected injectorPerApp: ReflectiveInjector, protected log: Logger) {}

  /**
   * Bootstraps a module.
   *
   * @param typeOrObject Module that will bootstrapped.
   * @param importer It's module that imported current module.
   */
  bootstrap(
    routesPrefixPerApp: string,
    routesPrefixPerMod: string,
    typeOrObject: Type<any> | ModuleWithOptions<any>,
    importer?: this
  ) {
    const moduleMetadata = this.mergeMetadata(typeOrObject);
    Object.assign(this.opts, moduleMetadata);
    /**
     * If we exported providers from current module,
     * this only make sense for the module that will import current module.
     *
     * Here "importer" it's module that imported current module,
     * so we should call `exportProvidersToImporter()` method in its context.
     */
    if (importer) {
      this.exportProvidersToImporter.call(importer, typeOrObject);
    }
    this.importModules();
    const mod = this.getModule(typeOrObject);
    this.moduleName = mod.name;
    this.injectorPerMod = this.injectorPerApp.resolveAndCreateChild(this.opts.providersPerMod);
    const instanceMod = this.injectorPerMod.get(mod, null);
    if (instanceMod) {
      this.registerSingleton(mod);
    } else {
      this.injectorPerMod.resolveAndInstantiate(mod);
    }
    this.routesPrefixPerApp = routesPrefixPerApp || '';
    this.routesPrefixPerMod = routesPrefixPerMod || '';
    this.initProvidersPerReq();
    this.quickCheckImports(moduleMetadata);
    this.checkRoutePath(this.routesPrefixPerApp);
    this.checkRoutePath(this.routesPrefixPerMod);
    const prefix = [this.routesPrefixPerApp, this.routesPrefixPerMod].filter(s => s).join('/');
    this.opts.controllers.forEach(Ctrl => this.setRoutes(prefix, Ctrl));
    this.loadRoutesConfig(prefix, this.opts.routesPerMod);
  }

  protected registerSingleton(mod: Type<any>) {
    const staticThis = this.constructor as typeof ModuleFactory;
    if (!staticThis.singletons.includes(mod)) {
      this.log.debug(`Module ${mod.name} created as singleton on the Application level`);
      this.log.trace(getStackTrace());
      staticThis.singletons.push(mod);
    }
  }

  protected loadRoutesConfig(prefix: string, configs: RouteConfig[]) {
    for (const config of configs) {
      const childPrefix = [prefix, config.path].filter(s => s).join('/');
      if (config.controller) {
        this.setRoutes(childPrefix, config.controller, config.routeData);
      }
      this.loadRoutesConfig(childPrefix, config.children || []);
    }
  }
  protected getModule(mod: Type<any> | ModuleWithOptions<any>) {
    return isModuleWithOptions(mod) ? mod.module : mod;
  }

  protected getModuleName(typeOrObject: Type<any> | ModuleWithOptions<any>) {
    return isModuleWithOptions(typeOrObject) ? typeOrObject.module.name : typeOrObject.name;
  }

  protected checkModuleMetadata(modMetadata: ModuleDecorator, modName: string) {
    if (!modMetadata) {
      throw new Error(`Module build failed: module "${modName}" does not have the "@Module()" decorator`);
    }
  }

  protected quickCheckImports(moduleMetadata: ModuleMetadata) {
    assert.array(this.opts.routesPerMod, 'routesPerMod');
    if (
      !isRootModule(moduleMetadata as any) &&
      !moduleMetadata.controllers.length &&
      !someController(this.opts.routesPerMod) &&
      !moduleMetadata.exports.length
    ) {
      throw new Error(
        `Import ${this.moduleName} failed: this module should have some controllers or "exports" array with elements.`
      );
    }

    if (isRootModule(moduleMetadata as any) && moduleMetadata.exports.length) {
      throw new Error(
        `Import ${this.moduleName} failed: modules from routesPrefixPerMod should not to have "exports" array with elements.`
      );
    }

    function someController(configs: RouteConfig[]) {
      for (const config of configs) {
        if (config.controller || someController(config.children)) {
          return true;
        }
      }
    }
  }

  protected getRawModuleMetadata(typeOrObject: Type<any> | ModuleWithOptions<any>) {
    let modMetadata: ModuleDecorator;

    if (isModuleWithOptions(typeOrObject)) {
      const modWitOptions = typeOrObject;
      modMetadata = reflector.annotations(modWitOptions.module).find(m => isModule(m) || isRootModule(m));
      const modName = this.getModuleName(modWitOptions.module);
      this.checkModuleMetadata(modWitOptions, modName);
      modMetadata.providersPerMod = mergeArrays(modWitOptions.providersPerMod, modMetadata.providersPerMod);
      modMetadata.providersPerReq = mergeArrays(modWitOptions.providersPerReq, modMetadata.providersPerReq);
    } else {
      modMetadata = reflector.annotations(typeOrObject).find(m => isModule(m) || isRootModule(m));
    }

    return modMetadata;
  }

  protected mergeMetadata(mod: Type<any> | ModuleWithOptions<any>) {
    const modMetadata = this.getRawModuleMetadata(mod);
    const modName = this.getModuleName(mod);
    this.checkModuleMetadata(modMetadata, modName);

    /**
     * Setting default module metadata.
     */
    const metadata = new ModuleMetadata();
    /**
     * This is used only internally and is hidden from the public API.
     */
    (metadata as any).ngMetadataName = (modMetadata as any).ngMetadataName;
    metadata.imports = flatten((modMetadata.imports || metadata.imports).slice()).map(resolveForwardRef);
    metadata.exports = flatten((modMetadata.exports || metadata.exports).slice()).map(resolveForwardRef);
    metadata.providersPerMod = mergeArrays(metadata.providersPerMod, modMetadata.providersPerMod);
    metadata.providersPerReq = mergeArrays(metadata.providersPerReq, modMetadata.providersPerReq);
    metadata.controllers = mergeArrays(metadata.controllers, modMetadata.controllers);
    metadata.routesPerMod = mergeArrays(metadata.routesPerMod, modMetadata.routesPerMod);

    return metadata;
  }

  /**
   * Init providers per the request.
   */
  protected initProvidersPerReq() {
    this.resolvedProvidersPerReq = ReflectiveInjector.resolve(this.opts.providersPerReq);
  }

  /**
   * Inserts new `Provider` at the start of `providersPerReq` array.
   */
  protected unshiftProvidersPerReq(...providers: Provider[]) {
    this.opts.providersPerReq.unshift(...providers);
    this.initProvidersPerReq();
  }

  protected importModules() {
    for (const imp of this.opts.imports) {
      const moduleFactory = this.injectorPerApp.resolveAndInstantiate(ModuleFactory) as ModuleFactory;
      moduleFactory.bootstrap(this.routesPrefixPerApp, this.routesPrefixPerMod, imp, this);
    }
  }

  /**
   * Called in the context of the module that imports the current module.
   *
   * @param typeOrObject Module from where exports providers.
   * @param soughtProvider Normalized provider.
   */
  protected exportProvidersToImporter(
    typeOrObject: Type<any> | ModuleWithOptions<any>,
    soughtProvider?: NormalizedProvider
  ) {
    const { exports: exp, imports, providersPerMod, providersPerReq } = this.mergeMetadata(typeOrObject);
    const moduleName = this.getModuleName(typeOrObject);

    for (const moduleOrProvider of exp) {
      const moduleMetadata = this.getRawModuleMetadata(moduleOrProvider as ModuleType);
      if (moduleMetadata) {
        const reexportedModule = moduleOrProvider as ModuleType;
        if (imports.includes(reexportedModule)) {
          this.exportProvidersToImporter(reexportedModule);
        } else {
          throw new Error(`Reexports a module failed: cannot find ${reexportedModule.name} in "imports" array`);
        }
      } else {
        const provider = moduleOrProvider as Provider;
        const normProvider = normalizeProviders([provider])[0];
        const providerName = normProvider.provide.name || normProvider.provide;
        if (soughtProvider && soughtProvider.provide !== normProvider.provide) {
          continue;
        }
        let foundProvider = this.findAndSetProvider(
          provider,
          normProvider,
          providersPerMod,
          providersPerReq,
          moduleName,
          providerName
        );
        if (!foundProvider) {
          for (const imp of imports) {
            foundProvider = this.exportProvidersToImporter(imp, normProvider);
            if (foundProvider) {
              break;
            }
          }
        }

        if (!foundProvider) {
          throw new Error(
            `Exported ${providerName} from ${moduleName} ` +
              `should includes in "providersPerMod" or "providersPerReq", ` +
              `or in some "exports" of imported modules.`
          );
        }

        if (soughtProvider) {
          return true;
        }
      }
    }
  }

  protected findAndSetProvider(
    provider: Provider,
    normProvider: NormalizedProvider,
    providersPerMod: Provider[],
    providersPerReq: Provider[],
    moduleName: string,
    providerName: string
  ) {
    const mergedProviders = [
      ...defaultProvidersPerApp,
      ...defaultProvidersPerReq,
      { provide: NodeReqToken, useValue: 'fake' },
      { provide: NodeResToken, useValue: 'fake' }
    ];
    if (hasProvider(mergedProviders)) {
      this.log.warn(`You cannot export ${providerName} from ${moduleName}, it's providers on an Application level`);
      return true;
    }

    if (hasProvider(providersPerMod)) {
      this.opts.providersPerMod.push(provider);
      return true;
    } else if (hasProvider(providersPerReq)) {
      this.opts.providersPerReq.push(provider);
      return true;
    }

    return false;

    function hasProvider(providers: Provider[]) {
      const normProviders = normalizeProviders(providers);
      return normProviders.some(p => p.provide === normProvider.provide);
    }
  }

  protected setRoutes(prefix: string, Ctrl: TypeProvider, routeData?: any) {
    const controllerMetadata = reflector.annotations(Ctrl).find(isController) as ControllerDecorator;
    if (!controllerMetadata) {
      throw new Error(`Setting routes failed: class "${Ctrl.name}" does not have the "@Controller()" decorator`);
    }
    const providersPerReq = controllerMetadata.providersPerReq;
    const propMetadata = reflector.propMetadata(Ctrl) as RouteDecoratorMetadata;

    for (const prop in propMetadata) {
      const routes = propMetadata[prop].filter(isRoute);
      for (const route of routes) {
        this.checkRoutePath(route.path);
        this.unshiftProvidersPerReq(Ctrl);
        let resolvedProvidersPerReq: ResolvedReflectiveProvider[] = this.resolvedProvidersPerReq;
        if (providersPerReq) {
          resolvedProvidersPerReq = ReflectiveInjector.resolve([...this.opts.providersPerReq, ...providersPerReq]);
        }

        const injectorPerReq = this.injectorPerMod.createChildFromResolved(resolvedProvidersPerReq);
        const bodyParserConfig = injectorPerReq.get(BodyParserConfig) as BodyParserConfig;
        const parseBody = bodyParserConfig.acceptMethods.includes(route.httpMethod);

        const path = [prefix, route.path].filter(s => s).join('/');
        this.router.on(route.httpMethod, `/${path}`, () => ({
          injector: this.injectorPerMod,
          providers: resolvedProvidersPerReq,
          controller: Ctrl,
          method: prop,
          parseBody,
          routeData
        }));

        this.log.trace({
          httpMethod: route.httpMethod,
          path,
          handler: `${Ctrl.name} -> ${prop}()`
        });
      }
    }
  }

  protected checkRoutePath(path: string) {
    if (path.charAt(0) == '/') {
      throw new Error(
        `Invalid configuration of route '${path}' (in '${this.moduleName}'): path cannot start with a slash`
      );
    }
  }
}
