import {
  A_PATH_PARAMS,
  HTTP_INTERCEPTORS,
  NODE_REQ,
  NODE_RES,
  QUERY_STRING,
  Injector,
  KeyRegistry,
  fromSelf,
  injectable,
  DepsChecker,
  SystemLogMediator,
  ChainMaker,
  ExtensionsContext,
  ExtensionsManager,
  HttpErrorHandler,
  PerAppService,
  HttpBackend,
  HttpFrontend,
  Extension,
  HttpMethod,
  RouteMeta,
  RouteHandler,
  Router,
  getModule,
  Provider,
  InterceptorWithGuards,
  RequestContext,
  ControllerMetadata,
  DefaultSingletonChainMaker,
  SingletonInterceptorWithGuards,
  Class,
  ExtensionInitMeta,
  TotalInitMeta,
  TotalInitMetaPerApp,
  CTX_DATA,
  FactoryProvider,
  ResolvedGuard,
  ResolvedProvider,
  NormalizedGuard,
  GuardPerMod1,
  ModuleManager,
  ResolvedGuardPerMod,
} from '@ditsmod/core';

import { MetadataPerMod3, PreparedRouteMeta, ROUTES_EXTENSIONS } from '../types.js';
import { RoutingErrorMediator } from '../router-error-mediator.js';

@injectable()
export class PreRouterExtension implements Extension<void> {
  protected inited: boolean;
  protected totalInitMeta: TotalInitMeta<MetadataPerMod3>;
  protected injectorPerMod: Injector;
  protected injectorPerApp: Injector;

  constructor(
    protected perAppService: PerAppService,
    protected router: Router,
    protected extensionsManager: ExtensionsManager,
    protected moduleManager: ModuleManager,
    protected log: SystemLogMediator,
    protected extensionsContext: ExtensionsContext,
    protected errorMediator: RoutingErrorMediator,
  ) {}

  async stage1() {
    if (this.inited) {
      return;
    }

    this.totalInitMeta = await this.extensionsManager.stage1(ROUTES_EXTENSIONS);
    this.injectorPerApp = this.perAppService.reinitInjector([{ token: Router, useValue: this.router }]);
    this.inited = true;
  }

  async stage2() {
    this.injectorPerMod = this.initModuleAndGetInjectorPerMod(this.injectorPerApp, this.totalInitMeta.groupInitMeta);
    const meta = this.getMeta(this.totalInitMeta.groupInitMeta);
    this.moduleManager.setInjectorPerMod(meta.module, this.injectorPerMod);
  }

  async stage3() {
    const preparedRouteMeta = this.prepareRoutesMeta(this.totalInitMeta.groupInitMeta);
    this.setRoutes(this.totalInitMeta, preparedRouteMeta);
  }

  protected getMeta(groupInitMeta: ExtensionInitMeta<MetadataPerMod3>[]) {
    // Since each extension received the same `meta` array and not a copy of it,
    // we can take `meta` from any element in the `groupInitMeta` array.
    return groupInitMeta.at(0)!.payload.meta;
  }

  protected prepareRoutesMeta(groupInitMeta: ExtensionInitMeta<MetadataPerMod3>[]) {
    const preparedRouteMeta: PreparedRouteMeta[] = [];

    groupInitMeta.forEach((initMeta) => {
      if (!initMeta.payload.aControllerMetadata.length) {
        // No routes from this extension (initMeta.extension.constructor.name).
        return;
      }
      const metadataPerMod3 = initMeta.payload;

      const { aControllerMetadata, guardsPerMod1 } = metadataPerMod3;

      aControllerMetadata.forEach((controllerMetadata) => {
        let handle: RouteHandler;
        if (controllerMetadata.singletonPerScope == 'module') {
          handle = this.getHandlerWithSingleton(metadataPerMod3, this.injectorPerMod, controllerMetadata);
        } else {
          handle = this.getDefaultHandler(metadataPerMod3, this.injectorPerMod, controllerMetadata);
        }

        const countOfGuards = controllerMetadata.routeMeta.resolvedGuards!.length + guardsPerMod1.length;

        preparedRouteMeta.push({
          moduleName: metadataPerMod3.meta.name,
          httpMethod: controllerMetadata.httpMethod,
          path: controllerMetadata.path,
          handle,
          countOfGuards,
        });
      });
    });

    return preparedRouteMeta;
  }

  protected initModuleAndGetInjectorPerMod(
    injectorPerApp: Injector,
    groupInitMeta: ExtensionInitMeta<MetadataPerMod3>[],
  ): Injector {
    const singletons = new Set<Class>();

    groupInitMeta.forEach((initMeta) => {
      initMeta.payload.aControllerMetadata.forEach((controllerMetadata) => {
        if (controllerMetadata.singletonPerScope == 'module') {
          singletons.add(controllerMetadata.routeMeta.controller);
        }
      });
    });

    const meta = this.getMeta(groupInitMeta);
    const mod = getModule(meta.module);
    const extendedProvidersPerMod = [mod, ...singletons, ...meta.providersPerMod];
    const injectorPerMod = injectorPerApp.resolveAndCreateChild(extendedProvidersPerMod, 'injectorPerMod');
    injectorPerMod.get(mod); // Call module constructor.
    return injectorPerMod;
  }

  protected getDefaultHandler(
    metadataPerMod3: MetadataPerMod3,
    injectorPerMod: Injector,
    controllerMetadata: ControllerMetadata,
  ) {
    const { httpMethod, path, providersPerRou, providersPerReq, routeMeta } = controllerMetadata;
    const mergedPerRou = [...metadataPerMod3.meta.providersPerRou, ...providersPerRou];
    const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedPerRou, 'injectorPerRou');

    const mergedPerReq: Provider[] = [];
    mergedPerReq.push({ token: HTTP_INTERCEPTORS, useToken: HttpFrontend as any, multi: true });
    if (metadataPerMod3.guardsPerMod1.length || controllerMetadata.guards.length) {
      mergedPerReq.push(InterceptorWithGuards);
      mergedPerReq.push({ token: HTTP_INTERCEPTORS, useToken: InterceptorWithGuards, multi: true });
    }
    mergedPerReq.push(...metadataPerMod3.meta.providersPerReq, ...providersPerReq);

    const resolvedPerReq = Injector.resolve(mergedPerReq);
    const resolvedPerRou = Injector.resolve(mergedPerRou);
    routeMeta.resolvedGuards = this.getResolvedGuards(controllerMetadata.guards, resolvedPerReq);
    routeMeta.resolvedGuards = this.getResolvedGuards(controllerMetadata.guards, resolvedPerReq);
    routeMeta.resolvedGuardsPerMod = this.getResolvedGuardsPerMod(metadataPerMod3.guardsPerMod1, true);
    const injPerReq = injectorPerRou.createChildFromResolved(resolvedPerReq);
    const RequestContextClass = injPerReq.get(RequestContext) as typeof RequestContext;
    routeMeta.resolvedHandler = this.getResolvedHandler(routeMeta, resolvedPerReq);
    this.checkDeps(metadataPerMod3.meta.name, httpMethod, path, injPerReq, routeMeta);
    const resolvedChainMaker = resolvedPerReq.find((rp) => rp.dualKey.token === ChainMaker)!;
    const resolvedErrHandler = resolvedPerReq
      .concat(resolvedPerRou)
      .find((rp) => rp.dualKey.token === HttpErrorHandler)!;
    const RegistryPerReq = Injector.prepareRegistry(resolvedPerReq);
    const nodeReqId = KeyRegistry.get(NODE_REQ).id;
    const nodeResId = KeyRegistry.get(NODE_RES).id;
    const pathParamsId = KeyRegistry.get(A_PATH_PARAMS).id;
    const queryStringId = KeyRegistry.get(QUERY_STRING).id;

    return (async (nodeReq, nodeRes, aPathParams, queryString) => {
      const injector = new Injector(RegistryPerReq, injectorPerRou, 'injectorPerReq');

      const ctx = new RequestContextClass(nodeReq, nodeRes, aPathParams, queryString);

      await injector
        .setById(nodeReqId, nodeReq)
        .setById(nodeResId, nodeRes)
        .setById(pathParamsId, aPathParams)
        .setById(queryStringId, queryString || '')
        .instantiateResolved<ChainMaker>(resolvedChainMaker)
        .makeChain(ctx)
        .handle() // First HTTP handler in the chain of HTTP interceptors.
        .catch((err) => {
          const errorHandler = injector.instantiateResolved(resolvedErrHandler) as HttpErrorHandler;
          return errorHandler.handleError(err, ctx);
        })
        .finally(() => injector.clear());
    }) as RouteHandler;
  }

  protected getResolvedGuardsPerMod(guards: GuardPerMod1[], perReq?: boolean) {
    return guards.map((g) => {
      const resolvedPerMod = Injector.resolve(g.meta.providersPerMod);
      const resolvedPerRou = Injector.resolve(g.meta.providersPerRou);
      const resolvedPerReq = Injector.resolve(g.meta.providersPerReq);
      const resolvedProviders = perReq
        ? resolvedPerReq.concat(resolvedPerRou, resolvedPerMod)
        : resolvedPerRou.concat(resolvedPerMod);

      const guard = resolvedProviders.find((rp) => rp.dualKey.token === g.guard);

      if (!guard) {
        const scopes = ['providersPerRou', 'providersPerMod'];
        if (perReq) {
          scopes.push('providersPerReq');
        }
        const scopeNames = scopes.join(', ');
        const msg = `Resolving guard for ${g.meta.name} failed: ${g.guard.name} not found in ${scopeNames}.`;
        throw new Error(msg);
      }

      const injectorPerMod = this.moduleManager.getInjectorPerMod(g.meta.module);
      const injectorPerRou = injectorPerMod.createChildFromResolved(resolvedPerRou);

      const resolvedGuard: ResolvedGuardPerMod = {
        guard,
        injectorPerRou,
        resolvedPerReq,
        params: g.params,
      };

      return resolvedGuard;
    });
  }

  protected getResolvedGuards(guards: NormalizedGuard[], resolvedPerReq: ResolvedProvider[]) {
    return guards.map((g) => {
      const defaultResolvedGuard = Injector.resolve([g.guard])[0];

      const resolvedGuard: ResolvedGuard = {
        guard: resolvedPerReq.concat([defaultResolvedGuard]).find((rp) => rp.dualKey.token === g.guard)!,
        params: g.params,
      };

      return resolvedGuard;
    });
  }

  protected getResolvedHandler(routeMeta: RouteMeta, resolvedPerReq: ResolvedProvider[]) {
    const { controller, methodName } = routeMeta;
    const factoryProvider: FactoryProvider = { useFactory: [controller, controller.prototype[methodName]] };
    const resolvedHandler = Injector.resolve([factoryProvider])[0];
    return resolvedPerReq.concat([resolvedHandler]).find((rp) => rp.dualKey.token === controller.prototype[methodName]);
  }

  protected getHandlerWithSingleton(
    metadataPerMod3: MetadataPerMod3,
    injectorPerMod: Injector,
    controllerMetadata: ControllerMetadata,
  ) {
    const { httpMethod, path, providersPerRou, routeMeta } = controllerMetadata;

    const mergedPerRou: Provider[] = [];
    mergedPerRou.push({ token: HTTP_INTERCEPTORS, useToken: HttpFrontend as any, multi: true });

    routeMeta.resolvedGuardsPerMod = this.getResolvedGuardsPerMod(metadataPerMod3.guardsPerMod1);
    routeMeta.resolvedGuards = controllerMetadata.guards.map((g) => {
      const resolvedGuard: ResolvedGuard = {
        guard: Injector.resolve([g.guard])[0],
        params: g.params,
      };
      return resolvedGuard;
    });

    if (routeMeta.resolvedGuards.length || metadataPerMod3.guardsPerMod1.length) {
      mergedPerRou.push(SingletonInterceptorWithGuards);
      mergedPerRou.push({ token: HTTP_INTERCEPTORS, useToken: SingletonInterceptorWithGuards, multi: true });
    }
    mergedPerRou.push(...metadataPerMod3.meta.providersPerRou, ...providersPerRou);

    const resolvedPerRou = Injector.resolve(mergedPerRou);
    const injectorPerRou = injectorPerMod.createChildFromResolved(resolvedPerRou, 'injectorPerRou');
    this.checkDeps(metadataPerMod3.meta.name, httpMethod, path, injectorPerRou, routeMeta);
    const resolvedChainMaker = resolvedPerRou.find((rp) => rp.dualKey.token === ChainMaker)!;
    const resolvedErrHandler = resolvedPerRou.find((rp) => rp.dualKey.token === HttpErrorHandler)!;
    const chainMaker = injectorPerRou.instantiateResolved<DefaultSingletonChainMaker>(resolvedChainMaker);
    const controllerInstance = injectorPerMod.get(routeMeta.controller);
    routeMeta.routeHandler = controllerInstance[routeMeta.methodName].bind(controllerInstance);
    const errorHandler = injectorPerRou.instantiateResolved(resolvedErrHandler) as HttpErrorHandler;
    const RequestContextClass = injectorPerRou.get(RequestContext) as typeof RequestContext;

    return (async (nodeReq, nodeRes, aPathParams, queryString) => {
      const ctx = new RequestContextClass(nodeReq, nodeRes, aPathParams, queryString);
      await chainMaker
        .makeChain(ctx)
        .handle() // First HTTP handler in the chain of HTTP interceptors.
        .catch((err) => {
          return errorHandler.handleError(err, ctx);
        });
    }) as RouteHandler;
  }

  /**
   * Used as "sandbox" to test resolvable of controllers, guards and HTTP interceptors.
   */
  protected checkDeps(moduleName: string, httpMethod: HttpMethod, path: string, inj: Injector, routeMeta: RouteMeta) {
    try {
      const ignoreDeps: any[] = [HTTP_INTERCEPTORS, CTX_DATA];
      DepsChecker.check(inj, HttpErrorHandler, undefined, ignoreDeps);
      DepsChecker.check(inj, ChainMaker, undefined, ignoreDeps);
      DepsChecker.check(inj, HttpFrontend, undefined, ignoreDeps);
      DepsChecker.check(inj, SystemLogMediator, undefined, ignoreDeps);
      routeMeta.resolvedGuards!.forEach((item) => DepsChecker.checkForResolved(inj, item.guard, ignoreDeps));
      DepsChecker.check(inj, HttpBackend, undefined, ignoreDeps);
      if (routeMeta?.resolvedHandler) {
        DepsChecker.checkForResolved(inj, routeMeta.resolvedHandler, ignoreDeps);
      }
      DepsChecker.check(inj, HTTP_INTERCEPTORS, fromSelf, ignoreDeps);
    } catch (cause: any) {
      this.errorMediator.checkingDepsInSandboxFailed(moduleName, cause);
    }
  }

  protected setRoutes(totalInitMeta: TotalInitMeta<MetadataPerMod3>, preparedRouteMeta: PreparedRouteMeta[]) {
    if (!totalInitMeta.delay) {
      const appHasRoutes = this.checkPresenceOfRoutesInApplication(totalInitMeta.totalInitMetaPerApp);
      if (!appHasRoutes) {
        this.log.noRoutes(this);
        return;
      }
    }

    preparedRouteMeta.forEach((data) => {
      const { moduleName, path, httpMethod, handle, countOfGuards } = data;

      if (path?.charAt(0) == '/') {
        let msg = `Invalid configuration of route '${path}'`;
        msg += ` (in ${moduleName}): path cannot start with a slash`;
        throw new Error(msg);
      }

      this.log.printRoute(this, httpMethod, path, countOfGuards);
      if (httpMethod == 'ALL') {
        this.router.all(`/${path}`, handle);
      } else {
        this.router.on(httpMethod, `/${path}`, handle);
      }
    });
  }

  protected checkPresenceOfRoutesInApplication(totalInitMetaPerApp: TotalInitMetaPerApp<MetadataPerMod3>[]) {
    return totalInitMetaPerApp.reduce((prev1, curr1) => {
      return (
        prev1 ||
        curr1.groupInitMeta.reduce((prev2, curr2) => prev2 || Boolean(curr2.payload.aControllerMetadata.length), false)
      );
    }, false);
  }
}
