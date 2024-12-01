import { FactoryProvider, ClassProvider, Provider, ValueProvider, TokenProvider } from '@ditsmod/core';

export interface TestInlineProviders {
  providers?: Provider[];
}
export type TestClassProvider = ClassProvider & TestInlineProviders;
export type TestFactoryProvider = FactoryProvider & TestInlineProviders;
export type TestProvider = TestClassProvider | TestFactoryProvider | ValueProvider | TokenProvider | Provider;
