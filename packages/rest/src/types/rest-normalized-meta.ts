import {
  AnyObj,
  Provider,
  ModuleType,
  MultiProvider,
  Class,
  Providers,
  ModuleWithParams,
  ModRefId,
  NormImportsWithParams,
  NormParamsTransferObj,
} from '@ditsmod/core';

import { NormalizedGuard } from '#interceptors/guard.js';
import { AppendsWithParams, RestModuleParams } from '#module/module-metadata.js';

export interface RestRawProvidersMetadata {
  providersPerApp?: Providers | Provider[];
  providersPerMod?: Providers | Provider[];
  providersPerRou?: Providers | Provider[];
  providersPerReq?: Providers | Provider[];
}

export class RestProvidersMetadata {
  providersPerRou: Provider[] = [];
  providersPerReq: Provider[] = [];
}

export class RestNormalizedMeta extends RestProvidersMetadata implements NormParamsTransferObj<RestModuleParams> {
  exportedProvidersPerRou: Provider[] = [];
  exportedProvidersPerReq: Provider[] = [];
  exportedMultiProvidersPerRou: MultiProvider[] = [];
  exportedMultiProvidersPerReq: MultiProvider[] = [];
  guardsPerMod: NormalizedGuard[] = [];
  resolvedCollisionsPerRou: [any, ModuleType | ModuleWithParams][] = [];
  resolvedCollisionsPerReq: [any, ModuleType | ModuleWithParams][] = [];
  appendsWithParams: AppendsWithParams[] = [];
  appendsModules: ModuleType[] = [];
  controllers: Class[] = [];
  importsWithParams: NormImportsWithParams<RestModuleParams>[] = [];
  /**
   * If the current `baseMeta.modRefId` has the type `ModuleWithParams`,
   * this property will contain the parameters of the current module.
   */
  params: RestModuleParams = {};
}

export type RestModRefId<T extends AnyObj = AnyObj> = ModRefId | AppendsWithParams<T>;
