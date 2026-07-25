import { inject } from '@ditsmod/core';

import type { EntityClassOrSchema } from './types.js';
import { getRepositoryToken, getDataSourceToken, getEntityManagerToken } from './typeorm.utils.js';

/**
 * Parameter decorator that injects the `Repository` for the given entity.
 *
 * @example
 * ```ts
 * constructor(@injectRepository(User) private userRepo: Repository<User>) {}
 * ```
 */
export const injectRepository = (entity: EntityClassOrSchema, dataSourceName?: string): ReturnType<typeof inject> =>
  inject(getRepositoryToken(entity, dataSourceName));

/**
 * Parameter decorator that injects the `DataSource` (default or named).
 *
 * @example
 * ```ts
 * constructor(@injectDataSource() private ds: DataSource) {}
 * constructor(@injectDataSource('analytics') private analyticsDs: DataSource) {}
 * ```
 */
export const injectDataSource = (dataSourceName?: string): ReturnType<typeof inject> =>
  inject(getDataSourceToken(dataSourceName) as any);

/**
 * Parameter decorator that injects the `EntityManager` (default or named).
 *
 * @example
 * ```ts
 * constructor(@injectEntityManager() private em: EntityManager) {}
 * ```
 */
export const injectEntityManager = (dataSourceName?: string): ReturnType<typeof inject> =>
  inject(getEntityManagerToken(dataSourceName) as any);
