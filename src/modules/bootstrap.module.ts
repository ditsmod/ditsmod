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

import { ModuleDecorator, ControllersDecorator, RouteDecoratorMetadata } from '../types/decorators';
import { Logger, ModuleType, ModuleWithProviders, Router, ModuleMetadata } from '../types/types';
import { flatten, normalizeProviders } from '../utils/ng-utils';
import { isModuleWithProviders, isModule, isRootModule, isController, isRoute } from '../utils/type-guards';
import { pickProperties } from '../utils/pick-properties';
import { defaultProvidersPerReq, defaultProvidersPerApp } from '../constants';

@Injectable()
export class BootstrapModule {
  protected imports: Type<any>[];
  protected exports: (Type<any> | Provider)[];
  /**
   * Providers per the module.
   */
  protected providersPerMod: Provider[];
  protected providersPerReq: Provider[];
  protected controllers: TypeProvider[];
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
   * @param parent It's module that imported our module.
   */
  bootstrap(mod: ModuleType, parent?: this) {
    this.setModuleDefaultOptions();
    const moduleMetadata = this.extractModuleMetadata(mod);
    this.checkMetadata(moduleMetadata, mod.name);
    Object.assign(this, moduleMetadata);
    this.initProvidersPerReq();
    this.importModules();
    /**
     * If we exported providers from our module,
     * this only make sense for the module that will import our module.
     *
     * Here "parent" it's module that imported our module,
     * so we should call `exportProviders()` method in its context.
     */
    if (parent) {
      this.exportProviders.call(parent, mod);
    }
    this.injectorPerMod = this.injectorPerApp.resolveAndCreateChild(this.providersPerMod);
    this.setRoutes();
  }

  protected setModuleDefaultOptions() {
    this.imports = [];
    this.exports = [];
    this.providersPerMod = [];
    this.providersPerReq = [];
    this.controllers = [];
  }

  /**
   * @todo Fix flatten imports/exports in case with `ModuleWithProviders`,
   * the providers should be respect.
   */
  protected extractModuleMetadata(mod: ModuleType) {
    const moduleMetadata = this.getRawModuleMetadata(mod);
    if (!isModule(moduleMetadata) && !isRootModule(moduleMetadata)) {
      return moduleMetadata;
    }
    const metadata = pickProperties(new ModuleMetadata(), this as any);
    /**
     * This is only used internally and is hidden from the public API.
     */
    (metadata as any).ngMetadataName = (moduleMetadata as any).ngMetadataName;
    metadata.moduleName = mod.name;
    metadata.imports = flatten((moduleMetadata.imports || metadata.imports).slice())
      .map(resolveForwardRef)
      .map(getModule);
    metadata.exports = flatten((moduleMetadata.exports || metadata.exports).slice())
      .map(resolveForwardRef)
      .map(getModule);
    metadata.providersPerMod = (moduleMetadata.providersPerMod || metadata.providersPerMod).slice();
    metadata.providersPerReq = (moduleMetadata.providersPerReq || metadata.providersPerReq).slice();
    metadata.controllers = (moduleMetadata.controllers || metadata.controllers).slice();

    return metadata;

    function getModule(value: Type<any> | ModuleWithProviders<{}>): Type<any> {
      if (isModuleWithProviders(value)) {
        return value.module;
      }
      return value;
    }
  }

  protected getRawModuleMetadata(mod: ModuleType) {
    return reflector.annotations(mod).find(m => isModule(m) || isRootModule(m)) as ModuleDecorator;
  }

  protected checkMetadata(moduleMetadata: ModuleDecorator, moduleName: string) {
    if (!isModule(moduleMetadata) && !isRootModule(moduleMetadata)) {
      throw new Error(`Module build failed: module "${moduleName}" does not have the "@Module()" decorator`);
    }
  }

  /**
   * Init providers per the request.
   */
  protected initProvidersPerReq() {
    this.providersPerReq.unshift(...defaultProvidersPerReq);
    this.resolvedProvidersPerReq = ReflectiveInjector.resolve(this.providersPerReq);
  }

  /**
   * Inserts new `Provider` at the start of `providersPerReq` array.
   */
  protected unshiftProvidersPerReq(...providers: Provider[]) {
    this.providersPerReq.unshift(...providers);
    this.resolvedProvidersPerReq = ReflectiveInjector.resolve(this.providersPerReq);
  }

  protected importModules() {
    for (const imp of this.imports) {
      const bsMod = this.injectorPerApp.resolveAndInstantiate(BootstrapModule) as BootstrapModule;
      bsMod.bootstrap(imp, this);
    }
  }

  /**
   * Called in the context of the module that imports the current module.
   *
   * @param mod Module from where exports providers.
   */
  protected exportProviders(mod: ModuleType) {
    const {
      moduleName,
      exports: modulesOrProviders,
      imports,
      providersPerMod,
      providersPerReq
    } = this.extractModuleMetadata(mod);
    for (const moduleOrProvider of modulesOrProviders) {
      const moduleMetadata = this.getRawModuleMetadata(moduleOrProvider as ModuleType);
      if (isModule(moduleMetadata)) {
        const reexportedModule = moduleOrProvider as ModuleType;
        if (imports.includes(reexportedModule)) {
          this.exportProviders(reexportedModule);
        } else {
          throw new Error(`Reexports a module failed: cannot find ${reexportedModule.name} in "imports" array`);
        }
      } else {
        let isFoundProvider = false;
        const provider = moduleOrProvider as Provider;
        const providerName = normalizeProviders([provider])[0].provide.name;
        if (this.hasProvider(provider, providersPerMod)) {
          if (defaultProvidersPerApp.includes(provider)) {
            this.log.warn(
              `You cannot export ${providerName} from ${moduleName}, it's providers on an Application level`
            );
          } else {
            this.providersPerMod.unshift(provider);
          }
          isFoundProvider = true;
        } else if (this.hasProvider(provider, providersPerReq)) {
          if (defaultProvidersPerReq.includes(provider)) {
            this.log.warn(
              `You cannot export ${providerName} from ${moduleName}, it's providers on an Application level`
            );
          } else {
            this.providersPerReq.unshift(provider);
          }
          isFoundProvider = true;
        } else {
          // Try find in imports
        }

        /**
         * Finish recursive search, cannot find the provider.
         */
        if (!isFoundProvider) {
          throw new Error(
            `Exported ${providerName} from ${moduleName} ` +
              `should includes in "providersPerMod" or "providersPerReq", ` +
              `or in "exports" of imported some module.`
          );
        }
        return true;
      }
    }
  }

  protected hasProvider(candidate: Provider, providers: Provider[]): boolean {
    const normCandidate = normalizeProviders([candidate])[0];
    const normProviders = normalizeProviders(providers);
    return !!normProviders.find(p => p.provide === normCandidate.provide);
  }

  protected setRoutes() {
    this.controllers.forEach(Controller => {
      const controllerMetadata = reflector.annotations(Controller).find(c => isController(c)) as ControllersDecorator;
      if (!controllerMetadata) {
        throw new Error(
          `Setting routes failed: class "${Controller.name}" does not have the "@Controller()" decorator`
        );
      }
      const pathFromRoot = controllerMetadata.path;
      const providersPerReq = controllerMetadata.providersPerReq;
      this.checkRoutePath(Controller.name, pathFromRoot);
      const propMetadata = reflector.propMetadata(Controller) as RouteDecoratorMetadata;
      for (const prop in propMetadata) {
        const routes = propMetadata[prop].filter(p => isRoute(p));
        for (const route of routes) {
          this.checkRoutePath(Controller.name, route.path);
          let path = '/';
          if (!pathFromRoot) {
            path += route.path;
          } else if (!route.path) {
            path += pathFromRoot;
          } else {
            path += `${pathFromRoot}/${route.path}`;
          }

          this.unshiftProvidersPerReq(Controller);
          let resolvedProvidersPerReq: ResolvedReflectiveProvider[] = this.resolvedProvidersPerReq;
          if (providersPerReq) {
            resolvedProvidersPerReq = ReflectiveInjector.resolve([...this.providersPerReq, ...providersPerReq]);
          }

          this.router.on(route.httpMethod, path, () => ({
            injector: this.injectorPerMod,
            providers: resolvedProvidersPerReq,
            controller: Controller,
            method: prop
          }));

          if (this.log.trace()) {
            const msg = {
              httpMethod: route.httpMethod,
              path,
              handler: `${Controller.name} -> ${prop}()`
            };
            this.log.trace(msg);
          }
        }
      }
    });
  }

  protected checkRoutePath(controllerName: string, path: string) {
    if (path.charAt(0) == '/') {
      throw new Error(
        `Invalid configuration of route '${path}' (in '${controllerName}'): path cannot start with a slash`
      );
    }
  }
}
