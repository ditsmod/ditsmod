import { jest } from '@jest/globals';
import type { Provider } from '@ditsmod/core';

import { DataSourceNameRegistry } from './data-source-name-registry.js';
import { EntitiesMetadataStorage } from './entities-metadata-storage.js';
import { TYPEORM_OPTIONS } from './constants.js';
import { TypeormModule } from './typeorm.module.js';
import { getDataSourceToken, getEntityManagerToken } from './typeorm.utils.js';

class User {}
class Post {}

describe('TypeormModule', () => {
  beforeEach(() => {
    EntitiesMetadataStorage.clear();
    DataSourceNameRegistry.clear();
  });

  describe('forRoot()', () => {
    it('should return DynamicModule with TYPEORM_OPTIONS in providersPerApp', () => {
      const options = { type: 'postgres' as const, database: 'test_db' };
      const dynamicModule = TypeormModule.forRoot(options);

      expect(dynamicModule.module).toBe(TypeormModule);
      expect(dynamicModule.providersPerApp).toEqual([
        {
          token: TYPEORM_OPTIONS,
          useValue: options,
          multi: true,
        },
        {
          token: getDataSourceToken('default'),
          useValue: null,
        },
        {
          token: getEntityManagerToken('default'),
          useValue: null,
        },
      ]);
    });

    it('should register the data source name in DataSourceNameRegistry', () => {
      TypeormModule.forRoot({ name: 'analytics' });

      expect(DataSourceNameRegistry.has('analytics')).toBe(true);
    });

    it('should register "default" when no name is provided', () => {
      TypeormModule.forRoot();

      expect(DataSourceNameRegistry.has('default')).toBe(true);
    });

    it('should warn via console.warn when same name is registered twice', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      TypeormModule.forRoot({ name: 'default' });
      TypeormModule.forRoot({ name: 'default' });

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"default"'));
      consoleSpy.mockRestore();
    });
  });

  describe('forFeature()', () => {
    it('should add entities to EntitiesMetadataStorage and return repository providers', () => {
      const dynamicModule = TypeormModule.forFeature([User, Post]);

      expect(EntitiesMetadataStorage.getEntities('default')).toEqual([User, Post]);
      expect(dynamicModule.module).toBe(TypeormModule);
      expect((dynamicModule.providersPerMod as Provider[])?.length).toBe(2);
      expect(dynamicModule.exports?.length).toBe(2);
    });

    it('should support named data sources in forFeature()', () => {
      const dynamicModule = TypeormModule.forFeature([User], 'analytics');

      expect(EntitiesMetadataStorage.getEntities('analytics')).toEqual([User]);
      expect((dynamicModule.providersPerMod as Provider[])?.length).toBe(1);
    });

    it('should return an empty module when called with no entities', () => {
      const dynamicModule = TypeormModule.forFeature([]);

      expect((dynamicModule.providersPerMod as Provider[])?.length).toBe(0);
      expect(dynamicModule.exports?.length).toBe(0);
    });
  });
});
