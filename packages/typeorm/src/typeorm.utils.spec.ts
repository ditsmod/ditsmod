import { InjectionToken } from '@holu/core';
import { DataSource, EntityManager, EntitySchema } from 'typeorm';

import { getDataSourceToken, getEntityManagerToken, getRepositoryToken } from './typeorm.utils.js';
import { DEFAULT_DATA_SOURCE_NAME } from './constants.js';

class UserEntity {
  id!: number;
  name!: string;
}

class PostEntity {
  id!: number;
  title!: string;
}

const CategorySchema = new EntitySchema({
  name: 'Category',
  columns: {
    id: { type: Number, primary: true },
    name: { type: String },
  },
});

const TagSchema = new EntitySchema({
  name: 'Tag',
  target: class TagEntity {},
  columns: {
    id: { type: Number, primary: true },
  },
});

describe('typeorm.utils', () => {
  describe('getDataSourceToken()', () => {
    it('should return DataSource class for default data source', () => {
      expect(getDataSourceToken()).toBe(DataSource);
      expect(getDataSourceToken(DEFAULT_DATA_SOURCE_NAME)).toBe(DataSource);
    });

    it('should return cached InjectionToken for named data source', () => {
      const token1 = getDataSourceToken('analytics');
      const token2 = getDataSourceToken('analytics');

      expect(token1).toBeInstanceOf(InjectionToken);
      expect(token1).toBe(token2);
    });
  });

  describe('getEntityManagerToken()', () => {
    it('should return EntityManager class for default data source', () => {
      expect(getEntityManagerToken()).toBe(EntityManager);
      expect(getEntityManagerToken(DEFAULT_DATA_SOURCE_NAME)).toBe(EntityManager);
    });

    it('should return cached InjectionToken for named data source', () => {
      const token1 = getEntityManagerToken('analytics');
      const token2 = getEntityManagerToken('analytics');

      expect(token1).toBeInstanceOf(InjectionToken);
      expect(token1).toBe(token2);
    });
  });

  describe('getRepositoryToken()', () => {
    it('should return cached InjectionToken for entity class in default data source', () => {
      const token1 = getRepositoryToken(UserEntity);
      const token2 = getRepositoryToken(UserEntity);

      expect(token1).toBeInstanceOf(InjectionToken);
      expect(token1).toBe(token2);
    });

    it('should return different tokens for different entity classes', () => {
      const userToken = getRepositoryToken(UserEntity);
      const postToken = getRepositoryToken(PostEntity);

      expect(userToken).not.toBe(postToken);
    });

    it('should return different tokens for named data sources', () => {
      const defaultToken = getRepositoryToken(UserEntity);
      const analyticsToken = getRepositoryToken(UserEntity, 'analytics');

      expect(defaultToken).not.toBe(analyticsToken);
    });

    it('should handle EntitySchema correctly', () => {
      const categoryToken = getRepositoryToken(CategorySchema);
      const tagToken = getRepositoryToken(TagSchema);

      expect(categoryToken).toBeInstanceOf(InjectionToken);
      expect(tagToken).toBeInstanceOf(InjectionToken);
      expect(categoryToken).not.toBe(tagToken);
    });
  });
});
