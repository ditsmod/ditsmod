import {
  reflector,
  TypeProvider,
  Provider,
  Type,
  resolveForwardRef,
  Injectable,
  ResolvedReflectiveProvider,
  ReflectiveInjector
} from '@ts-stack/di';

import { ModuleMetadata, defaultProvidersPerReq, ModuleType, ModuleWithOptions } from './decorators/module';
import { ControllerDecorator } from './decorators/controller';
import { RouteDecoratorMetadata } from './decorators/route';
import { BodyParserConfig } from './types/types';
import { flatten, normalizeProviders, NormalizedProvider } from './utils/ng-utils';
import { isRootModule, isController, isRoute } from './utils/type-guards';
import { mergeArrays } from './utils/merge-arrays-options';
import { Router, RouteConfig } from './types/router';
import { NodeReqToken, NodeResToken } from './types/injection-tokens';
import { Logger } from './types/logger';
import { Factory } from './factory';
import { getDuplicates } from './utils/get-duplicates';

/**
 * - creates `injectorPerMod` and `injectorPerReq`;
 * - settings routes.
 */
@Injectable()
export class ModuleFactory extends Factory {
  protected moduleName: string;
  protected routesPrefixPerApp: string;
  protected routesPrefixPerMod: string;
  protected resolvedProvidersPerReq: ResolvedReflectiveProvider[];
  protected allProvidersPerApp: Provider[];
  protected opts: ModuleMetadata;
  protected exportedProvidersPerMod: Provider[] = [];
  protected exportedProvidersPerReq: Provider[] = [];
  protected allExportedProvidersPerMod: Provider[] = [];
  protected allExportedProvidersPerReq: Provider[] = [];
  /**
   * Injector per the module.
   */
  protected injectorPerMod: ReflectiveInjector;
  /**
   * Only for testing purpose.
   */
  protected testOptionsMap = new Map<Type<any>, ModuleMetadata>();

  constructor(protected router: Router, protected injectorPerApp: ReflectiveInjector, protected log: Logger) {
    super();
  }

  /**
   * Bootstraps a module.
   *
   * @param typeOrObject Module that will bootstrapped.
   * @param importer It's module that imported current module.
   */
  bootstrap(
    providersPerApp: Provider[],
    routesPrefixPerApp: string,
    routesPrefixPerMod: string,
    typeOrObject: Type<any> | ModuleWithOptions<any>,
    importer?: this
  ) {
    this.routesPrefixPerApp = routesPrefixPerApp || '';
    this.routesPrefixPerMod = routesPrefixPerMod || '';
    const mod = this.getModule(typeOrObject);
    this.moduleName = mod.name;
    const moduleMetadata = this.mergeMetadata(typeOrObject);
    this.opts = new ModuleMetadata();
    Object.assign(this.opts, moduleMetadata);
    this.allProvidersPerApp = providersPerApp;
    /**
     * If we exported providers from current module,
     * this only make sense for the module that will import current module.
     *
     * Here "importer" it's module that imported current module,
     * so we should call `exportProvidersToImporter()` method in its context.
     */
    if (importer) {
      this.exportProvidersToImporter.call(importer, typeOrObject, true);
    }
    this.importModules();

    this.opts.providersPerMod = [...this.allExportedProvidersPerMod, ...this.opts.providersPerMod];
    this.opts.providersPerReq = [
      ...defaultProvidersPerReq,
      ...this.allExportedProvidersPerReq,
      ...this.opts.providersPerReq
    ];

    this.injectorPerMod = this.injectorPerApp.resolveAndCreateChild(this.opts.providersPerMod);
    this.injectorPerMod.resolveAndInstantiate(mod);
    this.initProvidersPerReq();
    this.quickCheckImports(moduleMetadata);
    this.checkRoutePath(this.routesPrefixPerApp);
    this.checkRoutePath(this.routesPrefixPerMod);
    const prefix = [this.routesPrefixPerApp, this.routesPrefixPerMod].filter(s => s).join('/');
    this.opts.controllers.forEach(Ctrl => this.setRoutes(prefix, Ctrl));
    this.loadRoutesConfig(prefix, this.opts.routesPerMod);
    return this.testOptionsMap.set(mod, this.opts);
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

  protected quickCheckImports(moduleMetadata: ModuleMetadata) {
    if (
      !isRootModule(moduleMetadata as any) &&
      !moduleMetadata.providersPerApp.length &&
      !moduleMetadata.controllers.length &&
      !someController(this.opts.routesPerMod) &&
      !moduleMetadata.exports.length
    ) {
      throw new Error(
        `Import ${this.moduleName} failed: this module should have "providersPerApp" or some controllers or "exports" array with elements.`
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

  protected mergeMetadata(mod: Type<any> | ModuleWithOptions<any>) {
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
    metadata.imports = flatten(modMetadata.imports).map(resolveForwardRef);
    metadata.exports = flatten(modMetadata.exports).map(resolveForwardRef);
    metadata.providersPerApp = flatten(modMetadata.providersPerApp);
    metadata.providersPerMod = flatten(modMetadata.providersPerMod);
    metadata.providersPerReq = flatten(modMetadata.providersPerReq);
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
      const optionsMap = moduleFactory.bootstrap(
        this.allProvidersPerApp,
        this.routesPrefixPerApp,
        this.routesPrefixPerMod,
        imp,
        this
      );
      this.testOptionsMap = new Map([...this.testOptionsMap, ...optionsMap]);
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
    isStarter: boolean,
    soughtProvider?: NormalizedProvider
  ) {
    const { exports: exp, imports, providersPerMod, providersPerReq } = this.mergeMetadata(typeOrObject);
    const moduleName = this.getModuleName(typeOrObject);

    for (const moduleOrProvider of exp) {
      const moduleMetadata = this.getRawModuleMetadata(moduleOrProvider as ModuleType);
      if (moduleMetadata) {
        const reexportedModule = moduleOrProvider as ModuleType;
        if (imports.map(this.getModule).includes(reexportedModule)) {
          this.exportProvidersToImporter(reexportedModule, false, soughtProvider);
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
        let foundProvider = this.findAndSetProvider(provider, normProvider, providersPerMod, providersPerReq);
        if (!foundProvider) {
          for (const imp of imports) {
            foundProvider = this.exportProvidersToImporter(imp, false, normProvider);
            if (foundProvider) {
              break;
            }
          }
        }

        if (!foundProvider) {
          throw new Error(
            `Exported ${providerName} from ${moduleName} ` +
              `should includes in "providersPerMod" or "providersPerReq", ` +
              `or in some "exports" of imported modules. ` +
              `Tip: "providersPerApp" no need exports, they are automatically exported.`
          );
        }

        if (soughtProvider) {
          return true;
        }
      }
    }

    if (isStarter) {
      this.checkProvidersUnpredictable();
      this.allExportedProvidersPerMod.push(...this.exportedProvidersPerMod);
      this.allExportedProvidersPerReq.push(...this.exportedProvidersPerReq);
    }
  }

  protected findAndSetProvider(
    provider: Provider,
    normProvider: NormalizedProvider,
    providersPerMod: Provider[],
    providersPerReq: Provider[]
  ) {
    if (hasProvider(providersPerMod)) {
      this.exportedProvidersPerMod.push(provider);
      return true;
    } else if (hasProvider(providersPerReq)) {
      this.exportedProvidersPerReq.push(provider);
      return true;
    }

    return false;

    function hasProvider(providers: Provider[]) {
      const normProviders = normalizeProviders(providers);
      return normProviders.some(p => p.provide === normProvider.provide);
    }
  }

  protected checkProvidersUnpredictable() {
    const tokensPerApp = normalizeProviders(this.allProvidersPerApp).map(np => np.provide);

    const declaredTokensPerMod = normalizeProviders(this.opts.providersPerMod).map(np => np.provide);
    const exportedTokensPerMod = normalizeProviders(this.exportedProvidersPerMod).map(np => np.provide);
    const duplExpPerMod = getDuplicates(exportedTokensPerMod).filter(d => !declaredTokensPerMod.includes(d));
    const tokensPerMod = [...declaredTokensPerMod, ...exportedTokensPerMod];

    const declaredTokensPerReq = normalizeProviders(this.opts.providersPerReq).map(np => np.provide);
    const exportedTokensPerReq = normalizeProviders(this.exportedProvidersPerReq).map(np => np.provide);
    const duplExpPerReq = getDuplicates(exportedTokensPerReq).filter(d => !declaredTokensPerReq.includes(d));

    const mixPerApp = tokensPerApp.filter(p => {
      if (exportedTokensPerMod.includes(p) && !declaredTokensPerMod.includes(p)) {
        return true;
      }
      return exportedTokensPerReq.includes(p) && !declaredTokensPerReq.includes(p);
    });

    const defaultTokens = normalizeProviders([...defaultProvidersPerReq]).map(np => np.provide);
    const mergedTokens = [...defaultTokens, ...tokensPerMod, NodeReqToken, NodeResToken];
    const mixPerModOrReq = mergedTokens.filter(p => {
      return exportedTokensPerReq.includes(p) && !declaredTokensPerReq.includes(p);
    });

    const unpredictables = [...duplExpPerMod, ...duplExpPerReq, ...mixPerApp, ...mixPerModOrReq];
    if (unpredictables.length) {
      this.throwErrorProvidersUnpredictable(this.moduleName, unpredictables);
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
