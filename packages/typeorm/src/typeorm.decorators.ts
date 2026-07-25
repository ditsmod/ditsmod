import { inject } from '@ditsmod/core';

import type { EntityClassOrSchema } from './types.js';
import { getRepositoryToken, getDataSourceToken, getEntityManagerToken } from './typeorm.utils.js';

/**
 * Parameter decorator that injects the `Repository` for the given entity.
 *
 * @example
 * ```ts
 * constructor(@InjectRepository(User) private userRepo: Repository<User>) {}
 * ```
 */
export const InjectRepository = (entity: EntityClassOrSchema, dataSourceName?: string): ReturnType<typeof inject> =>
  inject(getRepositoryToken(entity, dataSourceName));

/**
 * Parameter decorator that injects the `DataSource` (default or named).
 *
 * @example
 * ```ts
 * constructor(@InjectDataSource() private ds: DataSource) {}
 * constructor(@InjectDataSource('analytics') private analyticsDs: DataSource) {}
 * ```
 */
export const InjectDataSource = (dataSourceName?: string): ReturnType<typeof inject> =>
  inject(getDataSourceToken(dataSourceName) as any);

/**
 * Parameter decorator that injects the `EntityManager` (default or named).
 *
 * @example
 * ```ts
 * constructor(@InjectEntityManager() private em: EntityManager) {}
 * ```
 */
export const InjectEntityManager = (dataSourceName?: string): ReturnType<typeof inject> =>
  inject(getEntityManagerToken(dataSourceName) as any);
