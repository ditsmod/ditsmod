import { controller, route } from '@ditsmod/rest';
import { InjectDataSource, InjectEntityManager } from '@ditsmod/typeorm';
import type { DataSource, EntityManager } from 'typeorm';

@controller()
export class SystemController {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectEntityManager() private entityManager: EntityManager,
  ) {}

  @route('GET', 'db-status')
  getStatus() {
    return {
      isConnected: this.dataSource.isInitialized,
      hasEntityManager: !!this.entityManager,
    };
  }
}
