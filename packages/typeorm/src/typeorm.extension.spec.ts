import { jest } from '@jest/globals';
import type { Logger, Provider } from '@ditsmod/core';
import { Injector } from '@ditsmod/core';
import type { DataSource } from 'typeorm';

import { TYPEORM_OPTIONS } from './constants.js';
import { DataSourceManager } from './data-source-manager.js';
import { EntitiesMetadataStorage } from './entities-metadata-storage.js';
import { TypeormExtension } from './typeorm.extension.js';
import { getDataSourceToken, getEntityManagerToken } from './typeorm.utils.js';

class User {}

describe('TypeormExtension', () => {
  let providersPerApp: Provider[];
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(() => {
    EntitiesMetadataStorage.clear();
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
  });
});
