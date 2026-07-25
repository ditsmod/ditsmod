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
    const provider = providers[0] as any;
    expect(provider.token).toEqual(getRepositoryToken(User));
    expect(provider.deps).toEqual([getDataSourceToken()]);
    expect(typeof provider.useFactory).toBe('function');
  });

  it('should execute useFactory and return regular repository for standard entity', () => {
    const providers = createRepositoryProviders([User]);
    const provider = providers[0] as any;

    const mockRepo = {};
    const mockDs = {
      entityMetadatas: [{ target: User }],
      getRepository: jest.fn<any>().mockReturnValue(mockRepo),
      getTreeRepository: jest.fn(),
    } as any;

    const repo = provider.useFactory(mockDs);

    expect(mockDs.getRepository).toHaveBeenCalledWith(User);
    expect(mockDs.getTreeRepository).not.toHaveBeenCalled();
    expect(repo).toBe(mockRepo);
  });

  it('should execute useFactory and return tree repository for tree entity', () => {
    const providers = createRepositoryProviders([Category]);
    const provider = providers[0] as any;

    const mockTreeRepo = {};
    const mockDs = {
      entityMetadatas: [{ target: Category, treeType: 'nested-set' }],
      getRepository: jest.fn(),
      getTreeRepository: jest.fn<any>().mockReturnValue(mockTreeRepo),
    } as any;

    const repo = provider.useFactory(mockDs);

    expect(mockDs.getTreeRepository).toHaveBeenCalledWith(Category);
    expect(mockDs.getRepository).not.toHaveBeenCalled();
    expect(repo).toBe(mockTreeRepo);
  });

  it('should pass custom dataSourceName to tokens and factory deps', () => {
    const providers = createRepositoryProviders([User], 'analytics');
    const provider = providers[0] as any;

    expect(provider.token).toEqual(getRepositoryToken(User, 'analytics'));
    expect(provider.deps).toEqual([getDataSourceToken('analytics')]);
  });
});
