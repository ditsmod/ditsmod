import { FactoryProvider, ClassProvider, Provider, ValueProvider, TokenProvider } from '@ditsmod/core';

export type Scope = 'App' | 'Mod' | 'Rou' | 'Req';

export interface Meta {
  providersPerApp?: Provider[];
  providersPerMod?: Provider[];
  providersPerRou?: Provider[];
  providersPerReq?: Provider[];
}

export interface TestInlineProviders {
  providers?: Provider[];
}
export type TestClassProvider = ClassProvider & TestInlineProviders;
export type TestFactoryProvider = FactoryProvider & TestInlineProviders;
export type TestProvider = TestClassProvider | TestFactoryProvider | ValueProvider | TokenProvider;
