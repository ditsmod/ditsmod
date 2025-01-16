import {
  Injector,
  KeyRegistry,
  fromSelf,
  injectable,
  DepsChecker,
  SystemLogMediator,
  ExtensionsContext,
  ExtensionsManager,
  PerAppService,
  Extension,
  Provider,
  Stage1ExtensionMeta,
  Stage1ExtensionMetaPerApp,
  CTX_DATA,
  FactoryProvider,
  ResolvedGuard,
  ResolvedProvider,
  ResolvedGuardPerMod,
  RequireProps,
  getToken,
  getProviderTarget,
  ModuleManager,
  HttpMethod,
  getDebugClassName,
} from '@ditsmod/core';

import { MetadataPerMod3, PreparedRouteMeta } from '../types/types.js';
import { A_PATH_PARAMS, HTTP_INTERCEPTORS, QUERY_STRING, RAW_REQ, RAW_RES } from '#types/constants.js';
import { RoutingErrorMediator } from '../services/router-error-mediator.js';
import { ControllerMetadata } from '../types/controller-metadata.js';
import { InterceptorWithGuardsPerRou } from '#interceptors/interceptor-with-guards-per-rou.js';
import { InterceptorWithGuards } from '#interceptors/interceptor-with-guards.js';
import { RouteMeta } from '../types/route-data.js';
import { ChainMaker } from '#interceptors/chain-maker.js';
import { DefaultHttpBackend } from '#interceptors/default-http-backend.js';
import { DefaultCtxHttpBackend } from '#interceptors/default-ctx-http-backend.js';
import { DefaultCtxChainMaker } from '#interceptors/default-ctx-chain-maker.js';
import { DefaultCtxHttpFrontend } from '#interceptors/default-ctx-http-frontend.js';
import { DefaultHttpFrontend } from '#interceptors/default-http-frontend.js';
import { HttpBackend, HttpFrontend } from '#interceptors/tokens-and-types.js';
import { routeChannel } from '../services/diagnostics-channel.js';
import { GuardPerMod1, NormalizedGuard } from '#interceptors/guard.js';
import { RouteHandler, Router } from '#services/router.js';
import { HttpErrorHandler } from '#services/http-error-handler.js';
import { RequestContext } from '#services/request-context.js';
import { RoutesExtension } from './routes.extension.js';

@injectable()
export class PreRouterExtension implements Extension<void> {
  protected stage1ExtensionMeta: Stage1ExtensionMeta<MetadataPerMod3>;
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
    this.stage1ExtensionMeta = await this.extensionsManager.stage1(RoutesExtension);
    this.injectorPerApp = this.perAppService.reinitInjector([{ token: Router, useValue: this.router }]);
    this.addDefaultProviders(this.stage1ExtensionMeta.groupData);
  }

  async stage2(injectorPerMod: Injector) {
    this.injectorPerMod = injectorPerMod;
  }

  async stage3() {
    const preparedRouteMeta = this.prepareRoutesMeta(this.stage1ExtensionMeta.groupData);
    this.setRoutes(this.stage1ExtensionMeta, preparedRouteMeta);
  }

  protected getMeta(aMetadataPerMod3: MetadataPerMod3[]) {
    // Since each extension received the same `meta` array and not a copy of it,
    // we can take `meta` from any element in the `groupData` array.
    return aMetadataPerMod3.at(0)!.meta;
  }

  protected addDefaultProviders(aMetadataPerMod3: MetadataPerMod3[]) {
    const meta = this.getMeta(aMetadataPerMod3);
    meta.providersPerReq.unshift(
      { token: HttpBackend, useClass: DefaultHttpBackend },
      { token: HttpFrontend, useClass: DefaultHttpFrontend },
      ChainMaker,
    );

    meta.providersPerRou.unshift(
      { token: HttpBackend, useClass: DefaultCtxHttpBackend },
      { token: ChainMaker, useClass: DefaultCtxChainMaker },
      { token: HttpFrontend, useClass: DefaultCtxHttpFrontend },
    );
  }

  protected prepareRoutesMeta(aMetadataPerMod3: MetadataPerMod3[]) {
    const preparedRouteMeta: PreparedRouteMeta[] = [];

    aMetadataPerMod3.forEach((metadataPerMod3) => {
      if (!metadataPerMod3.aControllerMetadata.length) {
        // No routes from this extension.
        return;
      }

      const { aControllerMetadata, guardsPerMod1 } = metadataPerMod3;

      aControllerMetadata.forEach((controllerMetadata) => {
        let handle: RouteHandler;
        if (controllerMetadata.scope == 'ctx') {
          handle = this.getHandlerPerMod(metadataPerMod3, this.injectorPerMod, controllerMetadata);
        } else {
          handle = this.getHandlerPerReq(metadataPerMod3, this.injectorPerMod, controllerMetadata);
        }

        const countOfGuards = controllerMetadata.routeMeta.resolvedGuards!.length + guardsPerMod1.length;

        preparedRouteMeta.push({
          moduleName: metadataPerMod3.meta.name,
          httpMethods: controllerMetadata.httpMethods,
          fullPath: controllerMetadata.fullPath,
          handle,
          countOfGuards,
        });
      });
    });

    return preparedRouteMeta;
  }

  protected getHandlerPerMod(
    metadataPerMod3: MetadataPerMod3,
    injectorPerMod: Injector,
    controllerMetadata: ControllerMetadata,
  ) {
    const { providersPerRou, routeMeta: baseRouteMeta, httpMethods, fullPath } = controllerMetadata;

    const routeMeta = baseRouteMeta as RequireProps<typeof baseRouteMeta, 'routeHandler'>;
    const mergedPerRou: Provider[] = [];
    mergedPerRou.push({ token: HTTP_INTERCEPTORS, useToken: HttpFrontend as any, multi: true });
    const controllerName = getDebugClassName(routeMeta.Controller);

    if (metadataPerMod3.guardsPerMod1.length || controllerMetadata.guards.length) {
      mergedPerRou.push(InterceptorWithGuardsPerRou);
      mergedPerRou.push({ token: HTTP_INTERCEPTORS, useToken: InterceptorWithGuardsPerRou, multi: true });
    }
    mergedPerRou.push(...metadataPerMod3.meta.providersPerRou, ...providersPerRou);

    const resolvedPerRou = Injector.resolve(mergedPerRou);
    routeMeta.resolvedGuards = this.getResolvedGuards(controllerMetadata.guards, resolvedPerRou);
    routeMeta.resolvedGuardsPerMod = this.getResolvedGuardsPerMod(
      metadataPerMod3.guardsPerMod1,
      controllerName,
      httpMethods,
      fullPath,
    );
    const injectorPerRou = injectorPerMod.createChildFromResolved(resolvedPerRou, 'Rou');
    this.checkDeps(injectorPerRou, routeMeta, controllerName, httpMethods, fullPath);
    const resolvedChainMaker = resolvedPerRou.find((rp) => rp.dualKey.token === ChainMaker)!;
    const resolvedErrHandler = resolvedPerRou.find((rp) => rp.dualKey.token === HttpErrorHandler)!;
    const chainMaker = injectorPerRou.instantiateResolved<DefaultCtxChainMaker>(resolvedChainMaker);
    const ctrl = injectorPerMod.get(routeMeta.Controller);
    const routeHandler = ctrl[routeMeta.methodName].bind(ctrl) as typeof routeMeta.routeHandler;
    routeMeta.routeHandler = routeHandler;
    const errorHandler = injectorPerRou.instantiateResolved(resolvedErrHandler) as HttpErrorHandler;
    const RequestContextClass = injectorPerRou.get(RequestContext) as typeof RequestContext;

    if (this.hasInterceptors(mergedPerRou)) {
      return (async (rawReq, rawRes, aPathParams, queryString) => {
        const ctx = new RequestContextClass(rawReq, rawRes, aPathParams, queryString, 'ctx');
        await chainMaker
          .makeChain(ctx)
          .handle() // First HTTP handler in the chain of HTTP interceptors.
          .catch((err) => {
            return errorHandler.handleError(err, ctx);
          });
      }) as RouteHandler;
    } else {
      return this.handleWithoutInterceptors(RequestContextClass, routeHandler, errorHandler);
    }
  }

  protected hasInterceptors(mergedPerRou: Provider[]) {
    const interceptors = mergedPerRou
      .filter((p) => {
        const token = getToken(p);
        return token === HTTP_INTERCEPTORS || token === HttpBackend;
      })
      .map(getProviderTarget);

    // The application has two default interceptors.
    return interceptors.length > 2;
  }

  protected handleWithoutInterceptors(
    RequestContextClass: typeof RequestContext,
    routeHandler: (ctx: RequestContext) => Promise<any>,
    errorHandler: HttpErrorHandler,
  ) {
    const interceptor = new DefaultCtxHttpFrontend();
    return (async (rawReq, rawRes, aPathParams, queryString) => {
      const ctx = new RequestContextClass(rawReq, rawRes, aPathParams, queryString, 'ctx') as RequestContext;
      try {
        interceptor.before(ctx).after(ctx, await routeHandler(ctx));
      } catch (err: any) {
        await errorHandler.handleError(err, ctx);
      }
    }) as RouteHandler;
  }

  protected getHandlerPerReq(
    metadataPerMod3: MetadataPerMod3,
    injectorPerMod: Injector,
    controllerMetadata: ControllerMetadata,
  ) {
    const { providersPerRou, providersPerReq, routeMeta, httpMethods: httpMethod, fullPath } = controllerMetadata;
    const mergedPerRou = [...metadataPerMod3.meta.providersPerRou, ...providersPerRou];
    const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedPerRou, 'Rou');

    const mergedPerReq: Provider[] = [];
    mergedPerReq.push({ token: HTTP_INTERCEPTORS, useToken: HttpFrontend as any, multi: true });
    if (metadataPerMod3.guardsPerMod1.length || controllerMetadata.guards.length) {
      mergedPerReq.push(InterceptorWithGuards);
      mergedPerReq.push({ token: HTTP_INTERCEPTORS, useToken: InterceptorWithGuards, multi: true });
    }
    mergedPerReq.push(...metadataPerMod3.meta.providersPerReq, ...providersPerReq);

    const resolvedPerReq = Injector.resolve(mergedPerReq);
    const resolvedPerRou = Injector.resolve(mergedPerRou);
    const controllerName = getDebugClassName(routeMeta.Controller);
    routeMeta.resolvedGuards = this.getResolvedGuards(controllerMetadata.guards, resolvedPerReq);
    routeMeta.resolvedGuardsPerMod = this.getResolvedGuardsPerMod(
      metadataPerMod3.guardsPerMod1,
      controllerName,
      httpMethod,
      fullPath,
      true,
    );
    const injPerReq = injectorPerRou.createChildFromResolved(resolvedPerReq, 'Req');
    const RequestContextClass = injPerReq.get(RequestContext) as typeof RequestContext;
    routeMeta.resolvedHandler = this.getResolvedHandler(routeMeta, resolvedPerReq);
    this.checkDeps(injPerReq, routeMeta, controllerName, httpMethod, fullPath);
    const resolvedChainMaker = resolvedPerReq.find((rp) => rp.dualKey.token === ChainMaker)!;
    const resolvedErrHandler = resolvedPerReq
      .concat(resolvedPerRou)
      .find((rp) => rp.dualKey.token === HttpErrorHandler)!;
    const RegistryPerReq = Injector.prepareRegistry(resolvedPerReq);
    const rawReqId = KeyRegistry.get(RAW_REQ).id;
    const rawResId = KeyRegistry.get(RAW_RES).id;
    const pathParamsId = KeyRegistry.get(A_PATH_PARAMS).id;
    const queryStringId = KeyRegistry.get(QUERY_STRING).id;

    return (async (rawReq, rawRes, aPathParams, queryString) => {
      const injector = new Injector(RegistryPerReq, 'Req', injectorPerRou);
      const ctx = new RequestContextClass(rawReq, rawRes, aPathParams, queryString);
      await injector
        .setById(rawReqId, rawReq)
        .setById(rawResId, rawRes)
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

  protected getResolvedGuardsPerMod(
    guards: GuardPerMod1[],
    controllerName: string,
    httpMethod: HttpMethod | HttpMethod[],
    path: string,
    perReq?: boolean,
  ) {
    return guards.map((g) => {
      const resolvedPerMod = Injector.resolve(g.meta.providersPerMod);
      const resolvedPerRou = Injector.resolve(g.meta.providersPerRou);
      const resolvedPerReq = Injector.resolve(g.meta.providersPerReq);
      const resolvedProviders = perReq
        ? resolvedPerReq.concat(resolvedPerRou, resolvedPerMod)
        : resolvedPerRou.concat(resolvedPerMod);

      const guard = resolvedProviders.find((rp) => rp.dualKey.token === g.guard);

      if (!guard) {
        const levels = ['providersPerRou', 'providersPerMod'];
        if (perReq) {
          levels.push('providersPerReq');
        }
        const levelNames = levels.join(' and ');
        let msg = `Could not find the required ${g.guard.name} in the context of`;
        msg += ` ${g.meta.name} for route "${controllerName} -> ${httpMethod} /${path}".`;
        msg += ` Lookup in ${levelNames} was unsuccessful.`;
        if (!perReq) {
          msg += ` Notice that ${controllerName} has "{ scope: 'ctx' }" in its metadata.`;
        }
        throw new Error(msg);
      }

      const injectorPerMod = this.moduleManager.getInjectorPerMod(g.meta.modRefId);
      const injectorPerRou = injectorPerMod.createChildFromResolved(resolvedPerRou, 'Rou');

      const resolvedGuard: ResolvedGuardPerMod = {
        guard,
        injectorPerRou,
        resolvedPerReq,
        params: g.params,
      };

      return resolvedGuard;
    });
  }

  protected getResolvedGuards(guards: NormalizedGuard[], resolvedProviders: ResolvedProvider[]) {
    return guards.map((g) => {
      const defaultResolvedGuard = Injector.resolve([g.guard])[0];

      const resolvedGuard: ResolvedGuard = {
        guard: resolvedProviders.concat([defaultResolvedGuard]).find((rp) => rp.dualKey.token === g.guard)!,
        params: g.params,
      };

      return resolvedGuard;
    });
  }

  protected getResolvedHandler(routeMeta: RouteMeta, resolvedPerReq: ResolvedProvider[]) {
    const { Controller, methodName } = routeMeta;
    const factoryProvider: FactoryProvider = { useFactory: [Controller, Controller.prototype[methodName]] };
    const resolvedHandler = Injector.resolve([factoryProvider])[0];
    return resolvedPerReq.concat([resolvedHandler]).find((rp) => rp.dualKey.token === Controller.prototype[methodName]);
  }

  /**
   * Used as "sandbox" to test resolvable of controllers, guards and HTTP interceptors.
   */
  protected checkDeps(
    inj: Injector,
    routeMeta: RouteMeta,
    controllerName: string,
    httpMethod: HttpMethod | HttpMethod[],
    path: string,
  ) {
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
      this.errorMediator.checkingDepsInSandboxFailed(cause, controllerName, httpMethod, path);
    }
  }

  protected setRoutes(stage1ExtensionMeta: Stage1ExtensionMeta<MetadataPerMod3>, preparedRouteMeta: PreparedRouteMeta[]) {
    if (!stage1ExtensionMeta.delay) {
      const appHasRoutes = this.checkPresenceOfRoutesInApplication(stage1ExtensionMeta.groupDataPerApp);
      if (!appHasRoutes) {
        this.log.noRoutes(this);
        return;
      }
    }

    preparedRouteMeta.forEach((data) => {
      const { moduleName, fullPath, httpMethods, handle, countOfGuards } = data;

      if (fullPath?.charAt(0) == '/') {
        let msg = `Invalid configuration of route '${fullPath}'`;
        msg += ` (in ${moduleName}): path cannot start with a slash`;
        throw new Error(msg);
      }

      httpMethods.forEach((httpMethod) => {
        this.log.printRoute(this, httpMethod, fullPath, countOfGuards);
        routeChannel('ditsmod.route').publish({ moduleName, httpMethod, fullPath, countOfGuards });
        if (httpMethod == 'ALL') {
          this.router.all(`/${fullPath}`, handle);
        } else {
          this.router.on(httpMethod, `/${fullPath}`, handle);
        }
      });
    });
  }

  protected checkPresenceOfRoutesInApplication(groupDataPerApp: Stage1ExtensionMetaPerApp<MetadataPerMod3>[]) {
    return groupDataPerApp.reduce((prev1, curr1) => {
      return (
        prev1 || curr1.groupData.reduce((prev2, curr2) => prev2 || Boolean(curr2.aControllerMetadata.length), false)
      );
    }, false);
  }
}
