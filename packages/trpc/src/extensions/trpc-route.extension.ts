import {
  injectable,
  Extension,
  Injector,
  MetadataPerMod2,
  type Class,
  reflector,
  Provider,
  fromSelf,
} from '@ditsmod/core';
import { inspect } from 'node:util';

import { TrpcMetadataPerMod2 } from '#init/trpc-deep-modules-importer.js';
import { initTrpcModule } from '#decorators/trpc-init-hooks-and-metadata.js';
import { TrpcRouteMetadata } from '#decorators/trpc-route.js';
import { isCtrlDecor } from '#init/trpc-module-normalizer.js';
import { ControllerRawMetadata } from '#decorators/controller.js';
import { TRPC_ROOT } from '../constants.js';
import { RouteService } from '#services/route.service.js';
import { TrpcRootObject } from '../types.js';
import { MetadataPerMod3 } from '#types/types.js';
import { ControllerMetadata } from '#types/controller-metadata.js';
import { TrpcRouteMeta } from '#types/trpc-route-data.js';
import { FailedValidationOfRoute, InvalidInterceptor } from '../trpc-errors.js';
import { GuardItem, GuardPerMod1 } from '#interceptors/guard.js';
import { isInterceptor, isTrpcRoute } from '#types/type.guards.js';
import { HTTP_INTERCEPTORS } from '#types/constants.js';

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

    for (const Controller of trpcMetadataPerMod2.meta.controllers as Class<Record<string | symbol, any>>[]) {
      const { baseMeta, meta } = trpcMetadataPerMod2;
      const classMeta = reflector.getMetadata(Controller)!;
      for (const methodName of classMeta) {
        for (const decoratorAndValue of classMeta[methodName].decorators) {
          if (!isTrpcRoute(decoratorAndValue)) {
            continue;
          }
          const routeHandler = Controller.prototype[methodName];
          const providersPerRou: Provider[] = [
            { useFactory: [Controller, routeHandler] },
            {
              token: RouteService,
              deps: [TRPC_ROOT, Injector],
              useFactory: (t: TrpcRootObject<any>, injectorPerRou: Injector) => {
                return new RouteService(t, injectorPerRou, providersPerReq);
              },
            },
          ];
          const providersPerReq: Provider[] = [];
          const route = decoratorAndValue.value as TrpcRouteMetadata;
          const ctrlDecorator = classMeta.constructor.decorators.find(isCtrlDecor);
          const guards = this.normalizeGuards(route.guards).slice();
          providersPerRou.push(...(ctrlDecorator?.value.providersPerRou || []));
          providersPerReq.push(...((ctrlDecorator?.value as ControllerRawMetadata).providersPerReq || []));

          for (const Interceptor of route.interceptors) {
            if (isInterceptor(Interceptor)) {
              const provider = { token: HTTP_INTERCEPTORS, useClass: Interceptor, multi: true };
              providersPerReq.push(provider);
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

          baseMeta.providersPerMod.unshift({
            token: routeHandler,
            deps: [Injector],
            useFactory: (injectorPerMod: Injector) => {
              const mergedPerRou = meta.providersPerRou.concat(providersPerRou);
              const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedPerRou, 'Rou');
              return injectorPerRou.get(routeHandler, fromSelf); // fromSelf - this allow avoiding cyclic deps.
            },
          });
        }
      }
    }

    return aControllerMetadata;
  }

  protected normalizeGuards(guards?: GuardItem[]) {
    return (guards || []).map((item) => {
      if (Array.isArray(item)) {
        this.checkGuardsPerMod(item[0]);
        return { guard: item[0], params: item.slice(1) } as GuardPerMod1;
      } else {
        this.checkGuardsPerMod(item);
        return { guard: item } as GuardPerMod1;
      }
    });
  }

  protected checkGuardsPerMod(Guard: Class) {
    const type = typeof Guard?.prototype.canActivate;
    if (type != 'function') {
      const whatIsThis = inspect(Guard, false, 3);
      throw new FailedValidationOfRoute(type, whatIsThis);
    }
  }
}
