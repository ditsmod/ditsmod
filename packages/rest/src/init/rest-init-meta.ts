import { AnyObj, Provider, ModuleType, MultiProvider, Class, ModRefId, BaseInitMeta } from '@ditsmod/core';

import { NormalizedGuard } from '#interceptors/guard.js';
import { AppendsWithParams } from '#init/rest-init-raw-meta.js';

class NormalizedParams {
  declare path?: string;
  declare absolutePath?: string;
  guards: NormalizedGuard[] = [];
}

export class RestInitMeta extends BaseInitMeta {
  appendsWithParams: AppendsWithParams[] = [];
  appendsModules: ModuleType[] = [];
  controllers: Class[] = [];
  params = new NormalizedParams();
}

export type RestModRefId<T extends AnyObj = AnyObj> = ModRefId | AppendsWithParams<T>;
