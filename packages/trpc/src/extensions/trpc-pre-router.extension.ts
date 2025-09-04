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
  FactoryProvider,
  ResolvedGuard,
  ResolvedProvider,
  ResolvedGuardPerMod,
  ModuleManager,
} from '@ditsmod/core';

import { trpcRoute } from '#decorators/trpc-route.js';
import { MetadataPerMod3 } from '#types/types.js';
import { TrpcRouteExtension } from './trpc-route.extension.js';
import { HttpBackend, HttpFrontend } from '#interceptors/tokens-and-types.js';
import { RequestContext } from '#services/request-context.js';
import { HTTP_INTERCEPTORS, RAW_REQ, RAW_RES } from '#types/constants.js';
import { ControllerMetadata } from '#types/controller-metadata.js';
import { InterceptorWithGuards } from '#interceptors/interceptor-with-guards.js';
import { TrpcRouteMeta } from '#types/trpc-route-data.js';
import { ChainMaker } from '#interceptors/chain-maker.js';
import { GuardPerMod1, NormalizedGuard } from '#interceptors/guard.js';
import { RawRequest, RawResponse } from '#services/request.js';
import { HttpErrorHandler } from '#services/http-error-handler.js';
import { CheckingDepsInSandboxFailed, GuardNotFound } from '../trpc-errors.js';

export function isTrpcRoute<T>(decoratorAndValue?: DecoratorAndValue<T>): decoratorAndValue is DecoratorAndValue<T> {
  return (decoratorAndValue as DecoratorAndValue<T>)?.decorator === trpcRoute;
}

@injectable()
export class TrpcPreRouterExtension implements Extension<void> {
  protected stage1ExtensionMeta: Stage1ExtensionMeta<MetadataPerMod3>;

  constructor(
    protected extensionsManager: ExtensionsManager,
    protected moduleManager: ModuleManager,
  ) {}

  async stage1() {
    this.stage1ExtensionMeta = await this.extensionsManager.stage1(TrpcRouteExtension);
  }

  protected getHandlerPerReq(
    metadataPerMod3: MetadataPerMod3,
    injectorPerMod: Injector,
    controllerMetadata: ControllerMetadata,
  ) {
    const { providersPerRou, providersPerReq, routeMeta } = controllerMetadata;
    const mergedPerRou = [...metadataPerMod3.meta.providersPerRou, ...providersPerRou];
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
    routeMeta.resolvedGuards = this.getResolvedGuards(controllerMetadata.guards, resolvedPerReq);
    routeMeta.resolvedGuardsPerMod = this.getResolvedGuardsPerMod(metadataPerMod3.guards1, controllerName, true);
    const injPerReq = injectorPerRou.createChildFromResolved(resolvedPerReq, 'Req');
    const RequestContextClass = injPerReq.get(RequestContext) as typeof RequestContext;
    routeMeta.resolvedHandler = this.getResolvedHandler(routeMeta, resolvedPerReq);
    this.checkDeps(injPerReq, routeMeta, controllerName);
    const resolvedChainMaker = resolvedPerReq.find((rp) => rp.dualKey.token === ChainMaker)!;
    const resolvedErrHandler = resolvedPerReq
      .concat(resolvedPerRou)
      .find((rp) => rp.dualKey.token === HttpErrorHandler)!;
    const RegistryPerReq = Injector.prepareRegistry(resolvedPerReq);
    const rawReqId = KeyRegistry.get(RAW_REQ).id;
    const rawResId = KeyRegistry.get(RAW_RES).id;

    return async (rawReq: RawRequest, rawRes: RawResponse) => {
      const injector = new Injector(RegistryPerReq, 'Req', injectorPerRou);
      const ctx = new RequestContextClass(rawReq, rawRes);
      await injector
        .setById(rawReqId, rawReq)
        .setById(rawResId, rawRes)
        .instantiateResolved<ChainMaker>(resolvedChainMaker)
        .makeChain(ctx)
        .handle() // First HTTP handler in the chain of HTTP interceptors.
        .catch((err) => {
          const errorHandler = injector.instantiateResolved(resolvedErrHandler) as HttpErrorHandler;
          return errorHandler.handleError(err, ctx);
        })
        .finally(() => injector.clear());
    };
  }

  /**
   * Used as "sandbox" to test resolvable of controllers, guards and HTTP interceptors.
   */
  protected checkDeps(inj: Injector, routeMeta: TrpcRouteMeta, controllerName: string) {
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
      throw new CheckingDepsInSandboxFailed(cause, controllerName);
    }
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

  protected getResolvedHandler(routeMeta: TrpcRouteMeta, resolvedPerReq: ResolvedProvider[]) {
    const { Controller, methodName } = routeMeta;
    const factoryProvider: FactoryProvider = { useFactory: [Controller, Controller.prototype[methodName]] };
    const resolvedHandler = Injector.resolve([factoryProvider])[0];
    return resolvedPerReq.concat([resolvedHandler]).find((rp) => rp.dualKey.token === Controller.prototype[methodName]);
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
