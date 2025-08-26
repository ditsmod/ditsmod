import {
  injectable,
  Extension,
  ExtensionsManager,
  Logger,
  MetadataPerMod2,
  Class,
  reflector,
  DecoratorAndValue,
  PerAppService,
} from '@ditsmod/core';

import { TrpcMetadataPerMod2 } from '#init/trpc-deep-modules-importer.js';
import { initTrpcModule } from '#decorators/trpc-init-hooks-and-metadata.js';
import { trpcRoute } from '#decorators/trpc-route.js';
import { isCtrlDecor } from '#init/trpc-module-normalizer.js';

export function isTrpcRoute<T>(decoratorAndValue?: DecoratorAndValue<T>): decoratorAndValue is DecoratorAndValue<T> {
  return (decoratorAndValue as DecoratorAndValue<T>)?.decorator === trpcRoute;
}

@injectable()
export class TrpcExtension implements Extension<void> {
  constructor(
    private extensionsManager: ExtensionsManager,
    private perAppService: PerAppService,
    protected metadataPerMod2: MetadataPerMod2<TrpcMetadataPerMod2>,
  ) {}

  async stage1() {
    this.setControllersToDi();
    this.perAppService.reinitInjector();
  }

  protected setControllersToDi() {
    const restMetadataPerMod2 = this.metadataPerMod2.deepImportedModules.get(initTrpcModule)!;
    for (const Controller of restMetadataPerMod2.meta.controllers as Class<Record<string | symbol, any>>[]) {
      const classMeta = reflector.getMetadata(Controller)!;
      for (const methodName of classMeta) {
        for (const decoratorAndValue of classMeta[methodName].decorators) {
          if (!isTrpcRoute(decoratorAndValue)) {
            continue;
          }
          const route = decoratorAndValue.value;
          const ctrlDecorator = classMeta.constructor.decorators.find(isCtrlDecor);
          this.perAppService.providers.push({ useFactory: [Controller, Controller.prototype[methodName]] });
        }
      }
    }
  }
}
