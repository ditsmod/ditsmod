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

import { ModuleDecorator, ControllersDecorator, RouteDecoratorMetadata, Module, Controller } from '../types/decorators';
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
   * @param importer It's module that imported current module.
   */
  bootstrap(mod: ModuleType, importer?: this) {
    const moduleMetadata = this.mergeMetadata(mod);
    pickProperties(this as any, moduleMetadata);
    this.initProvidersPerReq();
    this.importControllers();
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
    this.setRoutes();
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
      throw new Error(`Module build failed: module "${mod.name}" does not have the "@${Module.name}()" decorator`);
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
    metadata.providersPerMod = (modMetadata.providersPerMod || metadata.providersPerMod).slice();
    metadata.providersPerReq = (modMetadata.providersPerReq || metadata.providersPerReq).slice();
    metadata.controllers = (modMetadata.controllers || metadata.controllers).slice();

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

  protected importControllers() {
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
  protected importProviders(mod: ModuleType) {
    const { moduleName, exports: modulesOrProviders, imports, providersPerMod, providersPerReq } = this.mergeMetadata(
      mod
    );

    for (const moduleOrProvider of modulesOrProviders) {
      const moduleMetadata = this.getRawModuleMetadata(moduleOrProvider as ModuleType);
      if (moduleMetadata) {
        const reexportedModule = moduleOrProvider as ModuleType;
        if (imports.includes(reexportedModule)) {
          this.importProviders(reexportedModule);
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
    this.controllers.forEach(Ctrl => {
      const controllerMetadata = reflector.annotations(Ctrl).find(c => isController(c)) as ControllersDecorator;
      if (!controllerMetadata) {
        throw new Error(
          `Setting routes failed: class "${Ctrl.name}" does not have the "@${Controller.name}()" decorator`
        );
      }
      const pathFromRoot = controllerMetadata.path;
      const providersPerReq = controllerMetadata.providersPerReq;
      this.checkRoutePath(Ctrl.name, pathFromRoot);
      const propMetadata = reflector.propMetadata(Ctrl) as RouteDecoratorMetadata;
      for (const prop in propMetadata) {
        const routes = propMetadata[prop].filter(p => isRoute(p));
        for (const route of routes) {
          this.checkRoutePath(Ctrl.name, route.path);
          let path = '/';
          if (!pathFromRoot) {
            path += route.path;
          } else if (!route.path) {
            path += pathFromRoot;
          } else {
            path += `${pathFromRoot}/${route.path}`;
          }

          this.unshiftProvidersPerReq(Ctrl);
          let resolvedProvidersPerReq: ResolvedReflectiveProvider[] = this.resolvedProvidersPerReq;
          if (providersPerReq) {
            resolvedProvidersPerReq = ReflectiveInjector.resolve([...this.providersPerReq, ...providersPerReq]);
          }

          this.router.on(route.httpMethod, path, () => ({
            injector: this.injectorPerMod,
            providers: resolvedProvidersPerReq,
            controller: Ctrl,
            method: prop
          }));

          this.log.trace({
            httpMethod: route.httpMethod,
            path,
            handler: `${Ctrl.name} -> ${prop}()`
          });
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
