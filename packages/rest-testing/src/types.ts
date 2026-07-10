import type { Provider, Providers, ExtensionGroupMeta, PartialExtensionGroupMeta, Extension, Class, ForwardRefFn } from '@ditsmod/core';
import { TestRestApplication } from './test-application.js';

export type Level = 'App' | 'Mod' | 'Rou' | 'Req';

export class ProvidersByLevel <T = Providers | (Provider | ForwardRefFn<Provider>)[]> {
  providersPerApp = [] as T;
  providersPerMod = [] as T;
  providersPerRou = [] as T;
  providersPerReq = [] as T;
}

/**
 * The callback that is passed as the second argument
 * to the {@link TestRestApplication.overrideExtensionMeta | testRestApplication.overrideExtensionMeta()} method.
 */
export interface ExtensionMetaOverrider<T = any> {
  (extensionGroupMeta: ExtensionGroupMeta<T> | PartialExtensionGroupMeta<T>): void;
}

export interface OverriderConfig {
  ExtCls: Class<Extension>;
  override: ExtensionMetaOverrider;
}
