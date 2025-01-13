import { Provider, Stage1GroupMeta, Stage1GroupMeta2, ExtensionsGroupToken, Providers } from '@ditsmod/core';

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
export interface GroupMetaOverrider<T = any> {
  (stage1GroupMeta: Stage1GroupMeta<T> | Stage1GroupMeta2<T>): void;
}

export interface OverriderConfig {
  groupToken: ExtensionsGroupToken;
  override: GroupMetaOverrider;
}
