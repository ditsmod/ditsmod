import { EntitiesMetadataStorage } from './entities-metadata-storage.js';

class UserEntity {}
class PostEntity {}
class CommentEntity {}

describe('EntitiesMetadataStorage', () => {
  beforeEach(() => {
    EntitiesMetadataStorage.clear();
  });

  it('should store entities for default data source', () => {
    EntitiesMetadataStorage.addEntities('default', [UserEntity, PostEntity]);
    expect(EntitiesMetadataStorage.getEntities('default')).toEqual([UserEntity, PostEntity]);
  });

  it('should store entities for named data sources separately', () => {
    EntitiesMetadataStorage.addEntities('default', [UserEntity]);
    EntitiesMetadataStorage.addEntities('analytics', [PostEntity, CommentEntity]);

    expect(EntitiesMetadataStorage.getEntities('default')).toEqual([UserEntity]);
    expect(EntitiesMetadataStorage.getEntities('analytics')).toEqual([PostEntity, CommentEntity]);
  });

  it('should prevent adding duplicate entities', () => {
    EntitiesMetadataStorage.addEntities('default', [UserEntity, PostEntity]);
    EntitiesMetadataStorage.addEntities('default', [UserEntity, CommentEntity]);

    expect(EntitiesMetadataStorage.getEntities('default')).toEqual([UserEntity, PostEntity, CommentEntity]);
  });

  it('should return empty array for unknown data source', () => {
    expect(EntitiesMetadataStorage.getEntities('nonexistent')).toEqual([]);
  });

  it('should clear all stored entities on clear()', () => {
    EntitiesMetadataStorage.addEntities('default', [UserEntity]);
    EntitiesMetadataStorage.addEntities('analytics', [PostEntity]);

    EntitiesMetadataStorage.clear();

    expect(EntitiesMetadataStorage.getEntities('default')).toEqual([]);
    expect(EntitiesMetadataStorage.getEntities('analytics')).toEqual([]);
  });

  it('should clear entities for a single data source via clearForDataSource()', () => {
    EntitiesMetadataStorage.addEntities('default', [UserEntity]);
    EntitiesMetadataStorage.addEntities('analytics', [PostEntity]);

    EntitiesMetadataStorage.clearForDataSource('analytics');

    // 'analytics' is cleared, 'default' is untouched
    expect(EntitiesMetadataStorage.getEntities('analytics')).toEqual([]);
    expect(EntitiesMetadataStorage.getEntities('default')).toEqual([UserEntity]);
  });

  it('should be a no-op when clearForDataSource() is called for an unknown name', () => {
    EntitiesMetadataStorage.addEntities('default', [UserEntity]);

    expect(() => EntitiesMetadataStorage.clearForDataSource('nonexistent')).not.toThrow();
    expect(EntitiesMetadataStorage.getEntities('default')).toEqual([UserEntity]);
  });
});
