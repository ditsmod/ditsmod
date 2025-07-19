import {
  AnyObj,
  Provider,
  ModuleType,
  MultiProvider,
  Class,
  ModuleWithParams,
  ModRefId,
  ParamsTransferObj,
  ModuleWithSrcInitMeta,
  Override,
} from '@ditsmod/core';

import { NormalizedGuard } from '#interceptors/guard.js';
import { AppendsWithParams, RestModuleParams } from '#init/module-metadata.js';

class NormalizedParams {
  path?: string;
  absolutePath?: string;
  guards: NormalizedGuard[] = [];
}

export class RestNormalizedMeta implements ParamsTransferObj<RestModuleParams> {
  providersPerRou: Provider[] = [];
  providersPerReq: Provider[] = [];
  exportedProvidersPerRou: Provider[] = [];
  exportedProvidersPerReq: Provider[] = [];
  exportedMultiProvidersPerRou: MultiProvider[] = [];
  exportedMultiProvidersPerReq: MultiProvider[] = [];
  resolvedCollisionsPerRou: [any, ModuleType | ModuleWithParams][] = [];
  resolvedCollisionsPerReq: [any, ModuleType | ModuleWithParams][] = [];
  appendsWithParams: AppendsWithParams[] = [];
  appendsModules: ModuleType[] = [];
  controllers: Class[] = [];
  importsWithParams: Override<RestModuleParams, { modRefId: ModuleWithSrcInitMeta }>[] = [];
  params = new NormalizedParams();
}

export type RestModRefId<T extends AnyObj = AnyObj> = ModRefId | AppendsWithParams<T>;
