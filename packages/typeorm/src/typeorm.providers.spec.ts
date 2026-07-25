import { jest } from '@jest/globals';
import { createRepositoryProviders } from './typeorm.providers.js';
import { getRepositoryToken, getDataSourceToken } from './typeorm.utils.js';

class User {
  id!: number;
}

class Category {
  id!: number;
}

describe('typeorm.providers', () => {
  it('should create repository providers for standard entities', () => {
    const providers = createRepositoryProviders([User]);

    expect(providers.length).toBe(1);
    const provider = providers[0];
    expect(provider.token).toEqual(getRepositoryToken(User));
    expect(provider.deps).toEqual([getDataSourceToken()]);
    expect(typeof provider.useFactory).toBe('function');
  });

  it('should execute useFactory and return regular repository for standard entity', () => {
    const providers = createRepositoryProviders([User]);
    const provider = providers[0];

    const mockRepo = {};
    const mockDs = {
      isInitialized: true,
      entityMetadatas: [{ target: User }],
      getRepository: jest.fn<any>().mockReturnValue(mockRepo),
      getTreeRepository: jest.fn(),
    };

    const repo = provider.useFactory(mockDs);

    expect(mockDs.getRepository).toHaveBeenCalledWith(User);
    expect(mockDs.getTreeRepository).not.toHaveBeenCalled();
    expect(repo).toBe(mockRepo);
  });

  it('should execute useFactory and return tree repository for tree entity', () => {
    const providers = createRepositoryProviders([Category]);
    const provider = providers[0];

    const mockTreeRepo = {};
    const mockDs = {
      isInitialized: true,
      entityMetadatas: [{ target: Category, treeType: 'nested-set' }],
      getRepository: jest.fn(),
      getTreeRepository: jest.fn<any>().mockReturnValue(mockTreeRepo),
    };

    const repo = provider.useFactory(mockDs);

    expect(mockDs.getTreeRepository).toHaveBeenCalledWith(Category);
    expect(mockDs.getRepository).not.toHaveBeenCalled();
    expect(repo).toBe(mockTreeRepo);
  });

  it('should pass custom dataSourceName to tokens and factory deps', () => {
    const providers = createRepositoryProviders([User], 'analytics');
    const provider = providers[0];

    expect(provider.token).toEqual(getRepositoryToken(User, 'analytics'));
    expect(provider.deps).toEqual([getDataSourceToken('analytics')]);
  });

  it('should throw a descriptive error when DataSource is not initialized', () => {
    const providers = createRepositoryProviders([User]);
    const provider = providers[0];

    const uninitializedDs = {
      isInitialized: false,
      entityMetadatas: [],
      getRepository: jest.fn(),
      getTreeRepository: jest.fn(),
    };

    expect(() => provider.useFactory(uninitializedDs)).toThrow(
      expect.objectContaining({
        message: expect.stringContaining('User'),
      }),
    );
    expect(() => provider.useFactory(uninitializedDs)).toThrow(
      expect.objectContaining({
        message: expect.stringContaining('not initialized'),
      }),
    );
    expect(() => provider.useFactory(uninitializedDs)).toThrow(
      expect.objectContaining({
        message: expect.stringContaining('manualInitialization'),
      }),
    );
  });

  it('should use getRepository when entity is not found in entityMetadatas', () => {
    // Entity not registered in the DataSource — falls back to regular repo
    const providers = createRepositoryProviders([User]);
    const provider = providers[0];

    const mockRepo = {};
    const mockDs = {
      isInitialized: true,
      entityMetadatas: [], // User is NOT listed
      getRepository: jest.fn<any>().mockReturnValue(mockRepo),
      getTreeRepository: jest.fn(),
    };

    const repo = provider.useFactory(mockDs);

    expect(mockDs.getRepository).toHaveBeenCalledWith(User);
    expect(repo).toBe(mockRepo);
  });
});
