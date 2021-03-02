import { ClassProvider, ExistingProvider, FactoryProvider, TypeProvider, ValueProvider } from '@ts-stack/di';

/**
 * Describes how the `Injector` should be configured.
 *
 * ### How To Use
 * See `TypeProvider`, `ValueProvider`, `ClassProvider`, `ExistingProvider`, `FactoryProvider`.
 *
 * For more details, see the [Dependency Injection Guide](https://v4.angular.io/guide/dependency-injection).
 */
export declare type ServiceProvider = TypeProvider | ValueProvider | ClassProvider | ExistingProvider | FactoryProvider;
