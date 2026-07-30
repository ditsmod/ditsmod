import { Extension, injectable, inject, PROVIDERS_PER_APP, Injector, isValueProvider } from '@ditsmod/core';
import type { Provider, ValueProvider } from '@ditsmod/core';
import { DataSource } from 'typeorm';
import type { DataSourceOptions, EntityManager } from 'typeorm';

import { TYPEORM_OPTIONS, TYPEORM_ASYNC_OPTIONS, DEFAULT_DATA_SOURCE_NAME } from './constants.js';
import { DataSourceManager } from './data-source-manager.js';
import { EntitiesMetadataStorage } from './entities-metadata-storage.js';
import { initializeWithRetry } from './retry.js';
import { TypeormLogMediator } from './typeorm.log-mediator.js';
import type { TypeormAsyncOptionsDescriptor, TypeormModuleOptions } from './types.js';
import { getDataSourceToken, getEntityManagerToken } from './typeorm.utils.js';

/**
 * Bootstrap extension that initializes `DataSource` instances during
 * application startup and registers them into `providersPerApp`.
 *
 * This extension runs in `stage1()` with `isLastModule` guard to ensure
 * all `TypeormModule.forFeature()` calls have registered their entities
 * in `EntitiesMetadataStorage` before `DataSource` creation.
 *
 * Handles both sync options (from `forRoot()`) and async options
 * (from `forRootAsync()`) in a single `stage1()` pass.
 */
@injectable()
export class TypeormExtension implements Extension<void> {
  constructor(
    @inject(PROVIDERS_PER_APP) protected providersPerApp: Provider[],
    protected log: TypeormLogMediator,
    protected tempInjectorPerMod: Injector,
  ) {}

  async stage1(isLastModule: boolean): Promise<void> {
    if (!isLastModule) {
      return;
    }

    const seenNames = new Set<string>();

    // 1. Process sync options from forRoot()
    const optionsList = this.tempInjectorPerMod.get(TYPEORM_OPTIONS, []);
    for (const options of optionsList) {
      const name = options.name || DEFAULT_DATA_SOURCE_NAME;
      if (seenNames.has(name)) {
        this.log.duplicateDataSourceName(this, name);
      }
      seenNames.add(name);
      await this.initDataSource(options);
    }

    // 2. Process async options from forRootAsync()
    const asyncDescriptors = this.tempInjectorPerMod.get(TYPEORM_ASYNC_OPTIONS, []);
    for (const descriptor of asyncDescriptors) {
      const name = descriptor.name;
      if (seenNames.has(name)) {
        this.log.duplicateDataSourceName(this, name);
      }
      seenNames.add(name);

      const options = await this.resolveAsyncOptions(descriptor);
      // Ensure the name from the descriptor takes precedence
      options.name = name;
      await this.initDataSource(options);
    }
  }

  /**
   * Resolves `TypeormModuleOptions` from an async options descriptor.
   * Supports both `configurationClass` and `useFactory` patterns.
   */
  private async resolveAsyncOptions(descriptor: TypeormAsyncOptionsDescriptor): Promise<TypeormModuleOptions> {
    if ('configurationClass' in descriptor) {
      const factory = this.tempInjectorPerMod.get(descriptor.configurationClass);
      return factory.createTypeormOptions(descriptor.name);
    }
    // useFactory pattern — resolve deps from the injector and call the factory
    const resolvedDeps = descriptor.deps.map((dep: any) => this.tempInjectorPerMod.get(dep));
    return descriptor.useFactory(...resolvedDeps);
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

    // Merge auto-loaded entities (default: true)
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
        this.log,
        this,
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
    // Collect all data source names from both sync and async options
    const syncOptions = this.tempInjectorPerMod.get(TYPEORM_OPTIONS, []);
    const asyncDescriptors = this.tempInjectorPerMod.get(TYPEORM_ASYNC_OPTIONS, []);

    if (syncOptions.length === 0 && asyncDescriptors.length === 0) {
      return;
    }

    // Register each DataSource into the DataSourceManager for shutdown management
    const manager = injectorPerMod.parent?.get(DataSourceManager, null);
    if (!manager) {
      this.log.dataSourceManagerNotFound(this);
      return;
    }

    const allNames = [...syncOptions.map((opt) => opt.name || DEFAULT_DATA_SOURCE_NAME), ...asyncDescriptors.map((d) => d.name)];

    for (const name of allNames) {
      const dsToken = getDataSourceToken(name);
      const dataSource = injectorPerMod.parent?.get(dsToken, null) as DataSource | null;
      if (dataSource) {
        if (!manager.has(name)) {
          manager.register(name, dataSource);
        }
      } else {
        this.log.dataSourceNotFoundInAppInjector(this, name);
      }
    }
  }
}
