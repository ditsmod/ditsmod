import { jest } from '@jest/globals';
import type { Logger, Provider } from '@ditsmod/core';
import { Injector } from '@ditsmod/core';
import type { DataSource } from 'typeorm';

import { TYPEORM_OPTIONS } from './constants.js';
import { DataSourceManager } from './data-source-manager.js';
import { DataSourceNameRegistry } from './data-source-name-registry.js';
import { EntitiesMetadataStorage } from './entities-metadata-storage.js';
import { TypeormExtension } from './typeorm.extension.js';
import { getDataSourceToken, getEntityManagerToken } from './typeorm.utils.js';

class User {}
class Post {}

describe('TypeormExtension', () => {
  let providersPerApp: Provider[];
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(() => {
    EntitiesMetadataStorage.clear();
    DataSourceNameRegistry.clear();
    providersPerApp = [];
    loggerMock = {
      log: jest.fn(),
    } as any;
  });

  describe('stage1()', () => {
    it('should do nothing if isLastModule is false', async () => {
      const tempInjectorPerMod = Injector.resolveAndCreate([
        {
          token: TYPEORM_OPTIONS,
          useValue: { type: 'postgres' },
          multi: true,
        },
      ]);
      const extension = new TypeormExtension(providersPerApp, loggerMock, tempInjectorPerMod);

      await extension.stage1(false);

      expect(providersPerApp.length).toBe(0);
    });

    it('should do nothing if TYPEORM_OPTIONS is missing', async () => {
      const extension = new TypeormExtension(providersPerApp, loggerMock, Injector.resolveAndCreate([]));
      await extension.stage1(true);

      expect(providersPerApp.length).toBe(0);
    });

    it('should initialize DataSource and register providers into providersPerApp', async () => {
      EntitiesMetadataStorage.addEntities('default', [User]);

      const mockManager = {};
      const mockDs = {
        isInitialized: true,
        manager: mockManager,
      };

      const dataSourceFactory = jest.fn<any>().mockResolvedValue(mockDs);

      const tempInjectorPerMod = Injector.resolveAndCreate([
        {
          token: TYPEORM_OPTIONS,
          useValue: {
            manualInitialization: true,
            dataSourceFactory,
            entities: [],
          },
          multi: true,
        },
      ]);
      const extension = new TypeormExtension(providersPerApp, loggerMock, tempInjectorPerMod);

      await extension.stage1(true);

      expect(dataSourceFactory).toHaveBeenCalledWith(
        expect.objectContaining({
          entities: [User],
        }),
      );

      const dsToken = getDataSourceToken('default');
      const emToken = getEntityManagerToken('default');

      expect(providersPerApp).toEqual(
        expect.arrayContaining([
          { token: dsToken, useValue: mockDs },
          { token: emToken, useValue: mockManager },
        ]),
      );
    });

    it('should initialize multiple DataSources for multi-datasource options', async () => {
      const mockDefaultDs = { isInitialized: true, manager: {} };
      const mockAnalyticsDs = { isInitialized: true, manager: {} };

      const defaultFactory = jest.fn<any>().mockResolvedValue(mockDefaultDs);
      const analyticsFactory = jest.fn<any>().mockResolvedValue(mockAnalyticsDs);

      const tempInjectorPerMod = Injector.resolveAndCreate([
        {
          token: TYPEORM_OPTIONS,
          useValue: { manualInitialization: true, dataSourceFactory: defaultFactory },
          multi: true,
        },
        {
          token: TYPEORM_OPTIONS,
          useValue: { name: 'analytics', manualInitialization: true, dataSourceFactory: analyticsFactory },
          multi: true,
        },
      ]);
      const extension = new TypeormExtension(providersPerApp, loggerMock, tempInjectorPerMod);

      await extension.stage1(true);

      expect(defaultFactory).toHaveBeenCalledTimes(1);
      expect(analyticsFactory).toHaveBeenCalledTimes(1);

      const defaultDsToken = getDataSourceToken('default');
      const analyticsDsToken = getDataSourceToken('analytics');

      const defaultProvider = providersPerApp.find((p: any) => p.token === defaultDsToken);
      const analyticsProvider = providersPerApp.find((p: any) => p.token === analyticsDsToken);

      expect(defaultProvider).toBeDefined();
      expect(analyticsProvider).toBeDefined();
    });

    it('should skip auto-loaded entities when autoLoadEntities is false', async () => {
      EntitiesMetadataStorage.addEntities('default', [User]);

      const mockDs = { isInitialized: true, manager: {} };
      const dataSourceFactory = jest.fn<any>().mockResolvedValue(mockDs);

      const tempInjectorPerMod = Injector.resolveAndCreate([
        {
          token: TYPEORM_OPTIONS,
          useValue: { manualInitialization: true, autoLoadEntities: false, dataSourceFactory, entities: [] },
          multi: true,
        },
      ]);
      const extension = new TypeormExtension(providersPerApp, loggerMock, tempInjectorPerMod);

      await extension.stage1(true);

      expect(dataSourceFactory).toHaveBeenCalledWith(expect.objectContaining({ entities: [] }));
    });

    it('should merge explicit entities with auto-loaded entities', async () => {
      EntitiesMetadataStorage.addEntities('default', [Post]);

      const mockDs = { isInitialized: true, manager: {} };
      const dataSourceFactory = jest.fn<any>().mockResolvedValue(mockDs);

      const tempInjectorPerMod = Injector.resolveAndCreate([
        {
          token: TYPEORM_OPTIONS,
          // User is explicit, Post is auto-loaded via forFeature
          useValue: { manualInitialization: true, dataSourceFactory, entities: [User] },
          multi: true,
        },
      ]);
      const extension = new TypeormExtension(providersPerApp, loggerMock, tempInjectorPerMod);

      await extension.stage1(true);

      expect(dataSourceFactory).toHaveBeenCalledWith(expect.objectContaining({ entities: [User, Post] }));
    });

    it('should update existing placeholder providers rather than pushing duplicates', async () => {
      const mockDs = { isInitialized: true, manager: {} };
      const dataSourceFactory = jest.fn<any>().mockResolvedValue(mockDs);
      const dsToken = getDataSourceToken('default');
      const emToken = getEntityManagerToken('default');

      // Pre-populate with null placeholders (as forRoot() does)
      providersPerApp.push({ token: dsToken, useValue: null });
      providersPerApp.push({ token: emToken, useValue: null });

      const tempInjectorPerMod = Injector.resolveAndCreate([
        {
          token: TYPEORM_OPTIONS,
          useValue: { manualInitialization: true, dataSourceFactory },
          multi: true,
        },
      ]);
      const extension = new TypeormExtension(providersPerApp, loggerMock, tempInjectorPerMod);

      await extension.stage1(true);

      // Should have updated in-place, not added more providers
      const dsProviders = providersPerApp.filter((p: any) => p.token === dsToken);
      const emProviders = providersPerApp.filter((p: any) => p.token === emToken);

      expect(dsProviders).toHaveLength(1);
      expect(emProviders).toHaveLength(1);
      expect((dsProviders[0] as any).useValue).toBe(mockDs);
    });
  });

  describe('stage2()', () => {
    it('should register created DataSource into DataSourceManager', async () => {
      const mockManager = {
        register: jest.fn(),
      };
      const mockDs = {} as DataSource;

      const tempInjectorPerMod = Injector.resolveAndCreate([
        {
          token: TYPEORM_OPTIONS,
          useValue: { name: 'analytics' },
          multi: true,
        },
      ]);
      const extension = new TypeormExtension(providersPerApp, loggerMock, tempInjectorPerMod);

      const parentInjector = {
        get: jest.fn((token) => {
          if (token === DataSourceManager) {
            return mockManager;
          }
          if (token === getDataSourceToken('analytics')) {
            return mockDs;
          }
          return null;
        }),
      } as unknown as Injector;

      const injectorPerMod = {
        parent: parentInjector,
      } as Injector;

      await extension.stage2(injectorPerMod);

      expect(mockManager.register).toHaveBeenCalledWith('analytics', mockDs);
    });

    it('should do nothing when TYPEORM_OPTIONS is empty', async () => {
      const extension = new TypeormExtension(providersPerApp, loggerMock, Injector.resolveAndCreate([]));
      const parentInjector = { get: jest.fn() } as unknown as Injector;
      const injectorPerMod = { parent: parentInjector } as Injector;

      await extension.stage2(injectorPerMod);

      expect(parentInjector.get).not.toHaveBeenCalled();
    });

    it('should warn when DataSourceManager is not found in app injector', async () => {
      const tempInjectorPerMod = Injector.resolveAndCreate([
        {
          token: TYPEORM_OPTIONS,
          useValue: { name: 'default' },
          multi: true,
        },
      ]);
      const extension = new TypeormExtension(providersPerApp, loggerMock, tempInjectorPerMod);

      const parentInjector = {
        get: jest.fn().mockReturnValue(null),
      } as unknown as Injector;
      const injectorPerMod = { parent: parentInjector } as Injector;

      await extension.stage2(injectorPerMod);

      expect(loggerMock.log).toHaveBeenCalledWith('warn', expect.stringContaining('DataSourceManager'));
    });

    it('should warn when a DataSource is not found in app injector', async () => {
      const mockManager = { register: jest.fn() };

      const tempInjectorPerMod = Injector.resolveAndCreate([
        {
          token: TYPEORM_OPTIONS,
          useValue: { name: 'missing' },
          multi: true,
        },
      ]);
      const extension = new TypeormExtension(providersPerApp, loggerMock, tempInjectorPerMod);

      const parentInjector = {
        get: jest.fn((token) => {
          if (token === DataSourceManager) return mockManager;
          return null; // DataSource not found
        }),
      } as unknown as Injector;
      const injectorPerMod = { parent: parentInjector } as Injector;

      await extension.stage2(injectorPerMod);

      expect(mockManager.register).not.toHaveBeenCalled();
      expect(loggerMock.log).toHaveBeenCalledWith('warn', expect.stringContaining('"missing"'));
    });
  });
});
