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
  PreparedRouteMeta,
  RouteMeta,
  RouteHandler,
  Router,
  getModule,
  ServiceProvider,
  InterceptorWithGuards,
  RequestContext,
  ControllerMetadata2,
  SingletonChainMaker,
  SingletonHttpErrorHandler,
  SingletonInterceptorWithGuards,
  Class,
} from '@ditsmod/core';

import { ROUTES_EXTENSIONS } from '../types.js';

@injectable()
export class PreRouterExtension implements Extension<void> {
  protected inited: boolean;
  protected isLastExtensionCall: boolean;

  constructor(
    protected perAppService: PerAppService,
    protected router: Router,
    protected extensionsManager: ExtensionsManager,
    protected log: SystemLogMediator,
    protected extensionsContext: ExtensionsContext,
  ) {}

  async init(isLastExtensionCall: boolean) {
    if (this.inited) {
      return;
    }

    this.isLastExtensionCall = isLastExtensionCall;
    const aMetadataPerMod2 = await this.extensionsManager.init(ROUTES_EXTENSIONS, true, PreRouterExtension);
    if (aMetadataPerMod2 === false) {
      this.inited = true;
      return;
    }
    const preparedRouteMeta = this.prepareRoutesMeta(aMetadataPerMod2);
    this.setRoutes(preparedRouteMeta);
    this.inited = true;
  }

  protected prepareRoutesMeta(aMetadataPerMod2: MetadataPerMod2[]) {
    const preparedRouteMeta: PreparedRouteMeta[] = [];
    this.perAppService.providers.push({ token: Router, useValue: this.router });
    const injectorPerApp = this.perAppService.reinitInjector();

    aMetadataPerMod2.forEach((metadataPerMod2) => {
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

    const mergedPerReq: ServiceProvider[] = [];
    mergedPerReq.push({ token: HTTP_INTERCEPTORS, useToken: HttpFrontend as any, multi: true });
    if (routeMeta.resolvedGuards.length) {
      mergedPerReq.push(InterceptorWithGuards);
      mergedPerReq.push({ token: HTTP_INTERCEPTORS, useToken: InterceptorWithGuards, multi: true });
    }
    mergedPerReq.push(...metadataPerMod2.providersPerReq, ...providersPerReq);

    const resolvedPerReq = Injector.resolve(mergedPerReq);
    const injPerReq = injectorPerRou.createChildFromResolved(resolvedPerReq);
    this.checkDeps(metadataPerMod2.moduleName, httpMethod, path, injPerReq, routeMeta);
    const resolvedChainMaker = resolvedPerReq.find((rp) => rp.dualKey.token === ChainMaker)!;
    const resolvedCtrlErrHandler = resolvedPerReq.find((rp) => rp.dualKey.token === HttpErrorHandler)!;
    const RegistryPerReq = Injector.prepareRegistry(resolvedPerReq);
    const nodeReqId = KeyRegistry.get(NODE_REQ).id;
    const nodeResId = KeyRegistry.get(NODE_RES).id;
    const pathParamsId = KeyRegistry.get(A_PATH_PARAMS).id;
    const queryStringId = KeyRegistry.get(QUERY_STRING).id;

    return (async (nodeReq, nodeRes, aPathParams, queryString) => {
      const injector = new Injector(RegistryPerReq, injectorPerRou, 'injectorPerReq');

      const ctx: RequestContext = {
        nodeReq,
        nodeRes,
        aPathParams,
        queryString,
      };
      await injector
        .setById(nodeReqId, nodeReq)
        .setById(nodeResId, nodeRes)
        .setById(pathParamsId, aPathParams)
        .setById(queryStringId, queryString || '')
        .instantiateResolved<ChainMaker>(resolvedChainMaker)
        .makeChain(ctx)
        .handle() // First HTTP handler in the chain of HTTP interceptors.
        .catch((err) => {
          const errorHandler = injector.instantiateResolved(resolvedCtrlErrHandler) as HttpErrorHandler;
          return errorHandler.handleError(err, ctx);
        })
        .finally(() => injector.clear());
    }) as RouteHandler;
  }

  protected getHandlerWithSingleton(
    metadataPerMod2: MetadataPerMod2,
    injectorPerMod: Injector,
    controllersMetadata2: ControllerMetadata2,
  ) {
    const { httpMethod, path, providersPerRou, routeMeta } = controllersMetadata2;

    const mergedPerRou: ServiceProvider[] = [];
    mergedPerRou.push({ token: HTTP_INTERCEPTORS, useToken: HttpFrontend as any, multi: true });
    if (routeMeta.resolvedGuards.length) {
      mergedPerRou.push(SingletonInterceptorWithGuards);
      mergedPerRou.push({ token: HTTP_INTERCEPTORS, useToken: SingletonInterceptorWithGuards, multi: true });
    }
    mergedPerRou.push(...metadataPerMod2.providersPerRou, ...providersPerRou);

    const resolvedPerRou = Injector.resolve(mergedPerRou);
    const injectorPerRou = injectorPerMod.createChildFromResolved(resolvedPerRou, 'injectorPerRou');
    this.checkDeps(metadataPerMod2.moduleName, httpMethod, path, injectorPerRou, routeMeta);
    const resolvedChainMaker = resolvedPerRou.find((rp) => rp.dualKey.token === ChainMaker)!;
    const resolvedCtrlErrHandler = resolvedPerRou.find((rp) => rp.dualKey.token === HttpErrorHandler)!;
    const chainMaker = injectorPerRou.instantiateResolved<SingletonChainMaker>(resolvedChainMaker);
    const controllerInstance = injectorPerMod.get(routeMeta.controller);
    routeMeta.routeHandler = controllerInstance[routeMeta.methodName].bind(controllerInstance);
    const errorHandler = injectorPerRou.instantiateResolved(resolvedCtrlErrHandler) as SingletonHttpErrorHandler;

    return (async (nodeReq, nodeRes, aPathParams, queryString) => {
      const ctx: RequestContext = {
        nodeReq,
        nodeRes,
        aPathParams,
        queryString,
      };
      await chainMaker
        .makeChain(ctx)
        .handle() // First HTTP handler in the chain of HTTP interceptors.
        .catch((err) => {
          return errorHandler.handleError(err, ctx);
        });
    }) as RouteHandler;
  }

  /**
   * Used as "sandbox" to test resolvable of controllers and HTTP interceptors.
   */
  protected checkDeps(moduleName: string, httpMethod: HttpMethod, path: string, inj: Injector, routeMeta: RouteMeta) {
    const ignoreDeps: any[] = [HTTP_INTERCEPTORS];
    DepsChecker.check(inj, HttpErrorHandler, undefined, ignoreDeps);
    DepsChecker.check(inj, ChainMaker, undefined, ignoreDeps);
    DepsChecker.check(inj, HttpFrontend, undefined, ignoreDeps);
    DepsChecker.check(inj, SystemLogMediator, undefined, ignoreDeps);
    routeMeta.resolvedGuards.forEach((item) => DepsChecker.checkForResolved(inj, item.guard, ignoreDeps));
    DepsChecker.check(inj, HttpBackend, undefined, ignoreDeps);
    if (routeMeta?.resolvedHandler) {
      DepsChecker.checkForResolved(inj, routeMeta.resolvedHandler, ignoreDeps);
    }
    DepsChecker.check(inj, HTTP_INTERCEPTORS, fromSelf, ignoreDeps);
  }

  protected setRoutes(preparedRouteMeta: PreparedRouteMeta[]) {
    this.extensionsContext.appHasRoutes = this.extensionsContext.appHasRoutes || !!preparedRouteMeta.length;
    if (this.isLastExtensionCall && !this.extensionsContext.appHasRoutes) {
      this.log.noRoutes(this);
      return;
    }

    preparedRouteMeta.forEach((data) => {
      const { moduleName, path, httpMethod, handle } = data;

      if (path?.charAt(0) == '/') {
        let msg = `Invalid configuration of route '${path}'`;
        msg += ` (in ${moduleName}): path cannot start with a slash`;
        throw new Error(msg);
      }

      this.log.printRoute(this, httpMethod, path);
      if (httpMethod == 'ALL') {
        this.router.all(`/${path}`, handle);
      } else {
        this.router.on(httpMethod, `/${path}`, handle);
      }
    });
  }
}
