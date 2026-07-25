import type { FunctionFactoryProvider } from '@ditsmod/core';
import type { DataSource } from 'typeorm';

import type { EntityClassOrSchema } from './types.js';
import { getDataSourceToken, getRepositoryToken } from './typeorm.utils.js';
import { DEFAULT_DATA_SOURCE_NAME } from './constants.js';

/**
 * Creates `FunctionFactoryProvider` entries for each entity, producing
 * the appropriate `Repository` instance from the `DataSource`.
 *
 * Tree entities automatically receive a `TreeRepository`.
 * MongoDB repositories are not supported (TypeORM v1.0.0 dropped MongoDB).
 *
 * @throws If the `DataSource` has not been initialized yet (e.g. when
 *   `manualInitialization: true` and `DataSource.initialize()` has not been
 *   called before the first injection). Call `initialize()` before injecting
 *   any repository.
 */
export function createRepositoryProviders(
  entities: EntityClassOrSchema[],
  dataSourceName: string = DEFAULT_DATA_SOURCE_NAME,
): FunctionFactoryProvider[] {
  const dsToken = getDataSourceToken(dataSourceName);
  return entities.map((entity) => ({
    token: getRepositoryToken(entity, dataSourceName),
    deps: [dsToken],
    useFactory: (dataSource: DataSource) => {
      if (!dataSource.isInitialized) {
        throw new Error(
          `Cannot get repository for "${(entity as { name?: string }).name ?? String(entity)}" ` +
            `because the DataSource "${dataSourceName}" is not initialized. ` +
            'If you set manualInitialization: true, call DataSource.initialize() ' +
            'before injecting any repositories.',
        );
      }
      const entityMetadata = dataSource.entityMetadatas.find((meta) => meta.target === entity);
      const isTreeEntity = typeof entityMetadata?.treeType !== 'undefined';
      return isTreeEntity ? dataSource.getTreeRepository(entity) : dataSource.getRepository(entity);
    },
  }));
}
