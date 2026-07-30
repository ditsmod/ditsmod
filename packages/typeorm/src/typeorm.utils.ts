import type { AnyObj } from '@ditsmod/core';
import { InjectionToken } from '@ditsmod/core';
import { DataSource, EntityManager, EntitySchema } from 'typeorm';
import type { Repository } from 'typeorm';

import type { EntityClassOrSchema } from './types.js';
import { DEFAULT_DATA_SOURCE_NAME } from './constants.js';

/**
 * Caches for `InjectionToken` instances to ensure stable identity.
 * Ditsmod DI matches providers to injection sites by token reference equality,
 * so the same `InjectionToken` object must be returned for a given key.
 */
const dataSourceTokens = new Map<string, InjectionToken<DataSource>>();
const entityManagerTokens = new Map<string, InjectionToken<EntityManager>>();
const repositoryTokens = new Map<string, InjectionToken<Repository<any>>>();

/**
 * Returns the DI token for a named or default `DataSource`.
 *
 * For the default data source, the `DataSource` class itself is used as the token.
 * For named data sources, a cached `InjectionToken` is returned.
 */
export function getDataSourceToken(dataSourceName: string = DEFAULT_DATA_SOURCE_NAME): typeof DataSource | InjectionToken<DataSource> {
  if (dataSourceName === DEFAULT_DATA_SOURCE_NAME) {
    return DataSource;
  }
  let token = dataSourceTokens.get(dataSourceName);
  if (!token) {
    token = new InjectionToken<DataSource>(`${dataSourceName}DataSource`);
    dataSourceTokens.set(dataSourceName, token);
  }
  return token;
}

/**
 * Returns the DI token for a named or default `EntityManager`.
 *
 * For the default data source, the `EntityManager` class itself is used as the token.
 * For named data sources, a cached `InjectionToken` is returned.
 */
export function getEntityManagerToken(
  dataSourceName: string = DEFAULT_DATA_SOURCE_NAME,
): typeof EntityManager | InjectionToken<EntityManager> {
  if (dataSourceName === DEFAULT_DATA_SOURCE_NAME) {
    return EntityManager;
  }
  let token = entityManagerTokens.get(dataSourceName);
  if (!token) {
    token = new InjectionToken<EntityManager>(`${dataSourceName}EntityManager`);
    entityManagerTokens.set(dataSourceName, token);
  }
  return token;
}

/**
 * Returns the DI token for an entity's `Repository`.
 *
 * Always returns a cached `InjectionToken` (even for the default data source)
 * because `Repository` is generic and the class reference alone cannot
 * distinguish between `Repository<UserEntity>` and `Repository<PostEntity>`.
 */
export function getRepositoryToken<T extends AnyObj = AnyObj>(
  entity: EntityClassOrSchema<T>,
  dataSourceName: string = DEFAULT_DATA_SOURCE_NAME,
): InjectionToken<Repository<T>> {
  const entityName = getEntityName(entity);
  const prefix = dataSourceName === DEFAULT_DATA_SOURCE_NAME ? '' : `${dataSourceName}_`;
  const key = `${prefix}${entityName}Repository`;
  let token = repositoryTokens.get(key);
  if (!token) {
    token = new InjectionToken<Repository<T>>(key);
    repositoryTokens.set(key, token);
  }
  return token;
}

function getEntityName(entity: EntityClassOrSchema): string {
  if (entity instanceof EntitySchema) {
    return entity.options.target ? entity.options.target.name : entity.options.name;
  }
  return entity.name;
}
