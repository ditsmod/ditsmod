import type { AnyObj, StaticModule, Class, ModRefId } from '@ditsmod/core';
import { Provider, MultiProvider, BaseNormalizedModuleMeta } from '@ditsmod/core';

import type { NormalizedGuard } from '#interceptors/guard.js';
import type { RestAppendOptions } from '#init/rest-mixin-raw-meta.js';

class NormalizedParams {
  declare path?: string;
  declare absolutePath?: string;
  guards: NormalizedGuard[] = [];
}

export class RestMixinMeta extends BaseNormalizedModuleMeta {
  appendsWithOpts: RestAppendOptions[] = [];
  appendsModules: StaticModule[] = [];
  controllers: Class<Record<string | symbol, any>>[] = [];
  params = new NormalizedParams();
}

export type RestModRefId<T extends AnyObj = AnyObj> = ModRefId | RestAppendOptions<T>;
