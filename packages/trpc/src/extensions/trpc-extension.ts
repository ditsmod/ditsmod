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
import { ControllerRawMetadata1 } from '#decorators/controller.js';
import { t, TRPC_PROC } from '../constants.js';

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
    const restMetadataPerMod2 = this.metadataPerMod2.deepImportedModules.get(initTrpcModule)!;
    for (const Controller of restMetadataPerMod2.meta.controllers as Class<Record<string | symbol, any>>[]) {
      const { baseMeta, meta } = restMetadataPerMod2;
      const classMeta = reflector.getMetadata(Controller)!;
      for (const methodName of classMeta) {
        for (const decoratorAndValue of classMeta[methodName].decorators) {
          if (!isTrpcRoute(decoratorAndValue)) {
            continue;
          }
          const token = Controller.prototype[methodName];
          const providersPerRou: Provider[] = [
            { useFactory: [Controller, token] },
            {
              token: TRPC_PROC,
              useFactory: () => {
                return t.procedure.use(async (opts) => {
                  const result = await opts.next();
                  return result;
                });
              },
            },
          ];
          const providersPerReq: Provider[] = [];
          const route = decoratorAndValue.value;
          const ctrlDecorator = classMeta.constructor.decorators.find(isCtrlDecor);
          const { interceptors } = route;
          providersPerRou.push(...(ctrlDecorator?.value.providersPerRou || []));
          providersPerReq.push(...((ctrlDecorator?.value as ControllerRawMetadata1).providersPerReq || []));

          baseMeta.providersPerMod.unshift({
            token,
            deps: [Injector],
            useFactory: (injectorPerMod: Injector) => {
              const mergedPerRou = meta.providersPerRou.concat(providersPerRou);
              const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedPerRou, 'Rou');
              return injectorPerRou.get(token, fromSelf); // fromSelf - this allow avoiding cyclic deps.
            },
          });
        }
      }
    }
  }
}
