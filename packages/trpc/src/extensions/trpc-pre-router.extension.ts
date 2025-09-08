import {
  injectable,
  Extension,
  DecoratorAndValue,
  ExtensionsManager,
  Stage1ExtensionMeta,
  getDebugClassName,
  Injector,
  KeyRegistry,
  Provider,
  DepsChecker,
  CTX_DATA,
  SystemLogMediator,
  fromSelf,
  ResolvedProvider,
  ResolvedGuardPerMod,
  ModuleManager,
  ClassFactoryProvider,
  getToken,
} from '@ditsmod/core';

import { trpcRoute } from '#decorators/trpc-route.js';
import { MetadataPerMod3 } from '#types/types.js';
import { TrpcRouteExtension } from './trpc-route.extension.js';
import { HttpBackend, HttpFrontend } from '#interceptors/tokens-and-types.js';
import { HTTP_INTERCEPTORS, RAW_REQ, RAW_RES } from '#types/types.js';
import { ControllerMetadata } from '#types/controller-metadata.js';
import { InterceptorWithGuards } from '#interceptors/interceptor-with-guards.js';
import { TrpcRouteMeta } from '#types/trpc-route-data.js';
import { ChainMaker } from '#interceptors/chain-maker.js';
import { GuardPerMod1 } from '#interceptors/guard.js';
import { RawRequest, RawResponse } from '#services/request.js';
import { HttpErrorHandler } from '#services/http-error-handler.js';
import { CheckingDepsInSandboxFailed, GuardNotFound, InvalidInterceptor } from '../error/trpc-errors.js';
import { DefaultCtxHttpFrontend } from '#interceptors/default-ctx-http-frontend.js';
import { DefaultHttpBackend } from '#interceptors/default-http-backend.js';
import { DefaultHttpFrontend } from '#interceptors/default-http-frontend.js';
import { DefaultCtxHttpBackend } from '#interceptors/default-ctx-http-backend.js';
import { DefaultCtxChainMaker } from '#interceptors/default-ctx-chain-maker.js';
import { PublicRouteService, RouteService } from '#services/route.service.js';
import { TRPC_OPTS, TrpcOpts } from '#types/constants.js';
import { getResolvedGuards } from '#utils/prepere-guards.js';
import { InterceptorWithGuardsPerRou } from '#interceptors/interceptor-with-guards-per-rou.js';
import { isInterceptor } from '#types/type.guards.js';
import { inspect } from 'node:util';

export function isTrpcRoute<T>(decoratorAndValue?: DecoratorAndValue<T>): decoratorAndValue is DecoratorAndValue<T> {
  return (decoratorAndValue as DecoratorAndValue<T>)?.decorator === trpcRoute;
}

@injectable()
export class TrpcPreRouterExtension implements Extension<void> {
  protected stage1ExtensionMeta: Stage1ExtensionMeta<MetadataPerMod3>;
  protected injectorPerMod: Injector;
  protected injectorPerApp: Injector;

  constructor(
    protected extensionsManager: ExtensionsManager,
    protected moduleManager: ModuleManager,
  ) {}

  async stage1() {
    this.stage1ExtensionMeta = await this.extensionsManager.stage1(TrpcRouteExtension);
    this.addDefaultProviders(this.stage1ExtensionMeta.groupData);
  }

  async stage2(injectorPerMod: Injector) {
    this.injectorPerMod = injectorPerMod;
  }

  async stage3() {
    this.prepareRoutesMeta(this.stage1ExtensionMeta.groupData);
  }

  protected addDefaultProviders(aMetadataPerMod3: MetadataPerMod3[]) {
    // Since each extension received the same `meta` array and not a copy of it,
    // we can take `meta` from any element in the `groupData` array.
    const metadataPerMod3 = aMetadataPerMod3.at(0);
    if (!metadataPerMod3) {
      return;
    }

    metadataPerMod3.meta.providersPerReq.unshift(
      { token: HttpBackend, useClass: DefaultHttpBackend },
      { token: HttpFrontend, useClass: DefaultHttpFrontend },
      ChainMaker,
    );

    metadataPerMod3.meta.providersPerRou.unshift(
      { token: HttpBackend, useClass: DefaultCtxHttpBackend },
      { token: ChainMaker, useClass: DefaultCtxChainMaker },
      { token: HttpFrontend, useClass: DefaultCtxHttpFrontend },
    );
  }

  protected prepareRoutesMeta(aMetadataPerMod3: MetadataPerMod3[]) {
    aMetadataPerMod3.forEach((metadataPerMod3) => {
      if (!metadataPerMod3.aControllerMetadata.length) {
        // No routes from this extension.
        return;
      }

      const { aControllerMetadata, guards1 } = metadataPerMod3;

      aControllerMetadata.forEach((controllerMetadata) => {
        // let handle: RouteHandler;
        // if (controllerMetadata.scope == 'ctx') {
        //   handle = this.getHandlerPerMod(metadataPerMod3, this.injectorPerMod, controllerMetadata);
        // } else {
        //   handle = this.getHandlerPerReq(metadataPerMod3, this.injectorPerMod, controllerMetadata);
        // }
        this.setHandlerPerReq(metadataPerMod3, this.injectorPerMod, controllerMetadata);

        const countOfGuards = controllerMetadata.routeMeta.resolvedGuards!.length + guards1.length;
      });
    });
  }

  protected getHandlerPerRou(
    metadataPerMod3: MetadataPerMod3,
    injectorPerMod: Injector,
    controllerMetadata: ControllerMetadata,
  ) {
    const { providersPerRou, routeMeta: baseRouteMeta } = controllerMetadata;

    const routeMeta = baseRouteMeta as typeof baseRouteMeta;
    const mergedPerRou: Provider[] = [];
    mergedPerRou.push({ token: HTTP_INTERCEPTORS, useToken: HttpFrontend as any, multi: true });
    const controllerName = getDebugClassName(routeMeta.Controller) || 'unknown';

    if (metadataPerMod3.guards1.length || controllerMetadata.guards.length) {
      mergedPerRou.push(InterceptorWithGuardsPerRou);
      mergedPerRou.push({ token: HTTP_INTERCEPTORS, useToken: InterceptorWithGuardsPerRou, multi: true });
    }

    for (const Interceptor of controllerMetadata.interceptors) {
      if (isInterceptor(Interceptor)) {
        providersPerRou.push({ token: HTTP_INTERCEPTORS, useClass: Interceptor, multi: true });
      } else {
        const whatIsThis = inspect(Interceptor, false, 3).slice(0, 500);
        throw new InvalidInterceptor(whatIsThis);
      }
    }
    mergedPerRou.push(...metadataPerMod3.meta.providersPerRou, ...providersPerRou);

    const resolvedPerRou = Injector.resolve(mergedPerRou);
    routeMeta.resolvedGuards = getResolvedGuards(controllerMetadata.guards, resolvedPerRou);
    routeMeta.resolvedGuardsPerMod = this.getResolvedGuardsPerMod(metadataPerMod3.guards1, controllerName);
    const injectorPerRou = injectorPerMod.createChildFromResolved(resolvedPerRou, 'Rou');
    this.checkDeps(injectorPerRou, routeMeta, controllerName);
    const resolvedChainMaker = resolvedPerRou.find((rp) => rp.dualKey.token === ChainMaker)!;
    const resolvedErrHandler = resolvedPerRou.find((rp) => rp.dualKey.token === HttpErrorHandler)!;
    const chainMaker = injectorPerRou.instantiateResolved<DefaultCtxChainMaker>(resolvedChainMaker);
    const errorHandler = injectorPerRou.instantiateResolved(resolvedErrHandler) as HttpErrorHandler;

    if (this.hasInterceptors(mergedPerRou)) {
      return async (opts: TrpcOpts) => {
        const result = await chainMaker.makeChain(opts).handle(); // First HTTP handler in the chain of HTTP interceptors.
        // .catch((err) => {
        //   return errorHandler.handleError(err, ctx);
        // })
        return opts.next(result);
      };
    } else {
      return this.handleWithoutInterceptors(errorHandler);
    }
  }

  protected hasInterceptors(mergedPerRou: Provider[]) {
    const interceptors = mergedPerRou.filter((p) => {
      const token = getToken(p);
      return token === HTTP_INTERCEPTORS || token === HttpBackend;
    });

    // The application has two default interceptors.
    return interceptors.length > 2;
  }

  protected handleWithoutInterceptors(errorHandler: HttpErrorHandler) {
    // const interceptor = new DefaultCtxHttpFrontend();
    return async (opts: TrpcOpts) => {
      // try {
      //   interceptor.before(ctx).after(ctx, await routeHandler(ctx));
      // } catch (err: any) {
      //   await errorHandler.handleError(err, ctx);
      // }
      // const val = await routeHandler(opts);
      // const result = await interceptor.before(ctx).after(ctx, val);
      return opts.next();
    };
  }

  protected setHandlerPerReq(
    metadataPerMod3: MetadataPerMod3,
    injectorPerMod: Injector,
    controllerMetadata: ControllerMetadata,
  ) {
    const { providersPerRou, providersPerReq, routeMeta } = controllerMetadata;
    const mergedPerRou: Provider[] = [...metadataPerMod3.meta.providersPerRou, ...providersPerRou];
    const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedPerRou, 'Rou');

    const mergedPerReq: Provider[] = [];
    mergedPerReq.push({ token: HTTP_INTERCEPTORS, useToken: HttpFrontend as any, multi: true });
    if (metadataPerMod3.guards1.length || controllerMetadata.guards.length) {
      mergedPerReq.push(InterceptorWithGuards);
      mergedPerReq.push({ token: HTTP_INTERCEPTORS, useToken: InterceptorWithGuards, multi: true });
    }
    mergedPerReq.push(...metadataPerMod3.meta.providersPerReq, ...providersPerReq);

    const resolvedPerReq = Injector.resolve(mergedPerReq);
    const resolvedPerRou = Injector.resolve(mergedPerRou);
    const controllerName = getDebugClassName(routeMeta.Controller) || 'unknown';
    routeMeta.resolvedGuards = getResolvedGuards(controllerMetadata.guards, resolvedPerReq);
    routeMeta.resolvedGuardsPerMod = this.getResolvedGuardsPerMod(metadataPerMod3.guards1, controllerName, true);
    const injPerReq = injectorPerRou.createChildFromResolved(resolvedPerReq, 'Req');
    // routeMeta.resolvedHandler = this.getResolvedHandler(routeMeta, resolvedPerReq);
    this.checkDeps(injPerReq, routeMeta, controllerName);
    const resolvedChainMaker = resolvedPerReq.find((rp) => rp.dualKey.token === ChainMaker)!;
    const resolvedErrHandler = resolvedPerReq
      .concat(resolvedPerRou)
      .find((rp) => rp.dualKey.token === HttpErrorHandler)!;
    const RegistryPerReq = Injector.prepareRegistry(resolvedPerReq);
    const optsId = KeyRegistry.get(TRPC_OPTS).id;
    const rawReqId = KeyRegistry.get(RAW_REQ).id;
    const rawResId = KeyRegistry.get(RAW_RES).id;

    const handlerPerReq = async (opts: TrpcOpts) => {
      const rawReq: RawRequest = opts.ctx.req;
      const rawRes: RawResponse = opts.ctx.res;
      const injector = new Injector(RegistryPerReq, 'Req', injectorPerRou);
      return (
        injector
          .setById(optsId, opts)
          .setById(rawReqId, rawReq)
          .setById(rawResId, rawRes)
          .instantiateResolved<ChainMaker>(resolvedChainMaker)
          .makeChain(opts)
          .handle() // First HTTP handler in the chain of HTTP interceptors.
          // .catch((err) => {
          //   const errorHandler = injector.instantiateResolved(resolvedErrHandler) as HttpErrorHandler;
          //   return errorHandler.handleError(err, ctx);
          // })
          .finally(() => injector.clear())
      );
    };

    const routeService = injectorPerRou.get(RouteService) as PublicRouteService;
    const middlewarePerRou = () => this.getHandlerPerRou(metadataPerMod3, injectorPerMod, controllerMetadata);
    routeService.setHandlerPerReq(routeMeta, resolvedPerReq, middlewarePerRou, handlerPerReq);

    const methodAsToken = routeMeta.Controller.prototype[routeMeta.methodName];
    injectorPerMod.setByToken(methodAsToken, injectorPerRou.get(methodAsToken));
  }

  /**
   * Used as "sandbox" to test resolvable of controllers, guards and HTTP interceptors.
   */
  protected checkDeps(inj: Injector, routeMeta: TrpcRouteMeta, controllerName: string) {
    try {
      const ignoreDeps: any[] = [HTTP_INTERCEPTORS, CTX_DATA, RouteService];
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
      throw new CheckingDepsInSandboxFailed(cause, controllerName);
    }
  }

  protected getResolvedHandler(routeMeta: TrpcRouteMeta, resolvedProviders: ResolvedProvider[]) {
    const { Controller, methodName } = routeMeta;
    const factoryProvider: ClassFactoryProvider = { useFactory: [Controller, Controller.prototype[methodName]] };
    const resolvedHandler = Injector.resolve([factoryProvider])[0];
    return resolvedProviders
      .concat([resolvedHandler])
      .find((rp) => rp.dualKey.token === Controller.prototype[methodName]);
  }

  protected getResolvedGuardsPerMod(guards: GuardPerMod1[], controllerName: string, perReq?: boolean) {
    return guards.map((g) => {
      const resolvedPerMod = Injector.resolve(g.baseMeta.providersPerMod);
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
        throw new GuardNotFound(g.baseMeta.name, controllerName, g.guard.name, levelNames, perReq);
      }

      const injectorPerMod = this.moduleManager.getInjectorPerMod(g.baseMeta.modRefId, true);
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
}
