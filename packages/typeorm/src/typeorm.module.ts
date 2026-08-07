import { featureModule, getTokens } from '@holu/core';
import type { DynamicModule, Provider } from '@holu/core';

import { TYPEORM_OPTIONS, TYPEORM_ASYNC_OPTIONS, DEFAULT_DATA_SOURCE_NAME } from './constants.js';
import { TypeormExtension } from './typeorm.extension.js';
import { EntitiesMetadataStorage } from './entities-metadata-storage.js';
import { createRepositoryProviders } from './typeorm.providers.js';
import { getDataSourceToken, getEntityManagerToken } from './typeorm.utils.js';
import type { EntityClassOrSchema, TypeormAsyncOptionsDescriptor, TypeormModuleAsyncOptions, TypeormModuleOptions } from './types.js';
import { DataSourceManager } from './data-source-manager.js';
import { TypeormLogMediator } from './typeorm.log-mediator.js';

/**
 * Holu integration module for TypeORM (>= v1.0.0).
 *
 * ## Usage
 *
 * **Root module** — configures a `DataSource`:
 * ```ts
 * @restRootModule({
 *   imports: [TypeormModule.forRoot({ type: 'postgres', ... })],
 * })
 * export class AppModule {}
 * ```
 *
 * **Async configuration** — resolves options from a DI-managed class:
 * ```ts
 * @restRootModule({
 *   imports: [TypeormModule.forRootAsync({ configurationClass: DbConfigFactory })],
 * })
 * export class AppModule {}
 * ```
 *
 * **Feature module** — registers entities and creates repository providers:
 * ```ts
 * @restModule({
 *   imports: [TypeormModule.forFeature([UserEntity, PostEntity])],
 * })
 * export class UserModule {}
 * ```
 */
@featureModule({
  providersPerApp: [DataSourceManager, TypeormLogMediator],
  extensions: [
    {
      extension: TypeormExtension,
      exportOnly: true,
    },
  ],
})
export class TypeormModule {
  /**
   * Configures and registers a TypeORM `DataSource` at the application level.
   * Call this in the root module (`AppModule`).
   *
   * For multiple databases, call `forRoot()` multiple times with distinct `name` values.
   *
   * @param options TypeORM data source options combined with Holu-specific settings
   *   (retry, autoLoadEntities, etc.).
   */
  static forRoot(options: TypeormModuleOptions = {}): DynamicModule<TypeormModule> {
    const name = options.name || DEFAULT_DATA_SOURCE_NAME;
    const dsToken = getDataSourceToken(name);
    const emToken = getEntityManagerToken(name);

    return {
      module: this,
      providersPerApp: [
        {
          token: TYPEORM_OPTIONS,
          useValue: options,
          multi: true,
        },
        {
          token: dsToken,
          useValue: null,
        },
        {
          token: emToken,
          useValue: null,
        },
      ],
    };
  }

  /**
   * Configures a TypeORM `DataSource` using an async configuration source.
   *
   * Use this when the `DataSource` options must be resolved from a DI-managed
   * service (e.g., a `ConfigService`) rather than being provided as a plain object.
   *
   * Provide **either** `configurationClass` or `useFactory` (not both):
   *
   * - **`configurationClass`** — an `@injectable()` class implementing
   *   `TypeormOptionsFactory`. Its constructor dependencies are resolved from
   *   `providersPerApp`.
   * - **`useFactory`** — a factory function returning `TypeormModuleOptions`
   *   (sync or async). Pass `deps` to inject arguments into the factory.
   *
   * @example
   * ```ts
   * // Using configurationClass
   * TypeormModule.forRootAsync({ configurationClass: DbConfigFactory })
   *
   * // Using useFactory + deps
   * TypeormModule.forRootAsync({
   *   useFactory: (config: ConfigService) => ({
   *     type: 'postgres',
   *     host: config.get('DB_HOST'),
   *   }),
   *   deps: [ConfigService],
   * })
   * ```
   */
  static forRootAsync(asyncOptions: TypeormModuleAsyncOptions): DynamicModule<TypeormModule> {
    const name = asyncOptions.name || DEFAULT_DATA_SOURCE_NAME;
    const dsToken = getDataSourceToken(name);
    const emToken = getEntityManagerToken(name);

    const providersPerApp: Provider[] = [
      { token: dsToken, useValue: null },
      { token: emToken, useValue: null },
    ];

    let descriptor: TypeormAsyncOptionsDescriptor;
    if (asyncOptions.configurationClass) {
      // Register the class so DI can resolve its constructor dependencies
      providersPerApp.push(asyncOptions.configurationClass);
      descriptor = { name, configurationClass: asyncOptions.configurationClass };
    } else if (asyncOptions.useFactory) {
      descriptor = { name, useFactory: asyncOptions.useFactory, deps: asyncOptions.deps || [] };
    } else {
      throw new Error('TypeormModule.forRootAsync() requires either "configurationClass" or "useFactory" to be provided.');
    }

    providersPerApp.push({
      token: TYPEORM_ASYNC_OPTIONS,
      useValue: descriptor,
      multi: true,
    });

    return {
      module: this,
      providersPerApp,
    };
  }

  /**
   * Registers entity classes in the current feature module and creates
   * `Repository<Entity>` providers for each.
   *
   * The created repositories are available for injection via
   * `@injectRepository(Entity)` or `@inject(getRepositoryToken(Entity))`.
   *
   * Entities are automatically collected into `EntitiesMetadataStorage`
   * for auto-loading into the `DataSource` (when `autoLoadEntities` is enabled).
   *
   * @param entities Array of entity classes or `EntitySchema` instances.
   * @param dataSourceName Optional data source name for multi-database setups.
   *   Defaults to `'default'`.
   */
  static forFeature(
    entities: EntityClassOrSchema[] = [],
    dataSourceName: string = DEFAULT_DATA_SOURCE_NAME,
  ): DynamicModule<TypeormModule> {
    EntitiesMetadataStorage.addEntities(dataSourceName, [...entities]);

    const repositoryProviders = createRepositoryProviders(entities, dataSourceName);

    return {
      module: this,
      providersPerMod: [...repositoryProviders],
      exports: [...getTokens(repositoryProviders)],
    };
  }
}
