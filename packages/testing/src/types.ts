import { Class, Extension, Provider, Providers } from '@ditsmod/core';

export type Level = BaseLevel | RestLevel;
export type BaseLevel = 'App' | 'Mod';
export type RestLevel = 'Rou' | 'Req';

export interface ProvidersOnly <T = Providers | Provider[]> {
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
