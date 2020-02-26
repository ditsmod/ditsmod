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

import {
  ModuleMetadata,
  defaultProvidersPerReq,
  ModuleType,
  ModuleWithOptions,
  ProvidersMetadata
} from './decorators/module';
import { ControllerDecorator } from './decorators/controller';
import { RouteDecoratorMetadata } from './decorators/route';
import { BodyParserConfig } from './types/types';
import { flatten, normalizeProviders, NormalizedProvider } from './utils/ng-utils';
import { isRootModule, isController, isRoute } from './utils/type-guards';
import { mergeArrays } from './utils/merge-arrays-options';
import { Router, RouteConfig, ImportsWithPrefix } from './types/router';
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
  protected prefixPerApp: string;
  protected prefixPerMod: string;
  protected resolvedProvidersPerReq: ResolvedReflectiveProvider[];
  protected opts: ModuleMetadata;
  protected exportedProvidersPerMod: Provider[] = [];
  protected exportedProvidersPerReq: Provider[] = [];
  protected globalProviders: ProvidersMetadata;
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
   * Called only by `@RootModule` before called `ModuleFactory#boostrap()`.
   */
  exportGlobalProviders(rootModule: Type<any>, globalProviders: ProvidersMetadata) {
    this.moduleName = this.getModuleName(rootModule);
    const moduleMetadata = this.mergeMetadata(rootModule);
    this.opts = new ModuleMetadata();
    Object.assign(this.opts, moduleMetadata);
    this.globalProviders = globalProviders;
    this.exportProvidersToImporter(rootModule, true);

    return {
      providersPerMod: this.exportedProvidersPerMod,
      providersPerReq: this.exportedProvidersPerReq
    };
  }

  /**
   * Bootstraps a module.
   *
   * @param modOrObject Module that will bootstrapped.
   * @param importer It's module that imported current module.
   */
  bootstrap(
    globalProviders: ProvidersMetadata,
    prefixPerApp: string,
    prefixPerMod: string,
    modOrObject: Type<any> | ModuleWithOptions<any>,
    importer?: this
  ) {
    this.prefixPerApp = prefixPerApp || '';
    this.prefixPerMod = prefixPerMod || '';
    const mod = this.getModule(modOrObject);
    this.moduleName = mod.name;
    const moduleMetadata = this.mergeMetadata(modOrObject);
    this.opts = new ModuleMetadata();
    Object.assign(this.opts, moduleMetadata);
    this.globalProviders = globalProviders;
    /**
     * If we exported providers from current module,
     * this only make sense for the module that will import current module.
     *
     * Here "importer" it's module that imported current module,
     * so we should call `exportProvidersToImporter()` method in its context.
     */
    if (importer) {
      this.exportProvidersToImporter.call(importer, modOrObject, true);
    }
    this.importModules();
    this.mergeProviders(moduleMetadata);
    this.injectorPerMod = this.injectorPerApp.resolveAndCreateChild(this.opts.providersPerMod);
    this.injectorPerMod.resolveAndInstantiate(mod);
    this.initProvidersPerReq();
    this.quickCheckImports(moduleMetadata);
    this.checkRoutePath(this.prefixPerApp);
    this.checkRoutePath(this.prefixPerMod);
    const prefix = [this.prefixPerApp, this.prefixPerMod].filter(s => s).join('/');
    this.opts.controllers.forEach(Ctrl => this.setRoutes(prefix, Ctrl));
    this.loadRoutesConfig(prefix, this.opts.routesPerMod);
    return this.testOptionsMap.set(mod, this.opts);
  }

  protected mergeProviders(moduleMetadata: ModuleMetadata) {
    const duplicatesProvidersPerMod = getDuplicates([
      ...this.globalProviders.providersPerMod,
      ...this.opts.providersPerMod
    ]);
    const globalProvidersPerMod = isRootModule(moduleMetadata) ? [] : this.globalProviders.providersPerMod;
    this.opts.providersPerMod = [
      ...globalProvidersPerMod,
      ...this.exportedProvidersPerMod,
      ...this.opts.providersPerMod.filter(p => !duplicatesProvidersPerMod.includes(p))
    ];

    const duplicatesProvidersPerReq = getDuplicates([
      ...this.globalProviders.providersPerReq,
      ...this.opts.providersPerReq
    ]);
    const globalProvidersPerReq = isRootModule(moduleMetadata)
      ? defaultProvidersPerReq
      : this.globalProviders.providersPerReq;
    this.opts.providersPerReq = [
      ...globalProvidersPerReq,
      ...this.exportedProvidersPerReq,
      ...this.opts.providersPerReq.filter(p => !duplicatesProvidersPerReq.includes(p))
    ];
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
    metadata.importsWithPrefix =
      // prettier, don't do this!
      flatten<Type<any> | ModuleWithOptions<any>>(modMetadata.imports).map<ImportsWithPrefix>(imp => {
        return {
          prefix: '',
          module: resolveForwardRef(imp)
        };
      });
    const importsWithPrefix = flatten<ImportsWithPrefix>(modMetadata.importsWithPrefix).map<ImportsWithPrefix>(imp => {
      return {
        prefix: imp.prefix,
        module: resolveForwardRef(imp.module)
      };
    });
    metadata.importsWithPrefix.push(...importsWithPrefix);
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
    for (const imp of this.opts.importsWithPrefix) {
      const prefixPerMod = [this.prefixPerMod, imp.prefix].filter(s => s).join('/');
      const mod = imp.module;
      const moduleFactory = this.injectorPerApp.resolveAndInstantiate(ModuleFactory) as ModuleFactory;
      const optionsMap = moduleFactory.bootstrap(this.globalProviders, this.prefixPerApp, prefixPerMod, mod, this);
      this.testOptionsMap = new Map([...this.testOptionsMap, ...optionsMap]);
    }
  }

  /**
   * Called in the context of the module that imports the current module.
   *
   * @param modOrObject Module from where exports providers.
   * @param soughtProvider Normalized provider.
   */
  protected exportProvidersToImporter(
    modOrObject: Type<any> | ModuleWithOptions<any>,
    isStarter: boolean,
    soughtProvider?: NormalizedProvider
  ) {
    const { exports: exp, importsWithPrefix, providersPerMod, providersPerReq } = this.mergeMetadata(modOrObject);
    const moduleName = this.getModuleName(modOrObject);

    for (const moduleOrProvider of exp) {
      const moduleMetadata = this.getRawModuleMetadata(moduleOrProvider as ModuleType);
      if (moduleMetadata) {
        const reexportedModuleOrObject = moduleOrProvider as ModuleType | ModuleWithOptions<any>;
        const reexportedModule = this.getModule(reexportedModuleOrObject);
        if (importsWithPrefix.map(imp => this.getModule(imp.module)).includes(reexportedModule)) {
          this.exportProvidersToImporter(reexportedModuleOrObject, false, soughtProvider);
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
          for (const imp of importsWithPrefix) {
            foundProvider = this.exportProvidersToImporter(imp.module, false, normProvider);
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
    const tokensPerApp = normalizeProviders(this.globalProviders.providersPerApp).map(np => np.provide);

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
