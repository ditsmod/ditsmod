import { jest } from '@jest/globals';
import type { Logger, Provider, Injector } from '@ditsmod/core';
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
  let extension: TypeormExtension;

  beforeEach(() => {
    EntitiesMetadataStorage.clear();
    providersPerApp = [];
    loggerMock = {
      log: jest.fn(),
    } as any;
    extension = new TypeormExtension(providersPerApp, loggerMock);
  });

  describe('stage1()', () => {
    it('should do nothing if isLastModule is false', async () => {
      providersPerApp.push({
        token: TYPEORM_OPTIONS,
        useValue: { type: 'postgres' },
        multi: true,
      });

      await extension.stage1(false);

      expect(providersPerApp.length).toBe(1);
    });

    it('should do nothing if TYPEORM_OPTIONS is missing', async () => {
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

      providersPerApp.push({
        token: TYPEORM_OPTIONS,
        useValue: {
          manualInitialization: true,
          dataSourceFactory,
          entities: [],
        },
        multi: true,
      });

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

      providersPerApp.push({
        token: TYPEORM_OPTIONS,
        useValue: { name: 'analytics' },
        multi: true,
      });

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
