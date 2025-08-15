import { injectable, Injector } from '#di';
import { DeepModulesImporter } from '#init/deep-modules-importer.js';
import { BaseMeta } from '#types/base-meta.js';
import { ImportedTokensMap } from '#types/metadata-per-mod.js';
import { ModRefId, ModuleType, Level } from '#types/mix.js';
import { Provider } from '#di/types-and-models.js';
import { ModuleWithParams } from '#types/module-metadata.js';
import { ShallowModulesImporter } from '#init/shallow-modules-importer.js';
import { ModuleManager } from '#init/module-manager.js';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { clearDebugClassNames } from '#utils/get-debug-class-name.js';
import { coreErrors } from '#error/core-errors.js';

describe('DeepModulesImporter', () => {
  @injectable()
  class DeepModulesImporterMock extends DeepModulesImporter {
    override resolveImportedProviders(
      targetProviders: BaseMeta,
      importedTokensMap: ImportedTokensMap,
      levels: Level[],
    ) {
      return super.resolveImportedProviders(targetProviders, importedTokensMap, levels);
    }
    override addToUnfinishedSearchDependencies(module: ModuleType | ModuleWithParams, provider: Provider) {
      return super.addToUnfinishedSearchDependencies(module, provider);
    }
    override deleteFromUnfinishedSearchDependencies(module: ModuleType | ModuleWithParams, provider: Provider) {
      return super.deleteFromUnfinishedSearchDependencies(module, provider);
    }
  }

  let mock: DeepModulesImporterMock;
  let shallowModulesImporter: ShallowModulesImporter;
  let moduleManager: ModuleManager;
  let systemLogMediator: SystemLogMediator;

  beforeEach(() => {
    clearDebugClassNames();
    const injectorPerApp = Injector.resolveAndCreate([ShallowModulesImporter]);
    shallowModulesImporter = injectorPerApp.get(ShallowModulesImporter);
    systemLogMediator = new SystemLogMediator({ moduleName: 'fakeName' });
    moduleManager = new ModuleManager(systemLogMediator);
    mock = new DeepModulesImporterMock({
      moduleManager,
      log: null as any,
      providersPerApp: null as any,
      shallowImports: null as any,
    });
  });

  describe('resolveImportedProviders', () => {
    describe('addToUnfinishedSearchDependencies(), deleteFromUnfinishedSearchDependencies() and throwCircularDependencies()', () => {
      class Module1 {}
      class Provider1 {}
      class Module2 {}
      class Provider2 {}
      class Module3 {}
      class Provider3 {}

      it('adding and removing dependencies', () => {
        expect(mock.dependencyChain).toEqual([]);
        mock.addToUnfinishedSearchDependencies(Module1, Provider1);
        mock.addToUnfinishedSearchDependencies(Module2, Provider2);
        mock.addToUnfinishedSearchDependencies(Module3, Provider3);
        expect(mock.dependencyChain).toEqual([
          [Module1, Provider1],
          [Module2, Provider2],
          [Module3, Provider3],
        ]);
        mock.deleteFromUnfinishedSearchDependencies(Module2, Provider2);
        expect(mock.dependencyChain).toEqual([
          [Module1, Provider1],
          [Module3, Provider3],
        ]);
      });

      it('throw properly message', () => {
        expect(mock.dependencyChain).toEqual([]);
        mock.addToUnfinishedSearchDependencies(Module1, Provider1);
        mock.addToUnfinishedSearchDependencies(Module2, Provider2);
        mock.addToUnfinishedSearchDependencies(Module3, Provider3);
        const err = coreErrors.circularDepsInImports(
          '[Provider2 in Module2] -> [Provider3 in Module3] -> [Provider2 in Module2]',
          '[Provider1 in Module1]',
        );
        expect(() => mock.addToUnfinishedSearchDependencies(Module2, Provider2)).toThrow(err);
      });
    });
  });
});
