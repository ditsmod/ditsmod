import { injectable, OnShutdown } from '@ditsmod/core';
import type { DataSource } from 'typeorm';

import { TypeormLogMediator } from './typeorm.log-mediator.js';

/**
 * Centralized manager for all `DataSource` instances registered via
 * `TypeormModule.forRoot()`. Implements `OnShutdown` to gracefully
 * destroy all connections during application shutdown.
 */
@injectable()
export class DataSourceManager implements OnShutdown {
  private readonly dataSources = new Map<string, DataSource>();

  constructor(private log: TypeormLogMediator) {}

  register(name: string, dataSource: DataSource): void {
    if (this.dataSources.has(name)) {
      this.log.duplicateDataSourceRegistration(this, name);
    }
    this.dataSources.set(name, dataSource);
  }

  get(name: string): DataSource | undefined {
    return this.dataSources.get(name);
  }

  has(name: string): boolean {
    return this.dataSources.has(name);
  }

  getAll(): Map<string, DataSource> {
    return new Map(this.dataSources);
  }

  async onShutdown(): Promise<void> {
    const destroyPromises: Promise<void>[] = [];
    for (const [name, ds] of this.dataSources) {
      if (ds.isInitialized) {
        destroyPromises.push(
          ds.destroy().catch((err) => {
            this.log.failedToCloseDataSource(this, name, err);
          }),
        );
      }
    }
    await Promise.allSettled(destroyPromises);
    this.dataSources.clear();
  }
}
