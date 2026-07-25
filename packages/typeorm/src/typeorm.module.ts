import { featureModule, getTokens } from '@ditsmod/core';
import type { DynamicModule } from '@ditsmod/core';

import { TYPEORM_OPTIONS, DEFAULT_DATA_SOURCE_NAME } from './constants.js';
import { TypeormExtension } from './typeorm.extension.js';
import { EntitiesMetadataStorage } from './entities-metadata-storage.js';
import { createRepositoryProviders } from './typeorm.providers.js';
import { getDataSourceToken, getEntityManagerToken } from './typeorm.utils.js';
import type { EntityClassOrSchema, TypeormModuleOptions } from './types.js';
import { DataSourceManager } from './data-source-manager.js';
import { TypeormLogMediator } from './typeorm.log-mediator.js';

/**
 * Ditsmod integration module for TypeORM (>= v1.0.0).
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
 * **Feature module** — registers entities and creates repository providers:
 * ```ts
 * @restModule({
 *   imports: [TypeormModule.forFeature([User, Post])],
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
   * @param options TypeORM data source options combined with Ditsmod-specific settings
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
