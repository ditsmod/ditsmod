import { injectable, Extension, ResolvedModuleMetadata, type Class, Reflector, Provider } from '@ditsmod/core';
import { inspect } from 'node:util';

import { TrpcResolvedModuleMetadata } from '#init/trpc-deep-modules-importer.js';
import { initTrpcModule } from '#decorators/trpc-init-hooks-and-metadata.js';
import { TrpcRouteMetadata } from '#decorators/trpc-route.js';
import { ControllerDecoratorOptions } from '#decorators/trpc-controller.js';
import { MetadataPerMod3 } from '#types/types.js';
import { ControllerMetadata } from '#types/controller-metadata.js';
import { TrpcRouteMeta } from '#types/trpc-route-data.js';
import { InvalidInterceptor } from '../error/trpc-errors.js';
import { isCtrlDecor, isInterceptor, isTrpcRoute } from '#types/type.guards.js';
import { TRPC_HTTP_INTERCEPTORS } from '#types/types.js';
import { TrpcRouteService } from '#services/route.service.js';
import { normalizeGuards } from '#utils/prepare-guards.js';

@injectable()
export class TrpcRouteExtension implements Extension<MetadataPerMod3> {
  protected metadataPerMod3: MetadataPerMod3;

  constructor(protected resolvedModuleMetadata: ResolvedModuleMetadata<TrpcResolvedModuleMetadata>) {}

  async stage1() {
    const trpcResolvedModuleMetadata = this.resolvedModuleMetadata.deepImportedModules.get(initTrpcModule)!;
    this.metadataPerMod3 = new MetadataPerMod3();
    this.metadataPerMod3.meta = trpcResolvedModuleMetadata.meta;
    this.metadataPerMod3.normalizedModuleMeta = this.resolvedModuleMetadata.normalizedModuleMeta;
    this.metadataPerMod3.aControllerMetadata = this.getControllersMetadata(trpcResolvedModuleMetadata);
    this.metadataPerMod3.guards1 = trpcResolvedModuleMetadata.guards1;
    // this.metadataPerMod3.guards1 = [];

    return this.metadataPerMod3;
  }

  protected getControllersMetadata(trpcResolvedModuleMetadata: TrpcResolvedModuleMetadata) {
    const aControllerMetadata: ControllerMetadata[] = [];

    for (const Controller of trpcResolvedModuleMetadata.meta.controllers as Class<Record<string | symbol, any>>[]) {
      const classMeta = Reflector.collectMeta(Controller)!;
      for (const methodName of classMeta) {
        for (const decoratorAndValue of classMeta[methodName].decorators) {
          if (!isTrpcRoute(decoratorAndValue)) {
            continue;
          }
          const methodAsToken = Controller.prototype[methodName];
          const providersPerRou: Provider[] = [TrpcRouteService, { useFactory: [Controller, methodAsToken] }];
          const providersPerReq: Provider[] = [];
          const route = decoratorAndValue.value as TrpcRouteMetadata;
          const ctrlDecorator = classMeta.constructor.decorators.find(isCtrlDecor);
          const guards = normalizeGuards(route.guards);
          providersPerRou.push(...(ctrlDecorator?.value.providersPerRou || []));
          providersPerReq.push(...((ctrlDecorator?.value as ControllerDecoratorOptions).providersPerReq || []));

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
          aControllerMetadata.push({
            providersPerRou,
            providersPerReq,
            routeMeta,
            guards,
            interceptors: route.interceptors,
          });
        }
      }
    }

    return aControllerMetadata;
  }
}
