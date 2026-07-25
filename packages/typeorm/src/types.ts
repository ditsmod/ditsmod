import type { Class } from '@ditsmod/core';
import type { DataSource, DataSourceOptions, EntitySchema } from 'typeorm';

export type EntityClassOrSchema<T = any> = Class<T> | EntitySchema<T>;

export type TypeormModuleOptions = {
  /**
   * Ditsmod-level datasource identifier for multi-database support.
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
