import { EntitiesMetadataStorage } from './entities-metadata-storage.js';

class User {}
class Post {}
class Comment {}

describe('EntitiesMetadataStorage', () => {
  beforeEach(() => {
    EntitiesMetadataStorage.clear();
  });

  it('should store entities for default data source', () => {
    EntitiesMetadataStorage.addEntities('default', [User, Post]);
    expect(EntitiesMetadataStorage.getEntities('default')).toEqual([User, Post]);
  });

  it('should store entities for named data sources separately', () => {
    EntitiesMetadataStorage.addEntities('default', [User]);
    EntitiesMetadataStorage.addEntities('analytics', [Post, Comment]);

    expect(EntitiesMetadataStorage.getEntities('default')).toEqual([User]);
    expect(EntitiesMetadataStorage.getEntities('analytics')).toEqual([Post, Comment]);
  });

  it('should prevent adding duplicate entities', () => {
    EntitiesMetadataStorage.addEntities('default', [User, Post]);
    EntitiesMetadataStorage.addEntities('default', [User, Comment]);

    expect(EntitiesMetadataStorage.getEntities('default')).toEqual([User, Post, Comment]);
  });

  it('should return empty array for unknown data source', () => {
    expect(EntitiesMetadataStorage.getEntities('nonexistent')).toEqual([]);
  });

  it('should clear all stored entities on clear()', () => {
    EntitiesMetadataStorage.addEntities('default', [User]);
    EntitiesMetadataStorage.addEntities('analytics', [Post]);

    EntitiesMetadataStorage.clear();

    expect(EntitiesMetadataStorage.getEntities('default')).toEqual([]);
    expect(EntitiesMetadataStorage.getEntities('analytics')).toEqual([]);
  });
});
