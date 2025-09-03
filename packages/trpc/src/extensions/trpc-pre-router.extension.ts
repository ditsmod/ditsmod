import { injectable, Extension, DecoratorAndValue, ExtensionsManager, Stage1ExtensionMeta } from '@ditsmod/core';

import { trpcRoute } from '#decorators/trpc-route.js';
import { MetadataPerMod3 } from '#types/types.js';
import { TrpcRouteExtension } from './trpc-route.extension.js';

export function isTrpcRoute<T>(decoratorAndValue?: DecoratorAndValue<T>): decoratorAndValue is DecoratorAndValue<T> {
  return (decoratorAndValue as DecoratorAndValue<T>)?.decorator === trpcRoute;
}

@injectable()
export class TrpcPreRouterExtension implements Extension<void> {
  protected stage1ExtensionMeta: Stage1ExtensionMeta<MetadataPerMod3>;

  constructor(protected extensionsManager: ExtensionsManager) {}

  async stage1() {
    this.stage1ExtensionMeta = await this.extensionsManager.stage1(TrpcRouteExtension);
  }
}
