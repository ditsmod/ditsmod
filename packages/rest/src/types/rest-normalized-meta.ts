import {
  AnyObj,
  Provider,
  ModuleType,
  MultiProvider,
  Class,
  Providers,
  ModuleWithParams,
  ModRefId,
  DecoratorParams,
} from '@ditsmod/core';

import { NormalizedGuard } from '#interceptors/guard.js';
import { AppendsWithParams, RoutingModuleParams } from '#module/module-metadata.js';

export interface RoutingRawProvidersMetadata {
  providersPerApp?: Providers | Provider[];
  providersPerMod?: Providers | Provider[];
  providersPerRou?: Providers | Provider[];
  providersPerReq?: Providers | Provider[];
}

export class RoutingProvidersMetadata {
  providersPerRou: Provider[] = [];
  providersPerReq: Provider[] = [];
}

export class RoutingNormalizedMeta extends RoutingProvidersMetadata {
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
  importParams: DecoratorParams<RoutingModuleParams>[] = [];
  /**
   * If the current `baseMeta.modRefId` has the type `ModuleWithParams`,
   * this property will label the parameters of the current module.
   */
  params: RoutingModuleParams = {};
}

export type RoutingModRefId<T extends AnyObj = AnyObj> = ModRefId | AppendsWithParams<T>;
