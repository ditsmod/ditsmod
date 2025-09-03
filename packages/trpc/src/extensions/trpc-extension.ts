import {
  injectable,
  Extension,
  Injector,
  MetadataPerMod2,
  type Class,
  reflector,
  DecoratorAndValue,
  Provider,
  fromSelf,
} from '@ditsmod/core';

import { TrpcMetadataPerMod2 } from '#init/trpc-deep-modules-importer.js';
import { initTrpcModule } from '#decorators/trpc-init-hooks-and-metadata.js';
import { trpcRoute } from '#decorators/trpc-route.js';
import { isCtrlDecor } from '#init/trpc-module-normalizer.js';
import { ControllerRawMetadata } from '#decorators/controller.js';
import { TRPC_ROOT } from '../constants.js';
import { RouteService } from '#services/route.service.js';
import { TrpcRootObject } from '../types.js';

export function isTrpcRoute<T>(decoratorAndValue?: DecoratorAndValue<T>): decoratorAndValue is DecoratorAndValue<T> {
  return (decoratorAndValue as DecoratorAndValue<T>)?.decorator === trpcRoute;
}

@injectable()
export class TrpcExtension implements Extension<void> {
  constructor(protected metadataPerMod2: MetadataPerMod2<TrpcMetadataPerMod2>) {}

  async stage1() {
    this.setControllersToDi();
  }

  protected setControllersToDi() {
    const trpcMetadataPerMod2 = this.metadataPerMod2.deepImportedModules.get(initTrpcModule)!;
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
          const route = decoratorAndValue.value;
          const ctrlDecorator = classMeta.constructor.decorators.find(isCtrlDecor);
          const { interceptors } = route;
          providersPerRou.push(...(ctrlDecorator?.value.providersPerRou || []));
          providersPerReq.push(...((ctrlDecorator?.value as ControllerRawMetadata).providersPerReq || []));

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
  }
}
