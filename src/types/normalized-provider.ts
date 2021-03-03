import { ValueProvider, ClassProvider, ExistingProvider, FactoryProvider } from '@ts-stack/di';

export type NormalizedProvider = ValueProvider | ClassProvider | ExistingProvider | FactoryProvider;
