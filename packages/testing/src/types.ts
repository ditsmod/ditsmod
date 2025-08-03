import { Class, Extension, Provider, Providers } from '@ditsmod/core';

export type Level = 'App' | 'Mod' | 'Rou' | 'Req';

export interface Meta <T = Providers | Provider[]> {
  providersPerApp?: T;
  providersPerMod?: T;
  providersPerRou?: T;
  providersPerReq?: T;
}

/**
 * The callback that is passed as the second argument to the `testApplication.overrideExtensionMeta()` method.
 */
export interface ExtensionMetaOverrider<T = any> {
  (stage1ExtensionMeta: any): void;
}

export interface OverriderConfig {
  ExtCls: Class<Extension>;
  override: ExtensionMetaOverrider;
}
