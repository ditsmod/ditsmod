import {
  AnyObj,
  Provider,
  ModuleType,
  BaseModuleWithParams,
  MultiProvider,
  Class,
  ProvidersMetadata,
  Providers,
} from '@ditsmod/core';

import { NormalizedGuard } from '#interceptors/guard.js';
import { AppendsWithParams, RoutingRawMeta } from '#module/module-metadata.js';

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
  modRefId: ModuleType<T> | BaseModuleWithParams<T> | AppendsWithParams<T>;
  name: string;
  rawMeta: RoutingRawMeta;
  exportedProvidersPerRou: Provider[] = [];
  exportedProvidersPerReq: Provider[] = [];
  exportedMultiProvidersPerRou: MultiProvider[] = [];
  exportedMultiProvidersPerReq: MultiProvider[] = [];
  guardsPerMod: NormalizedGuard[] = [];
  resolvedCollisionsPerRou: [any, ModuleType | BaseModuleWithParams][] = [];
  resolvedCollisionsPerReq: [any, ModuleType | BaseModuleWithParams][] = [];
  appendsWithParams: AppendsWithParams[] = [];
  appendsModules: ModuleType[] = [];
  controllers: Class[] = [];
}
