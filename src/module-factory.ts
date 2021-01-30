import {
  reflector,
  TypeProvider,
  Provider,
  Type,
  resolveForwardRef,
  Injectable,
  ResolvedReflectiveProvider,
  ReflectiveInjector,
} from '@ts-stack/di';

import {
  ModuleMetadata,
  defaultProvidersPerReq,
  ModuleType,
  ModuleWithOptions,
  ProvidersMetadata,
  ExportableProvider,
} from './decorators/module';
import { RouteDecoratorMetadata, RouteMetadata } from './decorators/route';
import { BodyParserConfig } from './types/types';
import { flatten, normalizeProviders, NormalizedProvider } from './utils/ng-utils';
import { isRootModule, isController, isRoute, isImportsWithPrefix, isExportableProvider } from './utils/type-guards';
import { mergeArrays } from './utils/merge-arrays-options';
import { Router, ImportsWithPrefix, ImportsWithPrefixDecorator, GuardItems } from './types/router';
import { NodeReqToken, NodeResToken } from './types/injection-tokens';
import { Logger } from './types/logger';
import { Factory } from './factory';
import { getDuplicates } from './utils/get-duplicates';
import { deepFreeze } from './utils/deep-freeze';
import { pickProperties } from './utils/pick-properties';
import { ControllerDecorator } from './decorators/controller';

/**
 * - creates `injectorPerMod` and `injectorPerReq`;
 * - settings routes.
 */
@Injectable()
export class ModuleFactory extends Factory {
  protected mod: Type<any>;
  protected moduleName: string;
  protected prefixPerApp: string;
  protected prefixPerMod: string;
  protected resolvedProvidersPerReq: ResolvedReflectiveProvider[];
  protected opts: ModuleMetadata;
  protected allExportedProvidersPerMod: Provider[] = [];
  protected allExportedProvidersPerReq: Provider[] = [];
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
  protected optsMap = new Map<Type<any>, ModuleMetadata>();
  protected injectorPerReqMap = new Map<Type<any>, ReflectiveInjector>();

  constructor(protected router: Router, protected injectorPerApp: ReflectiveInjector, protected log: Logger) {
    super();
  }

  /**
   * Called only by `@RootModule` before called `ModuleFactory#boostrap()`.
   *
   * @param globalProviders Contains providersPerApp for now.
   */
  importGlobalProviders(rootModule: Type<any>, globalProviders: ProvidersMetadata) {
    this.moduleName = this.getModuleName(rootModule);
    const moduleMetadata = this.getNormalizedMetadata(rootModule);
    this.opts = new ModuleMetadata();
    pickProperties(this.opts, moduleMetadata);
    this.globalProviders = globalProviders;
    this.importProviders(true, rootModule);
    this.checkProvidersCollisions();

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
    prefixPerApp: string,
    prefixPerMod: string,
    modOrObject: Type<any> | ModuleWithOptions<any>
  ) {
    this.globalProviders = globalProviders;
    this.prefixPerApp = prefixPerApp || '';
    this.prefixPerMod = prefixPerMod || '';
    const mod = this.getModule(modOrObject);
    this.mod = mod;
    this.moduleName = mod.name;
    const moduleMetadata = this.getNormalizedMetadata(modOrObject);
    this.quickCheckMetadata(moduleMetadata);
    this.opts = new ModuleMetadata();
    Object.assign(this.opts, moduleMetadata);
    this.importModules();
    this.mergeProviders(moduleMetadata);
    this.injectorPerMod = this.injectorPerApp.resolveAndCreateChild(this.opts.providersPerMod);
    this.injectorPerMod.resolveAndInstantiate(mod);
    this.initProvidersPerReq();
    this.checkRoutePath(this.prefixPerApp);
    this.checkRoutePath(this.prefixPerMod);
    const prefix = [this.prefixPerApp, this.prefixPerMod].filter((s) => s).join('/');
    this.opts.controllers.forEach((Ctrl) => this.setRoutes(prefix, Ctrl));
    return { optsMap: this.optsMap.set(mod, this.opts), injectorPerReqMap: this.injectorPerReqMap };
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
      !moduleMetadata.providersPerMod.filter(isExportableProvider).length &&
      !moduleMetadata.providersPerReq.filter(isExportableProvider).length
    ) {
      const msg =
        `Importing ${this.moduleName} failed: this module should have "providersPerApp"` +
        ` or some controllers, or "exports" array with elements,` +
        ` or elements with "isExport" property in "providersPerMod" or "providersPerReq" arrays.`;
      throw new Error(msg);
    }
  }

  /**
   * Collects and normalizes module metadata.
   */
  protected getNormalizedMetadata(mod: Type<any> | ModuleWithOptions<any>) {
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

    type FlattenedImports = Type<any> | ModuleWithOptions<any> | ImportsWithPrefixDecorator;
    metadata.imports = flatten<FlattenedImports>(modMetadata.imports).map<ImportsWithPrefix>((imp) => {
      if (isImportsWithPrefix(imp)) {
        return {
          prefix: imp.prefix,
          module: resolveForwardRef(imp.module),
        };
      }
      return {
        prefix: '',
        module: resolveForwardRef(imp),
      };
    });
    metadata.exports = flatten(modMetadata.exports).map(resolveForwardRef);
    metadata.providersPerApp = flatten(modMetadata.providersPerApp);
    metadata.providersPerMod = flatten(modMetadata.providersPerMod);
    metadata.providersPerReq = flatten(modMetadata.providersPerReq);
    metadata.controllers = mergeArrays(metadata.controllers, modMetadata.controllers);

    return metadata;
  }

  /**
   * Init providers per the request.
   */
  protected initProvidersPerReq() {
    this.resolvedProvidersPerReq = ReflectiveInjector.resolve(this.opts.providersPerReq);
    const injectorPerReq = this.injectorPerMod.createChildFromResolved(this.resolvedProvidersPerReq);
    this.injectorPerReqMap.set(this.mod, injectorPerReq);
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
      this.importProviders(true, imp.module);
      const prefixPerMod = [this.prefixPerMod, imp.prefix].filter((s) => s).join('/');
      const mod = imp.module;
      const moduleFactory = this.injectorPerApp.resolveAndInstantiate(ModuleFactory) as ModuleFactory;
      const { optsMap } = moduleFactory.bootstrap(this.globalProviders, this.prefixPerApp, prefixPerMod, mod);
      this.optsMap = new Map([...this.optsMap, ...optsMap]);
    }
    this.checkProvidersCollisions();
  }

  /**
   * @param modOrObject Module from where exports providers.
   * @param desiredProvider Normalized provider.
   */
  protected importProviders(
    isStarter: boolean,
    modOrObject: Type<any> | ModuleWithOptions<any>,
    desiredProvider?: NormalizedProvider
  ) {
    const { exports: exp, imports, providersPerMod, providersPerReq } = this.getNormalizedMetadata(modOrObject);
    const moduleName = this.getModuleName(modOrObject);

    for (const moduleOrProvider of exp) {
      const moduleMetadata = this.getRawModuleMetadata(moduleOrProvider as ModuleType);
      if (moduleMetadata) {
        const reexportedModuleOrObject = moduleOrProvider as ModuleType | ModuleWithOptions<any>;
        this.importProviders(false, reexportedModuleOrObject, desiredProvider);
      } else {
        const provider = moduleOrProvider as Provider;
        const normProvider = normalizeProviders([provider])[0];
        const providerName = normProvider.provide.name || normProvider.provide;
        if (desiredProvider && desiredProvider.provide !== normProvider.provide) {
          continue;
        }
        let foundProvider = this.findAndSetProvider(
          moduleName,
          provider,
          normProvider,
          providersPerMod,
          providersPerReq
        );
        if (!foundProvider) {
          for (const imp of imports) {
            foundProvider = this.importProviders(false, imp.module, normProvider);
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

        if (desiredProvider) {
          return true;
        }
      }
    }

    if (desiredProvider) {
      return;
    }

    const exportableProvidersPerMod = providersPerMod.filter(isExportableProvider);
    const exportableProvidersPerReq = providersPerReq.filter(isExportableProvider);
    let perMod: Provider[] = [...this.exportedProvidersPerMod, ...exportableProvidersPerMod];
    let perReq: Provider[] = [...this.exportedProvidersPerReq, ...exportableProvidersPerReq];

    if (!isStarter) {
      /**
       * Removed duplicates only during exporting providers from the whole module.
       */
      perMod = this.getUniqProviders(perMod);
      perReq = this.getUniqProviders(perReq);
    }

    this.allExportedProvidersPerMod.push(...perMod);
    this.allExportedProvidersPerReq.push(...perReq);

    this.exportedProvidersPerMod = [];
    this.exportedProvidersPerReq = [];
  }

  protected findAndSetProvider(
    moduleName: string,
    provider: Provider,
    normProvider: ExportableProvider,
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
      const { provide: token, isExport } = normProvider;
      const providerName = token.name || token;

      const hasProvider = normProviders.some((p) => p.provide === token);

      if (hasProvider && isExport) {
        const msg =
          `Exporting providers failed: in ${moduleName} found conflict with "${providerName}".` +
          ` This provider must be removed from the "exports" array` +
          ` or the "isExport" property must be removed from it.`;
        throw new Error(msg);
      }
      return hasProvider;
    }
  }

  protected checkProvidersCollisions() {
    const tokensPerApp = normalizeProviders(this.globalProviders.providersPerApp).map((np) => np.provide);

    const declaredTokensPerMod = normalizeProviders(this.opts.providersPerMod).map((np) => np.provide);
    const exportedNormalizedPerMod = normalizeProviders(this.allExportedProvidersPerMod);
    const exportedTokensPerMod = exportedNormalizedPerMod.map((np) => np.provide);
    const multiTokensPerMod = exportedNormalizedPerMod.filter((np) => np.multi).map((np) => np.provide);
    let duplExpPerMod = getDuplicates(exportedTokensPerMod).filter(
      (d) => !declaredTokensPerMod.includes(d) && !multiTokensPerMod.includes(d)
    );
    duplExpPerMod = this.getTokensCollisions(duplExpPerMod, this.allExportedProvidersPerMod);
    const tokensPerMod = [...declaredTokensPerMod, ...exportedTokensPerMod];

    const declaredTokensPerReq = normalizeProviders(this.opts.providersPerReq).map((np) => np.provide);
    const exportedNormalizedPerReq = normalizeProviders(this.allExportedProvidersPerReq);
    const exportedTokensPerReq = exportedNormalizedPerReq.map((np) => np.provide);
    const multiTokensPerReq = exportedNormalizedPerReq.filter((np) => np.multi).map((np) => np.provide);
    let duplExpPerReq = getDuplicates(exportedTokensPerReq).filter(
      (d) => !declaredTokensPerReq.includes(d) && !multiTokensPerReq.includes(d)
    );
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

    const collisions = [...duplExpPerMod, ...duplExpPerReq, ...mixPerApp, ...mixPerModOrReq];
    if (collisions.length) {
      this.throwProvidersCollisionError(this.moduleName, collisions);
    }
  }

  protected setRoutes(prefix: string, Ctrl: TypeProvider) {
    const controllerMetadata = deepFreeze(reflector.annotations(Ctrl).find(isController));
    if (!controllerMetadata) {
      throw new Error(`Setting routes failed: class "${Ctrl.name}" does not have the "@Controller()" decorator`);
    }
    const propMetadata = reflector.propMetadata(Ctrl) as RouteDecoratorMetadata;

    for (const prop in propMetadata) {
      const routes = propMetadata[prop].filter(isRoute);
      for (const route of routes) {
        this.checkRoutePath(route.path);
        const resolvedProvidersPerReq = this.getResolvedProvidersPerReq(route, Ctrl, prop, controllerMetadata);
        const injectorPerReq = this.injectorPerMod.createChildFromResolved(resolvedProvidersPerReq);
        this.injectorPerReqMap.set(this.mod, injectorPerReq);
        this.setRoute(prefix, route, resolvedProvidersPerReq, Ctrl, prop, injectorPerReq);
      }
    }
  }

  protected getResolvedProvidersPerReq(
    route: RouteMetadata,
    Ctrl: TypeProvider,
    prop: string,
    controllerMetadata: ControllerDecorator
  ) {
    const guards = route.guards.map((item) => {
      if (Array.isArray(item)) {
        return item[0];
      } else {
        return item;
      }
    });

    for (const Guard of guards) {
      const type = typeof Guard?.prototype.canActivate;
      if (type != 'function') {
        throw new TypeError(
          `${this.moduleName} --> ${Ctrl.name} --> ${prop}(): Guard.prototype.canActivate must be a function, got: ${type}`
        );
      }
    }

    this.unshiftProvidersPerReq(Ctrl, guards);
    let resolvedProvidersPerReq: ResolvedReflectiveProvider[] = this.resolvedProvidersPerReq;
    const { providersPerReq } = controllerMetadata;
    if (providersPerReq) {
      resolvedProvidersPerReq = ReflectiveInjector.resolve([...this.opts.providersPerReq, ...providersPerReq]);
    }

    return resolvedProvidersPerReq;
  }

  /**
   * Compiles the path for the controller given the prefix.
   *
   * @todo Give this method the ability to override it via DI.
   */
  protected getPath(prefix: string, route: RouteMetadata) {
    const prefixLastPart = prefix?.split('/').slice(-1)[0];
    if (prefixLastPart?.charAt(0) == ':') {
      const reducedPrefix = prefix?.split('/').slice(0, -1).join('/');
      return [reducedPrefix, route.path].filter((s) => s).join('/');
    } else {
      return [prefix, route.path].filter((s) => s).join('/');
    }
  }

  /**
   * @todo Give this method the ability to override it via DI.
   */
  protected setRoute(
    prefix: string,
    route: RouteMetadata,
    resolvedProvidersPerReq: ResolvedReflectiveProvider[],
    Ctrl: TypeProvider,
    prop: string,
    injectorPerReq: ReflectiveInjector
  ) {
    const bodyParserConfig = injectorPerReq.get(BodyParserConfig) as BodyParserConfig;
    const parseBody = bodyParserConfig.acceptMethods.includes(route.httpMethod);
    const path = this.getPath(prefix, route);

    const guardItems = route.guards.map((item) => {
      if (Array.isArray(item)) {
        return { guard: item[0], params: item.slice(1) } as GuardItems;
      } else {
        return { guard: item } as GuardItems;
      }
    });

    this.router.on(route.httpMethod, `/${path}`, () => ({
      injector: this.injectorPerMod,
      providers: resolvedProvidersPerReq,
      controller: Ctrl,
      method: prop,
      parseBody,
      guardItems,
    }));

    this.log.trace({
      httpMethod: route.httpMethod,
      path,
      handler: `${Ctrl.name} -> ${prop}()`,
    });
  }

  protected checkRoutePath(path: string) {
    if (path.charAt(0) == '/') {
      throw new Error(
        `Invalid configuration of route '${path}' (in '${this.moduleName}'): path cannot start with a slash`
      );
    }
  }
}
