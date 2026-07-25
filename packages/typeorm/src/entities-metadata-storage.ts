import type { EntityClassOrSchema } from './types.js';

/**
 * Static registry that collects entity classes from `TypeormModule.forFeature()`
 * calls, keyed by data source name. This data is consumed at bootstrap time
 * by `TypeormExtension` to merge entities into `DataSourceOptions`.
 *
 * ## ⚠️ Static State Warning
 *
 * This class uses a **process-level static `Map`**. Entity registrations persist
 * for the lifetime of the Node.js process and are **not** scoped to a single
 * application instance. This has two implications:
 *
 * 1. **In tests**: always call `EntitiesMetadataStorage.clear()` (or
 *    `clearForDataSource(name)`) in `beforeEach` / `afterEach` to prevent
 *    entity leakage across test suites running in the same process.
 *
 * 2. **Multiple app instances**: if you create more than one application
 *    instance in the same process (e.g. a test harness), entities registered
 *    for one instance are visible to all others. Use `clearForDataSource()`
 *    for targeted cleanup.
 *
 * Entity registration happens at module-decorator evaluation time — before DI
 * injectors are created — so a DI-managed registry is not feasible here.
 */
export class EntitiesMetadataStorage {
  private static readonly storage = new Map<string, EntityClassOrSchema[]>();

  static addEntities(dataSourceName: string, entities: EntityClassOrSchema[]): void {
    let collection = this.storage.get(dataSourceName);
    if (!collection) {
      collection = [];
      this.storage.set(dataSourceName, collection);
    }
    for (const entity of entities) {
      if (!collection.includes(entity)) {
        collection.push(entity);
      }
    }
  }

  static getEntities(dataSourceName: string): EntityClassOrSchema[] {
    return this.storage.get(dataSourceName) || [];
  }

  /**
   * Removes all entities for a single named data source.
   * Prefer this over `clear()` when only a specific data source's state
   * needs to be reset (e.g. in per-test teardown for multi-database setups).
   */
  static clearForDataSource(dataSourceName: string): void {
    this.storage.delete(dataSourceName);
  }

  /** Removes all registered entities for all data sources. */
  static clear(): void {
    this.storage.clear();
  }
}
