import { Provider, Providers, Stage1ExtensionMeta, Stage1ExtensionMeta2, Extension, Class } from '@ditsmod/core';

export type Level = 'App' | 'Mod' | 'Rou' | 'Req';

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
  (stage1ExtensionMeta: Stage1ExtensionMeta<T> | Stage1ExtensionMeta2<T>): void;
}

export interface OverriderConfig {
  ExtCls: Class<Extension>;
  override: ExtensionMetaOverrider;
}
