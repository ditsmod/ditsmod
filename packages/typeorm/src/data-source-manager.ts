import { injectable, Logger, OnShutdown } from '@ditsmod/core';
import type { DataSource } from 'typeorm';

import { DataSourceNameRegistry } from './data-source-name-registry.js';

/**
 * Centralized manager for all `DataSource` instances registered via
 * `TypeormModule.forRoot()`. Implements `OnShutdown` to gracefully
 * destroy all connections during application shutdown.
 */
@injectable()
export class DataSourceManager implements OnShutdown {
  private readonly dataSources = new Map<string, DataSource>();

  constructor(private logger: Logger) {
    // Make the registry use the same logger as the application
    DataSourceNameRegistry.setLogger(logger);
  }

  register(name: string, dataSource: DataSource): void {
    if (this.dataSources.has(name)) {
      this.logger.log('warn', `DataSource "${name}" is already registered. It will be overwritten.`);
    }
    this.dataSources.set(name, dataSource);
  }

  get(name: string): DataSource | undefined {
    return this.dataSources.get(name);
  }

  getAll(): Map<string, DataSource> {
    return new Map(this.dataSources);
  }

  async onShutdown(): Promise<void> {
    const destroyPromises: Promise<void>[] = [];
    for (const [name, ds] of this.dataSources) {
      DataSourceNameRegistry.unregister(name);
      if (ds.isInitialized) {
        destroyPromises.push(
          ds.destroy().catch((err) => {
            this.logger.log('error', `Failed to close DataSource "${name}": ${err.message}`);
          }),
        );
      }
    }
    await Promise.allSettled(destroyPromises);
    this.dataSources.clear();
  }
}
