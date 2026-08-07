import type { Class } from '@holu/core';
import type { DataSource, DataSourceOptions, EntitySchema } from 'typeorm';

export type EntityClassOrSchema<T = any> = Class<T> | EntitySchema<T>;

export type TypeormModuleOptions = {
  /**
   * Holu-level datasource identifier for multi-database support.
   * Defaults to 'default'.
   */
  name?: string;
  /**
   * Number of retry attempts for DataSource initialization.
   * @default 9
   */
  retryAttempts?: number;
  /**
   * Delay in ms between retry attempts.
   * @default 3000
   */
  retryDelay?: number;
  /**
   * Predicate to decide whether a failed initialization should be retried.
   * If the function returns `false`, the error is thrown immediately.
   */
  toRetry?: (err: any) => boolean;
  /**
   * If `true`, entities registered via `forFeature()` are automatically
   * merged into the DataSource options.
   * @default true
   */
  autoLoadEntities?: boolean;
  /**
   * If `true`, verbose error messages are logged on each retry attempt.
   */
  verboseRetryLog?: boolean;
  /**
   * If `true`, `DataSource.initialize()` is NOT called during bootstrap.
   * The user is responsible for calling it manually.
   */
  manualInitialization?: boolean;
  /**
   * Optional custom factory for creating the DataSource instance.
   * When provided, this factory is called instead of `new DataSource(options)`.
   */
  dataSourceFactory?: (options: DataSourceOptions) => Promise<DataSource>;
} & Partial<DataSourceOptions>;

/**
 * Interface that a configuration class must implement to provide
 * `TypeormModuleOptions` for `TypeormModule.forRootAsync()`.
 *
 * @example
 * ```ts
 * @injectable()
 * class DbConfigFactory implements TypeormOptionsFactory {
 *   constructor(private configService: ConfigService) {}
 *
 *   createTypeormOptions(): TypeormModuleOptions {
 *     return {
 *       type: 'postgres',
 *       host: this.configService.get('DB_HOST'),
 *       database: this.configService.get('DB_NAME'),
 *     };
 *   }
 * }
 * ```
 */
export interface TypeormOptionsFactory {
  createTypeormOptions(dataSourceName?: string): TypeormModuleOptions | Promise<TypeormModuleOptions>;
}

/**
 * Options for `TypeormModule.forRootAsync()`.
 *
 * Provide **either** `configurationClass` or `useFactory` (not both).
 */
export type TypeormModuleAsyncOptions = {
  /**
   * Data source name for multi-database setups. Defaults to `'default'`.
   */
  name?: string;
  /**
   * An `@injectable()` class implementing `TypeormOptionsFactory`.
   * The class is instantiated by Holu's DI, so its constructor
   * dependencies are resolved automatically from `providersPerApp`.
   *
   * Cannot be used together with `useFactory`.
   */
  configurationClass?: Class<TypeormOptionsFactory>;
  /**
   * Factory function that returns `TypeormModuleOptions` (sync or async).
   * Cannot be used together with `configurationClass`.
   */
  useFactory?: (...args: any[]) => TypeormModuleOptions | Promise<TypeormModuleOptions>;
  /**
   * Tokens to inject as arguments into the `useFactory` function.
   * Only used when `useFactory` is provided.
   */
  deps?: any[];
};

/**
 * Internal descriptor stored in the `TYPEORM_ASYNC_OPTIONS` multi-provider.
 * Consumed by `TypeormExtension.stage1()` to resolve async options.
 */
export type TypeormAsyncOptionsDescriptor =
  | { name: string; configurationClass: Class<TypeormOptionsFactory> }
  | { name: string; useFactory: (...args: any[]) => TypeormModuleOptions | Promise<TypeormModuleOptions>; deps: any[] };
