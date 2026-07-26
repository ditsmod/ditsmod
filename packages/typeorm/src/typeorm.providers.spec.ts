import { jest } from '@jest/globals';
import { createRepositoryProviders } from './typeorm.providers.js';
import { getRepositoryToken, getDataSourceToken } from './typeorm.utils.js';

class UserEntity {
  id!: number;
}

class CategoryEntity {
  id!: number;
}

describe('typeorm.providers', () => {
  it('should create repository providers for standard entities', () => {
    const providers = createRepositoryProviders([UserEntity]);

    expect(providers.length).toBe(1);
    const provider = providers[0];
    expect(provider.token).toEqual(getRepositoryToken(UserEntity));
    expect(provider.deps).toEqual([getDataSourceToken()]);
    expect(typeof provider.useFactory).toBe('function');
  });

  it('should execute useFactory and return regular repository for standard entity', () => {
    const providers = createRepositoryProviders([UserEntity]);
    const provider = providers[0];

    const mockRepo = {};
    const mockDs = {
      isInitialized: true,
      entityMetadatas: [{ target: UserEntity }],
      getRepository: jest.fn<any>().mockReturnValue(mockRepo),
      getTreeRepository: jest.fn(),
    };

    const repo = provider.useFactory(mockDs);

    expect(mockDs.getRepository).toHaveBeenCalledWith(UserEntity);
    expect(mockDs.getTreeRepository).not.toHaveBeenCalled();
    expect(repo).toBe(mockRepo);
  });

  it('should execute useFactory and return tree repository for tree entity', () => {
    const providers = createRepositoryProviders([CategoryEntity]);
    const provider = providers[0];

    const mockTreeRepo = {};
    const mockDs = {
      isInitialized: true,
      entityMetadatas: [{ target: CategoryEntity, treeType: 'nested-set' }],
      getRepository: jest.fn(),
      getTreeRepository: jest.fn<any>().mockReturnValue(mockTreeRepo),
    };

    const repo = provider.useFactory(mockDs);

    expect(mockDs.getTreeRepository).toHaveBeenCalledWith(CategoryEntity);
    expect(mockDs.getRepository).not.toHaveBeenCalled();
    expect(repo).toBe(mockTreeRepo);
  });

  it('should pass custom dataSourceName to tokens and factory deps', () => {
    const providers = createRepositoryProviders([UserEntity], 'analytics');
    const provider = providers[0];

    expect(provider.token).toEqual(getRepositoryToken(UserEntity, 'analytics'));
    expect(provider.deps).toEqual([getDataSourceToken('analytics')]);
  });

  it('should return repository even if DataSource is uninitialized (allowing manualInitialization)', () => {
    const providers = createRepositoryProviders([UserEntity]);
    const provider = providers[0];

    const mockRepo = {};
    const uninitializedDs = {
      isInitialized: false,
      entityMetadatas: [{ target: UserEntity }],
      getRepository: jest.fn<any>().mockReturnValue(mockRepo),
      getTreeRepository: jest.fn(),
    };

    const repo = provider.useFactory(uninitializedDs);

    expect(uninitializedDs.getRepository).toHaveBeenCalledWith(UserEntity);
    expect(repo).toBe(mockRepo);
  });

  it('should use getRepository when entity is not found in entityMetadatas', () => {
    // Entity not registered in the DataSource — falls back to regular repo
    const providers = createRepositoryProviders([UserEntity]);
    const provider = providers[0];

    const mockRepo = {};
    const mockDs = {
      isInitialized: true,
      entityMetadatas: [], // UserEntity is NOT listed
      getRepository: jest.fn<any>().mockReturnValue(mockRepo),
      getTreeRepository: jest.fn(),
    };

    const repo = provider.useFactory(mockDs);

    expect(mockDs.getRepository).toHaveBeenCalledWith(UserEntity);
    expect(repo).toBe(mockRepo);
  });
});
