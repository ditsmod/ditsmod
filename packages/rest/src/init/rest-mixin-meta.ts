import type { AnyObj, StaticModule, Class, ModRefId } from '@ditsmod/core';
import { Provider, MultiProvider, NormalizedMixinMeta } from '@ditsmod/core';

import type { NormalizedGuard } from '#interceptors/guard.js';
import type { AppendsWithOptions } from '#init/rest-mixin-raw-meta.js';

class NormalizedParams {
  declare path?: string;
  declare absolutePath?: string;
  guards: NormalizedGuard[] = [];
}

export class RestInitMeta extends NormalizedMixinMeta {
  appendsWithOpts: AppendsWithOptions[] = [];
  appendsModules: StaticModule[] = [];
  controllers: Class<Record<string | symbol, any>>[] = [];
  params = new NormalizedParams();
}

export type RestModRefId<T extends AnyObj = AnyObj> = ModRefId | AppendsWithOptions<T>;
