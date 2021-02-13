import { Provider, ReflectiveInjector, reflector, ResolvedReflectiveProvider, TypeProvider } from '@ts-stack/di';

import { ControllerDecorator } from './decorators/controller';
import { ModuleMetadata } from './decorators/module';
import { RouteDecoratorMetadata, RouteMetadata } from './decorators/route';
import { Logger } from './types/logger';
import { GuardItems, Router } from './types/router';
import { BodyParserConfig } from './types/types';
import { isController, isRoute } from './utils/type-guards';

export class PreRouting {
  protected moduleName: string;
  protected injectorPerApp: ReflectiveInjector;
  protected injectorPerMod: ReflectiveInjector;
  protected opts: ModuleMetadata;
  protected resolvedProvidersPerReq: ResolvedReflectiveProvider[];
  protected log: Logger;
  protected mod: TypeProvider;
  protected router: Router;
  protected injectorPerReqMap: Map<TypeProvider, ReflectiveInjector>;

  prepareRoutes(
    moduleName: string,
    injectorPerApp: ReflectiveInjector,
    injectorPerMod: ReflectiveInjector,
    opts: ModuleMetadata,
    resolvedProvidersPerReq: ResolvedReflectiveProvider[],
    log: Logger,
    mod: TypeProvider,
    router: Router,
    injectorPerReqMap: Map<TypeProvider, ReflectiveInjector>,
    prefixPerApp: string,
    prefixPerMod: string
  ) {
    this.moduleName = moduleName;
    this.injectorPerApp = injectorPerApp;
    this.injectorPerMod = injectorPerMod;
    this.opts = opts;
    this.resolvedProvidersPerReq = resolvedProvidersPerReq;
    this.log = log;
    this.mod = mod;
    this.router = router;
    this.injectorPerReqMap = injectorPerReqMap;

    this.checkRoutePath(prefixPerApp);
    this.checkRoutePath(prefixPerMod);
    const prefix = [prefixPerApp, prefixPerMod].filter((s) => s).join('/');
    this.initProvidersPerReq(); // Init to use providers in services
    this.opts.controllers.forEach((Ctrl) => this.setRoutes(prefix, Ctrl));
  }

  protected setRoutes(prefix: string, Ctrl: TypeProvider) {
    const controllerMetadata = reflector.annotations(Ctrl).find(isController);
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

    const logObj = {
      module: this.moduleName,
      httpMethod: route.httpMethod,
      path,
      guards: guardItems,
      handler: `${Ctrl.name}.${prop}()`,
    };

    if (!logObj.guards.length) {
      delete logObj.guards;
    }

    this.log.trace(logObj);
  }

  protected checkRoutePath(path: string) {
    if (path.charAt(0) == '/') {
      throw new Error(
        `Invalid configuration of route '${path}' (in '${this.moduleName}'): path cannot start with a slash`
      );
    }
  }
}
