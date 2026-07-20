import { injectable, Extension, ResolvedModuleMetadata, type Class, Reflector, Provider } from '@ditsmod/core';
import { inspect } from 'node:util';

import { TrpcResolvedModuleMetadata } from '#init/trpc-deep-modules-importer.js';
import { initTrpcModule } from '#decorators/trpc-init-hooks-and-metadata.js';
import { TrpcRouteMetadata } from '#decorators/trpc-route.js';
import { ControllerOptions } from '#decorators/trpc-controller.js';
import { RouteExtensionMeta } from '#types/types.js';
import { ControllerMeta } from '#types/controller-metadata.js';
import { TrpcRouteMeta } from '#types/trpc-route-data.js';
import { InvalidInterceptor } from '../error/trpc-errors.js';
import { isControllerDecorator, isInterceptor, isTrpcRoute } from '#types/type.guards.js';
import { TRPC_HTTP_INTERCEPTORS } from '#types/types.js';
import { TrpcRouteService } from '#services/route.service.js';
import { normalizeGuards } from '#utils/prepare-guards.js';

@injectable()
export class TrpcRouteExtension implements Extension<RouteExtensionMeta> {
  protected routeExtensionMeta: RouteExtensionMeta;

  constructor(protected resolvedModuleMetadata: ResolvedModuleMetadata<TrpcResolvedModuleMetadata>) {}

  async stage1() {
    const trpcResolvedModuleMetadata = this.resolvedModuleMetadata.deepImportedModules.get(initTrpcModule)!;
    this.routeExtensionMeta = new RouteExtensionMeta();
    this.routeExtensionMeta.meta = trpcResolvedModuleMetadata.meta;
    this.routeExtensionMeta.normalizedModuleMeta = this.resolvedModuleMetadata.normalizedModuleMeta;
    this.routeExtensionMeta.aControllerMeta = this.getControllersMetadata(trpcResolvedModuleMetadata);
    this.routeExtensionMeta.guards1 = trpcResolvedModuleMetadata.guards1;
    // this.routeExtensionMeta.guards1 = [];

    return this.routeExtensionMeta;
  }

  protected getControllersMetadata(trpcResolvedModuleMetadata: TrpcResolvedModuleMetadata) {
    const aControllerMeta: ControllerMeta[] = [];

    for (const Controller of trpcResolvedModuleMetadata.meta.controllers as Class<Record<string | symbol, any>>[]) {
      const classMeta = Reflector.collectMeta(Controller)!;
      for (const methodName of classMeta) {
        for (const decoratorMeta of classMeta[methodName].decorators) {
          if (!isTrpcRoute(decoratorMeta)) {
            continue;
          }
          const methodAsToken = Controller.prototype[methodName];
          const providersPerRou: Provider[] = [TrpcRouteService, { useFactory: [Controller, methodAsToken] }];
          const providersPerReq: Provider[] = [];
          const route = decoratorMeta.value as TrpcRouteMetadata;
          const ctrlDecorator = classMeta.constructor.decorators.find(isControllerDecorator);
          const guards = normalizeGuards(route.guards);
          providersPerRou.push(...(ctrlDecorator?.value.providersPerRou || []));
          providersPerReq.push(...((ctrlDecorator?.value as ControllerOptions).providersPerReq || []));

          for (const Interceptor of route.interceptors) {
            if (isInterceptor(Interceptor)) {
              providersPerReq.push({ token: TRPC_HTTP_INTERCEPTORS, useClass: Interceptor, multi: true });
            } else {
              const whatIsThis = inspect(Interceptor, false, 3);
              throw new InvalidInterceptor(whatIsThis);
            }
          }

          const routeMeta: TrpcRouteMeta = {
            Controller,
            methodName,
          };
          providersPerRou.push({ token: TrpcRouteMeta, useValue: routeMeta });
          aControllerMeta.push({
            providersPerRou,
            providersPerReq,
            routeMeta,
            guards,
            interceptors: route.interceptors,
          });
        }
      }
    }

    return aControllerMeta;
  }
}
