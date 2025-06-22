import { AnyObj, Provider, ModuleType, MultiProvider, Class, Providers } from '@ditsmod/core';

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
  name: string;
  exportedProvidersPerRou: Provider[] = [];
  exportedProvidersPerReq: Provider[] = [];
  exportedMultiProvidersPerRou: MultiProvider[] = [];
  exportedMultiProvidersPerReq: MultiProvider[] = [];
  guardsPerMod: NormalizedGuard[] = [];
  resolvedCollisionsPerRou: [any, ModuleType | RoutingModuleParams][] = [];
  resolvedCollisionsPerReq: [any, ModuleType | RoutingModuleParams][] = [];
  appendsWithParams: AppendsWithParams[] = [];
  appendsModules: ModuleType[] = [];
  controllers: Class[] = [];
}

export type RoutingModRefId<T extends AnyObj = AnyObj> = ModuleType<T> | RoutingModuleParams<T> | AppendsWithParams<T>;
