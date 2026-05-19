import type { Provider, Providers, Stage1ExtensionMeta, Stage1ExtensionMeta2, Extension, Class, ForwardRefFn } from '@ditsmod/core';
import { TestRestApplication } from './test-application.js';

export type Level = 'App' | 'Mod' | 'Rou' | 'Req';

export class ProvidersOnly <T = Providers | (Provider | ForwardRefFn<Provider>)[]> {
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
  (stage1ExtensionMeta: Stage1ExtensionMeta<T> | Stage1ExtensionMeta2<T>): void;
}

export interface OverriderConfig {
  ExtCls: Class<Extension>;
  override: ExtensionMetaOverrider;
}
