import type { EntityClassOrSchema } from './types.js';

/**
 * Static registry that collects entity classes from `TypeormModule.forFeature()`
 * calls, keyed by data source name. This data is consumed at bootstrap time
 * by `TypeormExtension` to merge entities into `DataSourceOptions`.
 *
 * This uses a static `Map` rather than DI because entity registration happens
 * at module-decorator evaluation time (before injectors are created).
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

  static clear(): void {
    this.storage.clear();
  }
}
