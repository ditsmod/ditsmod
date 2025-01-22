import { describe, expect, it, beforeEach } from 'vitest';

import { injectable, Injector } from '#di';
import { ImportsResolver } from '#init/imports-resolver.js';
import { NormalizedModule } from '#types/normalized-module.js';
import { ImportedTokensMap } from '#types/metadata-per-mod.js';
import { ModRefId, ModuleType, Level } from '#types/mix.js';
import { Provider } from '#di/types-and-models.js';
import { ModuleWithParams } from '#types/module-metadata.js';
import { ModuleFactory } from '#init/module-factory.js';
import { ModuleManager } from '#init/module-manager.js';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { SystemErrorMediator } from '#error/system-error-mediator.js';
import { clearDebugClassNames } from '#utils/get-debug-class-name.js';

describe('ImportsResolver', () => {
  @injectable()
  class ImportsResolverMock extends ImportsResolver {
    declare unfinishedSearchDependecies: [ModuleType | ModuleWithParams, Provider][];
    override resolveImportedProviders(
      targetProviders: NormalizedModule,
      importedTokensMap: ImportedTokensMap,
      levels: Level[],
    ) {
      return super.resolveImportedProviders(targetProviders, importedTokensMap, levels);
    }
    override addToUnfinishedSearchDependecies(module: ModuleType | ModuleWithParams, provider: Provider) {
      return super.addToUnfinishedSearchDependecies(module, provider);
    }
    override deleteFromUnfinishedSearchDependecies(module: ModuleType | ModuleWithParams, provider: Provider) {
      return super.deleteFromUnfinishedSearchDependecies(module, provider);
    }

    override grabDependecies(
      targetMeta: NormalizedModule,
      sourceModule: ModRefId,
      importedProvider: Provider,
      levels: Level[],
      path: any[] = [],
    ) {
      return super.grabDependecies(targetMeta, sourceModule, importedProvider, levels, path);
    }
  }

  let mock: ImportsResolverMock;
  let moduleFactory: ModuleFactory;
  let moduleManager: ModuleManager;
  let systemLogMediator: SystemLogMediator;
  let errorMediator: SystemErrorMediator;

  beforeEach(() => {
    clearDebugClassNames();
    const injectorPerApp = Injector.resolveAndCreate([ModuleFactory]);
    moduleFactory = injectorPerApp.get(ModuleFactory);
    systemLogMediator = new SystemLogMediator({ moduleName: 'fakeName' });
    errorMediator = new SystemErrorMediator({ moduleName: 'fakeName' });
    moduleManager = new ModuleManager(systemLogMediator);
    mock = new ImportsResolverMock(moduleManager, null as any, null as any, null as any, null as any);
  });

  describe('resolveImportedProviders', () => {
    describe('addToUnfinishedSearchDependecies(), deleteFromUnfinishedSearchDependecies() and throwCircularDependencies()', () => {
      class Module1 {}
      class Provider1 {}
      class Module2 {}
      class Provider2 {}
      class Module3 {}
      class Provider3 {}

      it('adding and removing dependecies', () => {
        expect(mock.unfinishedSearchDependecies).toEqual([]);
        mock.addToUnfinishedSearchDependecies(Module1, Provider1);
        mock.addToUnfinishedSearchDependecies(Module2, Provider2);
        mock.addToUnfinishedSearchDependecies(Module3, Provider3);
        expect(mock.unfinishedSearchDependecies).toEqual([
          [Module1, Provider1],
          [Module2, Provider2],
          [Module3, Provider3],
        ]);
        mock.deleteFromUnfinishedSearchDependecies(Module2, Provider2);
        expect(mock.unfinishedSearchDependecies).toEqual([
          [Module1, Provider1],
          [Module3, Provider3],
        ]);
      });

      it('throw properly message', () => {
        expect(mock.unfinishedSearchDependecies).toEqual([]);
        mock.addToUnfinishedSearchDependecies(Module1, Provider1);
        mock.addToUnfinishedSearchDependecies(Module2, Provider2);
        mock.addToUnfinishedSearchDependecies(Module3, Provider3);
        const msg =
          'Detected circular dependencies: [Provider2 in Module2] -> [Provider3 in Module3] -> [Provider2 in Module2]. It is started from [Provider1 in Module1].';
        expect(() => mock.addToUnfinishedSearchDependecies(Module2, Provider2)).toThrow(msg);
      });
    });
  });
});
