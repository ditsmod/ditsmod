import { injectable, Extension, MetadataPerMod2, type Class, reflector, Provider, awaitTokens } from '@ditsmod/core';
import { inspect } from 'node:util';

import { TrpcMetadataPerMod2 } from '#init/trpc-deep-modules-importer.js';
import { initTrpcModule } from '#decorators/trpc-init-hooks-and-metadata.js';
import { TrpcRouteMetadata } from '#decorators/trpc-route.js';
import { isCtrlDecor } from '#init/trpc-module-normalizer.js';
import { ControllerRawMetadata } from '#decorators/controller.js';
import { MetadataPerMod3 } from '#types/types.js';
import { ControllerMetadata } from '#types/controller-metadata.js';
import { TrpcRouteMeta } from '#types/trpc-route-data.js';
import { InvalidInterceptor } from '../error/trpc-errors.js';
import { isInterceptor, isTrpcRoute } from '#types/type.guards.js';
import { HTTP_INTERCEPTORS } from '#types/types.js';
import { RouteService } from '#services/route.service.js';
import { normalizeGuards } from '#utils/prepere-guards.js';

@injectable()
export class TrpcRouteExtension implements Extension<MetadataPerMod3> {
  protected metadataPerMod3: MetadataPerMod3;

  constructor(protected metadataPerMod2: MetadataPerMod2<TrpcMetadataPerMod2>) {}

  async stage1() {
    const trpcMetadataPerMod2 = this.metadataPerMod2.deepImportedModules.get(initTrpcModule)!;
    this.metadataPerMod3 = new MetadataPerMod3();
    this.metadataPerMod3.meta = trpcMetadataPerMod2.meta;
    this.metadataPerMod3.baseMeta = this.metadataPerMod2.baseMeta;
    this.metadataPerMod3.aControllerMetadata = this.getControllersMetadata(trpcMetadataPerMod2);
    this.metadataPerMod3.guards1 = trpcMetadataPerMod2.guards1;
    // this.metadataPerMod3.guards1 = [];

    return this.metadataPerMod3;
  }

  protected getControllersMetadata(trpcMetadataPerMod2: TrpcMetadataPerMod2) {
    const aControllerMetadata: ControllerMetadata[] = [];
    const { providersPerMod } = trpcMetadataPerMod2.baseMeta;

    for (const Controller of trpcMetadataPerMod2.meta.controllers as Class<Record<string | symbol, any>>[]) {
      const classMeta = reflector.getMetadata(Controller)!;
      for (const methodName of classMeta) {
        for (const decoratorAndValue of classMeta[methodName].decorators) {
          if (!isTrpcRoute(decoratorAndValue)) {
            continue;
          }
          const methodAsToken = Controller.prototype[methodName];
          const providersPerRou: Provider[] = [RouteService, { useFactory: [Controller, methodAsToken] }];
          providersPerMod.unshift(...awaitTokens(methodAsToken));
          const providersPerReq: Provider[] = [];
          const route = decoratorAndValue.value as TrpcRouteMetadata;
          const ctrlDecorator = classMeta.constructor.decorators.find(isCtrlDecor);
          const guards = normalizeGuards(route.guards).slice();
          providersPerRou.push(...(ctrlDecorator?.value.providersPerRou || []));
          providersPerReq.push(...((ctrlDecorator?.value as ControllerRawMetadata).providersPerReq || []));

          for (const Interceptor of route.interceptors) {
            if (isInterceptor(Interceptor)) {
              providersPerReq.push({ token: HTTP_INTERCEPTORS, useClass: Interceptor, multi: true });
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
          });
        }
      }
    }

    return aControllerMetadata;
  }
}
