import { Extension, injectable, inject, PROVIDERS_PER_APP, Injector, Logger, isValueProvider } from '@ditsmod/core';
import type { Provider, ValueProvider } from '@ditsmod/core';
import { DataSource } from 'typeorm';
import type { DataSourceOptions, EntityManager } from 'typeorm';

import { TYPEORM_OPTIONS, DEFAULT_DATA_SOURCE_NAME } from './constants.js';
import { DataSourceManager } from './data-source-manager.js';
import { EntitiesMetadataStorage } from './entities-metadata-storage.js';
import { initializeWithRetry } from './retry.js';
import type { TypeormModuleOptions } from './types.js';
import { getDataSourceToken, getEntityManagerToken } from './typeorm.utils.js';

/**
 * Bootstrap extension that initializes `DataSource` instances during
 * application startup and registers them into `providersPerApp`.
 *
 * This extension runs in `stage1()` with `isLastModule` guard to ensure
 * all `TypeormModule.forFeature()` calls have registered their entities
 * in `EntitiesMetadataStorage` before `DataSource` creation.
 */
@injectable()
export class TypeormExtension implements Extension<void> {
  constructor(
    @inject(PROVIDERS_PER_APP) protected providersPerApp: Provider[],
    protected logger: Logger,
    protected tempInjectorPerMod: Injector
  ) {}

  async stage1(isLastModule: boolean): Promise<void> {
    if (!isLastModule) {
      return;
    }

    for (const options of this.tempInjectorPerMod.get(TYPEORM_OPTIONS, [])) {
      await this.initDataSource(options);
    }
  }

  private async initDataSource(options: TypeormModuleOptions): Promise<void> {
    const name = options.name || DEFAULT_DATA_SOURCE_NAME;

    // Separate Ditsmod-specific options from DataSourceOptions
    const {
      name: _name,
      retryAttempts,
      retryDelay,
      toRetry,
      autoLoadEntities: autoLoadEntitiesOpt,
      verboseRetryLog,
      manualInitialization,
      dataSourceFactory,
      ...dsOptionsRest
    } = options;

    // Merge auto-loaded entities
    const autoLoadEntities = autoLoadEntitiesOpt !== false;
    let entities = dsOptionsRest.entities;
    if (autoLoadEntities) {
      const collectedEntities = EntitiesMetadataStorage.getEntities(name);
      if (Array.isArray(entities)) {
        entities = [...entities, ...collectedEntities];
      } else {
        entities = collectedEntities;
      }
    }

    // Create DataSource
    const dsOptions = { ...dsOptionsRest, entities } as DataSourceOptions;
    const createDataSource = dataSourceFactory ?? (async (opts: DataSourceOptions) => new DataSource(opts));
    let dataSource = await createDataSource(dsOptions);

    // Initialize with retry (unless manual)
    if (!manualInitialization && !dataSource.isInitialized) {
      dataSource = await initializeWithRetry(
        dataSource,
        { retryAttempts, retryDelay, toRetry, verboseRetryLog },
        this.logger,
        name,
      );
    }

    // Register or update providers into providersPerApp
    const dsToken = getDataSourceToken(name);
    const emToken = getEntityManagerToken(name);

    const dsProvider = this.providersPerApp.find((p) => isValueProvider(p) && p.token === dsToken) as
      ValueProvider<DataSource> | undefined;
    if (dsProvider) {
      dsProvider.useValue = dataSource;
    } else {
      this.providersPerApp.push({ token: dsToken, useValue: dataSource });
    }

    const emProvider = this.providersPerApp.find((p) => isValueProvider(p) && p.token === emToken) as
      ValueProvider<EntityManager> | undefined;
    if (emProvider) {
      emProvider.useValue = dataSource.manager;
    } else {
      this.providersPerApp.push({ token: emToken, useValue: dataSource.manager });
    }
  }

  async stage2(injectorPerMod: Injector): Promise<void> {
    // Register each DataSource into the DataSourceManager for shutdown management
    const manager = injectorPerMod.parent?.get(DataSourceManager, null);
    if (!manager) {
      return;
    }

    for (const options of this.tempInjectorPerMod.get(TYPEORM_OPTIONS, [])) {
      const name = options.name || DEFAULT_DATA_SOURCE_NAME;
      const dsToken = getDataSourceToken(name);
      const dataSource = injectorPerMod.parent?.get(dsToken, null) as DataSource | null;
      if (dataSource) {
        manager.register(name, dataSource);
      }
    }
  }
}
