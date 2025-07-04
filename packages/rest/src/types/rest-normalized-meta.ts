import { AnyObj, Provider, ModuleType, MultiProvider, Class, Providers, ModuleWithParams, DecoratorParams } from '@ditsmod/core';

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

export class RoutingNormalizedMeta<T extends AnyObj = AnyObj> extends RoutingProvidersMetadata {
  /**
   * The module setted here must be identical to the module
   * passed to "imports", "exports" or "appends" array of `@featureModule` metadata.
   */
  modRefId: RoutingModRefId<T>;
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
  params: RoutingModuleParams = {};
}

export type RoutingModRefId<T extends AnyObj = AnyObj> = ModuleType<T> | RoutingModuleParams | AppendsWithParams<T>;
