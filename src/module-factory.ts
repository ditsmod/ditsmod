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

import { ModuleDecorator, ControllersDecorator, RouteDecoratorMetadata, RoutesPrefixPerMod } from './types/decorators';
import {
  Logger,
  ModuleType,
  ModuleWithProviders,
  Router,
  BodyParserConfig,
  NodeReqToken,
  NodeResToken,
  RouteConfig
} from './types/types';
import { flatten, normalizeProviders, NormalizedProvider } from './utils/ng-utils';
import { isModuleWithProviders, isModule, isRootModule, isController, isRoute } from './utils/type-guards';
import {
  ModuleMetadata,
  defaultProvidersPerReq,
  defaultProvidersPerApp,
  ApplicationMetadata
} from './types/default-options';
import { mergeOpts } from './utils/merge-arrays-options';

@Injectable()
export class ModuleFactory {
  protected moduleName: string;
  protected imports: Type<any>[];
  protected exports: (Type<any> | Provider)[];
  /**
   * Providers per the module.
   */
  protected providersPerMod: Provider[];
  protected providersPerReq: Provider[];
  protected controllers: TypeProvider[];
  protected routesPrefixPerApp: string;
  protected routesPrefixPerMod: RoutesPrefixPerMod[];
  protected routesPerMod: RouteConfig[];
  protected resolvedProvidersPerReq: ResolvedReflectiveProvider[];
  /**
   * Injector per the module.
   */
  protected injectorPerMod: ReflectiveInjector;

  constructor(private router: Router, private injectorPerApp: ReflectiveInjector, private log: Logger) {}

  /**
   * Bootstraps a module.
   *
   * @param mod Module that will bootstrapped.
   * @param importer It's module that imported current module.
   */
  bootstrap(routesPrefixPerApp: string, routesPrefixPerMod: RoutesPrefixPerMod[], mod: ModuleType, importer?: this) {
    this.moduleName = mod.name;
    this.routesPrefixPerApp = routesPrefixPerApp || '';
    this.routesPrefixPerMod = routesPrefixPerMod;
    const prefixConfig = this.routesPrefixPerMod.find(config => config.module === mod);
    const routesPrefix = prefixConfig?.prefix || '';
    const moduleMetadata = this.mergeMetadata(mod);
    Object.assign(this, moduleMetadata);
    this.initProvidersPerReq();
    this.importRoutes();
    /**
     * If we exported providers from current module,
     * this only make sense for the module that will import current module.
     *
     * Here "importer" it's module that imported current module,
     * so we should call `importProviders()` method in its context.
     */
    if (importer) {
      this.importProviders.call(importer, mod);
    }
    this.injectorPerMod = this.injectorPerApp.resolveAndCreateChild(this.providersPerMod);
    this.checkImports(moduleMetadata, mod.name);
    this.checkRoutePath(this.routesPrefixPerApp);
    this.checkRoutePath(routesPrefix);
    const prefix = [this.routesPrefixPerApp, routesPrefix].filter(s => s).join('/');
    this.controllers.forEach(Ctrl => this.setRoutes(prefix, Ctrl));
    this.loadRoutesConfig(prefix, this.routesPerMod);
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

  protected checkImports(moduleMetadata: ModuleMetadata & ApplicationMetadata, moduleName: string) {
    assert.array(this.routesPerMod, 'routesPerMod');
    if (
      !isRootModule(moduleMetadata) &&
      !moduleMetadata.controllers.length &&
      !someController(this.routesPerMod) &&
      !moduleMetadata.exports.length
    ) {
      throw new Error(
        `Import ${moduleName} failed: the imported module should have some controllers or "exports" array with elements.`
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

  /**
   * Merge a module metadata with default metadata.
   *
   * @todo Fix flatten imports/exports in case with `ModuleWithProviders`,
   * the providers should be respect.
   */
  protected mergeMetadata(mod: ModuleType) {
    const modMetadata = this.getRawModuleMetadata(mod);
    if (!modMetadata) {
      throw new Error(`Module build failed: module "${mod.name}" does not have the "@Module()" decorator`);
    }

    /**
     * Setting default module metadata.
     */
    const metadata = new ModuleMetadata();
    /**
     * This is only used internally and is hidden from the public API.
     */
    (metadata as any).ngMetadataName = (modMetadata as any).ngMetadataName;
    metadata.moduleName = mod.name;
    metadata.imports = flatten((modMetadata.imports || metadata.imports).slice())
      .map(resolveForwardRef)
      .map(getModule);
    metadata.exports = flatten((modMetadata.exports || metadata.exports).slice())
      .map(resolveForwardRef)
      .map(getModule);
    metadata.providersPerMod = mergeOpts(metadata.providersPerMod, modMetadata.providersPerMod);
    metadata.providersPerReq = mergeOpts(metadata.providersPerReq, modMetadata.providersPerReq);
    metadata.controllers = mergeOpts(metadata.controllers, modMetadata.controllers);
    metadata.routesPerMod = mergeOpts(metadata.routesPerMod, modMetadata.routesPerMod);

    return metadata;

    function getModule(value: Type<any> | ModuleWithProviders<{}>): Type<any> {
      if (isModuleWithProviders(value)) {
        return value.module;
      }
      return value;
    }
  }

  protected getRawModuleMetadata(mod: ModuleType): ModuleDecorator {
    return reflector.annotations(mod).find(m => isModule(m) || isRootModule(m));
  }

  /**
   * Init providers per the request.
   */
  protected initProvidersPerReq() {
    this.resolvedProvidersPerReq = ReflectiveInjector.resolve(this.providersPerReq);
  }

  /**
   * Inserts new `Provider` at the start of `providersPerReq` array.
   */
  protected unshiftProvidersPerReq(...providers: Provider[]) {
    this.providersPerReq.unshift(...providers);
    this.initProvidersPerReq();
  }

  protected importRoutes() {
    for (const imp of this.imports) {
      const moduleFactory = this.injectorPerApp.resolveAndInstantiate(ModuleFactory) as ModuleFactory;
      moduleFactory.bootstrap(this.routesPrefixPerApp, this.routesPrefixPerMod, imp, this);
    }
  }

  /**
   * Called in the context of the module that imports the current module.
   *
   * @param mod Module from where exports providers.
   * @param soughtProvider Normalized provider.
   */
  protected importProviders(mod: ModuleType, soughtProvider?: NormalizedProvider) {
    const { moduleName, exports: exp, imports, providersPerMod, providersPerReq } = this.mergeMetadata(mod);

    for (const moduleOrProvider of exp) {
      const moduleMetadata = this.getRawModuleMetadata(moduleOrProvider as ModuleType);
      if (moduleMetadata) {
        const reexportedModule = moduleOrProvider as ModuleType;
        if (imports.includes(reexportedModule)) {
          this.importProviders(reexportedModule);
        } else {
          throw new Error(`Reexports a module failed: cannot find ${reexportedModule.name} in "imports" array`);
        }
      } else {
        const provider = moduleOrProvider as Provider;
        const normProvider = normalizeProviders([provider])[0];
        const providerName = normProvider.provide.name || normProvider.provide;
        if (soughtProvider?.provide !== normProvider.provide) {
          continue;
        }
        let foundProvider = this.findAndSetProvider(
          normProvider,
          providersPerMod,
          providersPerReq,
          moduleName,
          providerName
        );
        if (!foundProvider) {
          for (const imp of imports) {
            foundProvider = this.importProviders(imp, normProvider);
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
      this.providersPerMod.unshift(normProvider);
      return true;
    } else if (hasProvider(providersPerReq)) {
      this.providersPerReq.unshift(normProvider);
      return true;
    }

    return false;

    function hasProvider(providers: Provider[]) {
      const normProviders = normalizeProviders(providers);
      return normProviders.some(p => p.provide === normProvider.provide);
    }
  }

  protected setRoutes(prefix: string, Ctrl: TypeProvider, routeData?: any) {
    const controllerMetadata = reflector.annotations(Ctrl).find(c => isController(c)) as ControllersDecorator;
    if (!controllerMetadata) {
      throw new Error(`Setting routes failed: class "${Ctrl.name}" does not have the "@Controller()" decorator`);
    }
    const providersPerReq = controllerMetadata.providersPerReq;
    const propMetadata = reflector.propMetadata(Ctrl) as RouteDecoratorMetadata;

    for (const prop in propMetadata) {
      const routes = propMetadata[prop].filter(p => isRoute(p));
      for (const route of routes) {
        this.checkRoutePath(route.path);
        this.unshiftProvidersPerReq(Ctrl);
        let resolvedProvidersPerReq: ResolvedReflectiveProvider[] = this.resolvedProvidersPerReq;
        if (providersPerReq) {
          resolvedProvidersPerReq = ReflectiveInjector.resolve([...this.providersPerReq, ...providersPerReq]);
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
