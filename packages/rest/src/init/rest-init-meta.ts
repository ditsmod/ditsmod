import type { AnyObj, ModuleType, Class, ModRefId} from '@ditsmod/core';
import { Provider, MultiProvider, BaseInitMeta } from '@ditsmod/core';

import type { NormalizedGuard } from '#interceptors/guard.js';
import type { AppendsWithParams } from '#init/rest-init-raw-meta.js';

class NormalizedParams {
  declare path?: string;
  declare absolutePath?: string;
  guards: NormalizedGuard[] = [];
}

export class RestInitMeta extends BaseInitMeta {
  appendsWithParams: AppendsWithParams[] = [];
  appendsModules: ModuleType[] = [];
  controllers: Class<Record<string | symbol, any>>[] = [];
  params = new NormalizedParams();
}

export type RestModRefId<T extends AnyObj = AnyObj> = ModRefId | AppendsWithParams<T>;
