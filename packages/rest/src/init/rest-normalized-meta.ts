import {
  AnyObj,
  Provider,
  ModuleType,
  MultiProvider,
  Class,
  ModuleWithParams,
  ModRefId,
  BaseInitMeta,
  ModuleWithSrcInitMeta,
  Override,
} from '@ditsmod/core';

import { NormalizedGuard } from '#interceptors/guard.js';
import { AppendsWithParams, RestModuleParams } from '#init/module-metadata.js';

class NormalizedParams {
  declare path?: string;
  declare absolutePath?: string;
  guards: NormalizedGuard[] = [];
}

export class RestNormalizedMeta extends BaseInitMeta<RestModuleParams> {
  override importsWithModRefId: ({ modRefId: ModuleWithSrcInitMeta } & RestModuleParams)[] = [];
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
  params = new NormalizedParams();
  override exportsWithModRefId: ({ modRefId: ModuleWithSrcInitMeta } & RestModuleParams)[] = [];
}

export type RestModRefId<T extends AnyObj = AnyObj> = ModRefId | AppendsWithParams<T>;
