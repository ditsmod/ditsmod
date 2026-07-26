import { jest } from '@jest/globals';
import { injectable } from '@ditsmod/core';
import type { Provider } from '@ditsmod/core';

import { EntitiesMetadataStorage } from './entities-metadata-storage.js';
import { TYPEORM_OPTIONS, TYPEORM_ASYNC_OPTIONS } from './constants.js';
import { TypeormModule } from './typeorm.module.js';
import { getDataSourceToken, getEntityManagerToken } from './typeorm.utils.js';
import type { TypeormOptionsFactory, TypeormModuleOptions } from './types.js';

class UserEntity {}
class PostEntity {}

@injectable()
class MockConfigFactory implements TypeormOptionsFactory {
  createTypeormOptions(): TypeormModuleOptions {
    return { type: 'postgres' as const, database: 'test_db' };
  }
}

describe('TypeormModule', () => {
  beforeEach(() => {
    EntitiesMetadataStorage.clear();
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
  });

  describe('forRootAsync()', () => {
    it('should register configurationClass and TYPEORM_ASYNC_OPTIONS descriptor', () => {
      const dynamicModule = TypeormModule.forRootAsync({
        configurationClass: MockConfigFactory,
      });

      expect(dynamicModule.module).toBe(TypeormModule);
      const providers = dynamicModule.providersPerApp as Provider[];

      // Should have: dsToken placeholder, emToken placeholder, configurationClass, TYPEORM_ASYNC_OPTIONS
      expect(providers).toContainEqual({ token: getDataSourceToken('default'), useValue: null });
      expect(providers).toContainEqual({ token: getEntityManagerToken('default'), useValue: null });
      expect(providers).toContain(MockConfigFactory);
      expect(providers).toContainEqual({
        token: TYPEORM_ASYNC_OPTIONS,
        useValue: { name: 'default', configurationClass: MockConfigFactory },
        multi: true,
      });
    });

    it('should register useFactory descriptor with deps', () => {
      const factory = jest.fn<any>();
      class ConfigService {}

      const dynamicModule = TypeormModule.forRootAsync({
        useFactory: factory,
        deps: [ConfigService],
      });

      const providers = dynamicModule.providersPerApp as Provider[];
      expect(providers).toContainEqual({
        token: TYPEORM_ASYNC_OPTIONS,
        useValue: { name: 'default', useFactory: factory, deps: [ConfigService] },
        multi: true,
      });
      // useFactory should NOT register the factory as a class provider
      expect(providers).not.toContain(ConfigService);
    });

    it('should use the specified name for named data sources', () => {
      const dynamicModule = TypeormModule.forRootAsync({
        name: 'analytics',
        configurationClass: MockConfigFactory,
      });

      const providers = dynamicModule.providersPerApp as Provider[];
      expect(providers).toContainEqual({ token: getDataSourceToken('analytics'), useValue: null });
      expect(providers).toContainEqual({ token: getEntityManagerToken('analytics'), useValue: null });
      expect(providers).toContainEqual({
        token: TYPEORM_ASYNC_OPTIONS,
        useValue: { name: 'analytics', configurationClass: MockConfigFactory },
        multi: true,
      });
    });

    it('should default deps to empty array when useFactory is provided without deps', () => {
      const factory = jest.fn<any>();
      const dynamicModule = TypeormModule.forRootAsync({ useFactory: factory });

      const providers = dynamicModule.providersPerApp as Provider[];
      expect(providers).toContainEqual({
        token: TYPEORM_ASYNC_OPTIONS,
        useValue: { name: 'default', useFactory: factory, deps: [] },
        multi: true,
      });
    });

    it('should throw if neither configurationClass nor useFactory is provided', () => {
      expect(() => TypeormModule.forRootAsync({})).toThrow(
        'TypeormModule.forRootAsync() requires either "configurationClass" or "useFactory" to be provided.',
      );
    });
  });

  describe('forFeature()', () => {
    it('should add entities to EntitiesMetadataStorage and return repository providers', () => {
      const dynamicModule = TypeormModule.forFeature([UserEntity, PostEntity]);

      expect(EntitiesMetadataStorage.getEntities('default')).toEqual([UserEntity, PostEntity]);
      expect(dynamicModule.module).toBe(TypeormModule);
      expect((dynamicModule.providersPerMod as Provider[])?.length).toBe(2);
      expect(dynamicModule.exports?.length).toBe(2);
    });

    it('should support named data sources in forFeature()', () => {
      const dynamicModule = TypeormModule.forFeature([UserEntity], 'analytics');

      expect(EntitiesMetadataStorage.getEntities('analytics')).toEqual([UserEntity]);
      expect((dynamicModule.providersPerMod as Provider[])?.length).toBe(1);
    });

    it('should return an empty module when called with no entities', () => {
      const dynamicModule = TypeormModule.forFeature([]);

      expect((dynamicModule.providersPerMod as Provider[])?.length).toBe(0);
      expect(dynamicModule.exports?.length).toBe(0);
    });
  });
});
