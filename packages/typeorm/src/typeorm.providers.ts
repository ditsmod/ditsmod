import type { Provider } from '@ditsmod/core';
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
 */
export function createRepositoryProviders(
  entities: EntityClassOrSchema[],
  dataSourceName: string = DEFAULT_DATA_SOURCE_NAME,
): Provider[] {
  const dsToken = getDataSourceToken(dataSourceName);
  return entities.map((entity) => ({
    token: getRepositoryToken(entity, dataSourceName),
    deps: [dsToken],
    useFactory: (dataSource: DataSource) => {
      const entityMetadata = dataSource.entityMetadatas.find((meta) => meta.target === entity);
      const isTreeEntity = typeof entityMetadata?.treeType !== 'undefined';
      return isTreeEntity ? dataSource.getTreeRepository(entity) : dataSource.getRepository(entity);
    },
  }));
}
