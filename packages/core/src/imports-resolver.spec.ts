import { injectable } from '#di';

import { ImportsResolver } from './imports-resolver.js';
import { NormalizedModuleMetadata } from './models/normalized-module-metadata.js';
import { ImportedTokensMap } from './types/metadata-per-mod.js';
import { ModuleType, ModuleWithParams, ServiceProvider } from './types/mix.js';

describe('ImportsResolver', () => {
  @injectable()
  class ImportsResolverMock extends ImportsResolver {
    declare unfinishedSearchDependecies: [ModuleType | ModuleWithParams, ServiceProvider][];
    override resolveImportedProviders(importedTokensMap: ImportedTokensMap, meta: NormalizedModuleMetadata) {
      return super.resolveImportedProviders(importedTokensMap, meta);
    }
    override fixDependecy(module: ModuleType | ModuleWithParams, provider: ServiceProvider) {
      return super.fixDependecy(module, provider);
    }
    override unfixDependecy(module: ModuleType | ModuleWithParams, provider: ServiceProvider) {
      return super.unfixDependecy(module, provider);
    }
  }
  let mock: ImportsResolverMock;

  beforeEach(() => {
    mock = new ImportsResolverMock(null as any, null as any, null as any, null as any);
  });

  describe('resolveImportedProviders', () => {
    describe('fixDependecy(), unfixDependecy() and throwCircularDependencies()', () => {
      class Module1 {}
      class Provider1 {}
      class Module2 {}
      class Provider2 {}
      class Module3 {}
      class Provider3 {}

      it('adding and removing dependecies', () => {
        expect(mock.unfinishedSearchDependecies).toEqual([]);
        mock.fixDependecy(Module1, Provider1);
        mock.fixDependecy(Module2, Provider2);
        mock.fixDependecy(Module3, Provider3);
        expect(mock.unfinishedSearchDependecies).toEqual([
          [Module1, Provider1],
          [Module2, Provider2],
          [Module3, Provider3],
        ]);
        mock.unfixDependecy(Module2, Provider2);
        expect(mock.unfinishedSearchDependecies).toEqual([
          [Module1, Provider1],
          [Module3, Provider3],
        ]);
      });

      it('throw properly message', () => {
        expect(mock.unfinishedSearchDependecies).toEqual([]);
        mock.fixDependecy(Module1, Provider1);
        mock.fixDependecy(Module2, Provider2);
        mock.fixDependecy(Module3, Provider3);
        const msg =
          'Detected circular dependencies: [Provider2 in Module2] -> [Provider3 in Module3] -> [Provider2 in Module2]. It is started from [Provider1 in Module1].';
        expect(() => mock.fixDependecy(Module2, Provider2)).toThrow(msg);
      });
    });
  });
});
