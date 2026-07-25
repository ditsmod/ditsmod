import { controller, route } from '@ditsmod/rest';
import { injectDataSource, injectEntityManager } from '@ditsmod/typeorm';
import type { DataSource, EntityManager } from 'typeorm';

@controller()
export class SystemController {
  constructor(
    @injectDataSource() private dataSource: DataSource,
    @injectEntityManager() private entityManager: EntityManager,
  ) {}

  @route('GET', 'db-status')
  getStatus() {
    return {
      isConnected: this.dataSource.isInitialized,
      hasEntityManager: !!this.entityManager,
    };
  }
}
