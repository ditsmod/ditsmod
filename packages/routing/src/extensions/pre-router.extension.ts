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
  MetadataPerMod2,
  Extension,
  HttpMethod,
  RouteMeta,
  RouteHandler,
  Router,
  getModule,
  Provider,
  InterceptorWithGuards,
  RequestContext,
  ControllerMetadata2,
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
} from '@ditsmod/core';

import { PreparedRouteMeta, ROUTES_EXTENSIONS } from '../types.js';
import { RoutingErrorMediator } from '../router-error-mediator.js';

@injectable()
export class PreRouterExtension implements Extension<void> {
  protected inited: boolean;

  constructor(
    protected perAppService: PerAppService,
    protected router: Router,
    protected extensionsManager: ExtensionsManager,
    protected log: SystemLogMediator,
    protected extensionsContext: ExtensionsContext,
    protected errorMediator: RoutingErrorMediator
  ) {}

  async init() {
    if (this.inited) {
      return;
    }

    const totalInitMeta = await this.extensionsManager.init(ROUTES_EXTENSIONS);
    const preparedRouteMeta = this.prepareRoutesMeta(totalInitMeta.groupInitMeta);
    this.setRoutes(totalInitMeta, preparedRouteMeta);
    this.inited = true;
  }

  protected prepareRoutesMeta(groupInitMeta: ExtensionInitMeta<MetadataPerMod2>[]) {
    const preparedRouteMeta: PreparedRouteMeta[] = [];
    const injectorPerApp = this.perAppService.reinitInjector([{ token: Router, useValue: this.router }]);

    groupInitMeta.forEach((initMeta) => {
      const metadataPerMod2 = initMeta.payload;
      const { moduleName, aControllersMetadata2, providersPerMod } = metadataPerMod2;
      const mod = getModule(metadataPerMod2.module);

      const singletons = new Set<Class>();
      aControllersMetadata2.forEach((controllersMetadata2) => {
        if (controllersMetadata2.isSingleton) {
          singletons.add(controllersMetadata2.routeMeta.controller);
        }
      });
      const extendedProvidersPerMod = [mod, ...singletons, ...providersPerMod];
      const injectorPerMod = injectorPerApp.resolveAndCreateChild(extendedProvidersPerMod, 'injectorPerMod');
      injectorPerMod.get(mod); // Call module constructor.

      aControllersMetadata2.forEach((controllersMetadata2) => {
        let handle: RouteHandler;
        if (controllersMetadata2.isSingleton) {
          handle = this.getHandlerWithSingleton(metadataPerMod2, injectorPerMod, controllersMetadata2);
        } else {
          handle = this.getDefaultHandler(metadataPerMod2, injectorPerMod, controllersMetadata2);
        }

        preparedRouteMeta.push({
          moduleName,
          httpMethod: controllersMetadata2.httpMethod,
          path: controllersMetadata2.path,
          handle,
          countOfGuards: controllersMetadata2.routeMeta.resolvedGuards!.length,
        });
      });
    });

    return preparedRouteMeta;
  }

  protected getDefaultHandler(
    metadataPerMod2: MetadataPerMod2,
    injectorPerMod: Injector,
    controllersMetadata2: ControllerMetadata2,
  ) {
    const { httpMethod, path, providersPerRou, providersPerReq, routeMeta } = controllersMetadata2;
    const mergedPerRou = [...metadataPerMod2.providersPerRou, ...providersPerRou];
    const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedPerRou, 'injectorPerRou');

    const mergedPerReq: Provider[] = [];
    mergedPerReq.push({ token: HTTP_INTERCEPTORS, useToken: HttpFrontend as any, multi: true });
    if (controllersMetadata2.guards.length) {
      mergedPerReq.push(InterceptorWithGuards);
      mergedPerReq.push({ token: HTTP_INTERCEPTORS, useToken: InterceptorWithGuards, multi: true });
    }
    mergedPerReq.push(...metadataPerMod2.providersPerReq, ...providersPerReq);

    const resolvedPerReq = Injector.resolve(mergedPerReq);
    const resolvedPerRou = Injector.resolve(mergedPerRou);
    routeMeta.resolvedGuards = this.getResolvedGuards(controllersMetadata2.guards, resolvedPerReq);
    const injPerReq = injectorPerRou.createChildFromResolved(resolvedPerReq);
    const RequestContextClass = injPerReq.get(RequestContext) as typeof RequestContext;
    routeMeta.resolvedHandler = this.getResolvedHandler(routeMeta, resolvedPerReq);
    this.checkDeps(metadataPerMod2.moduleName, httpMethod, path, injPerReq, routeMeta);
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
    metadataPerMod2: MetadataPerMod2,
    injectorPerMod: Injector,
    controllersMetadata2: ControllerMetadata2,
  ) {
    const { httpMethod, path, providersPerRou, routeMeta } = controllersMetadata2;

    const mergedPerRou: Provider[] = [];
    mergedPerRou.push({ token: HTTP_INTERCEPTORS, useToken: HttpFrontend as any, multi: true });

    routeMeta.resolvedGuards = controllersMetadata2.guards.map((g) => {
      const resolvedGuard: ResolvedGuard = {
        guard: Injector.resolve([g.guard])[0],
        params: g.params,
      };
      return resolvedGuard;
    });

    if (routeMeta.resolvedGuards.length) {
      mergedPerRou.push(SingletonInterceptorWithGuards);
      mergedPerRou.push({ token: HTTP_INTERCEPTORS, useToken: SingletonInterceptorWithGuards, multi: true });
    }
    mergedPerRou.push(...metadataPerMod2.providersPerRou, ...providersPerRou);

    const resolvedPerRou = Injector.resolve(mergedPerRou);
    const injectorPerRou = injectorPerMod.createChildFromResolved(resolvedPerRou, 'injectorPerRou');
    this.checkDeps(metadataPerMod2.moduleName, httpMethod, path, injectorPerRou, routeMeta);
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

  protected setRoutes(totalInitMeta: TotalInitMeta<MetadataPerMod2>, preparedRouteMeta: PreparedRouteMeta[]) {
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

  protected checkPresenceOfRoutesInApplication(totalInitMetaPerApp: TotalInitMetaPerApp<MetadataPerMod2>[]) {
    return totalInitMetaPerApp.reduce((prev1, curr1) => {
      return (
        prev1 ||
        curr1.groupInitMeta.reduce(
          (prev2, curr2) => prev2 || Boolean(curr2.payload.aControllersMetadata2.length),
          false,
        )
      );
    }, false);
  }
}
