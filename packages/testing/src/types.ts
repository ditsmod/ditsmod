import {
  FactoryProvider,
  ClassProvider,
  Provider,
  ValueProvider,
  TokenProvider,
  Stage1GroupMeta,
  Stage1GroupMeta2,
  ExtensionsGroupToken,
} from '@ditsmod/core';

export interface TestInlineProviders {
  providers?: Provider[];
}
export type TestClassProvider = ClassProvider & TestInlineProviders;
export type TestFactoryProvider = FactoryProvider & TestInlineProviders;
export type TestProvider = TestClassProvider | TestFactoryProvider | ValueProvider | TokenProvider | Provider;
export type Scope = 'App' | 'Mod' | 'Rou' | 'Req';

export interface Meta {
  providersPerApp?: Provider[];
  providersPerMod?: Provider[];
  providersPerRou?: Provider[];
  providersPerReq?: Provider[];
}

/**
 * The callback that is passed as the second argument to the `testApplication.overrideDynamic()` method.
 */
export interface GroupMetaOverrider<T = any> {
  (stage1GroupMeta: Stage1GroupMeta<T> | Stage1GroupMeta2<T>): void;
}

export interface OverriderConfig {
  groupToken: ExtensionsGroupToken;
  override: GroupMetaOverrider;
}
