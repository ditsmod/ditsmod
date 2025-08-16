import { injectable, Provider, makePropDecorator, FactoryProvider, forwardRef } from '#di';
import { featureModule } from '#decorators/feature-module.js';
import { rootModule } from '#decorators/root-module.js';
import { BaseMeta } from '#types/base-meta.js';
import { ShallowModulesImporter } from '#init/shallow-modules-importer.js';
import { ModuleManager } from '#init/module-manager.js';
import { GlobalProviders, ImportObj, MetadataPerMod1 } from '#types/metadata-per-mod.js';
import { ModuleType, Level, ModRefId } from '#types/mix.js';
import { getImportedProviders, getImportedTokens } from '#utils/get-imports.js';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { clearDebugClassNames } from '#utils/get-debug-class-name.js';
import { coreErrors } from '#error/core-errors.js';
import { CustomError } from '#error/custom-error.js';

describe('ShallowModulesImporter', () => {
  class Provider1 {}
  class Provider2 {}
  class Provider3 {}
  class Provider4 {}

  @injectable()
  class MockShallowModulesImporter extends ShallowModulesImporter {
    override moduleName = 'MockModule';
    override baseMeta = new BaseMeta();
    override shallowImportsBase = new Map<ModuleType, MetadataPerMod1>();
    override importedProvidersPerMod = new Map<any, ImportObj>();
    override importedMultiProvidersPerMod = new Map<ModRefId, Provider[]>();
    override importedExtensions = new Map<ModRefId, Provider[]>();

    override exportGlobalProviders(moduleManager: ModuleManager) {
      return super.exportGlobalProviders(moduleManager);
    }

    override getResolvedCollisionsPerLevel(level: Level, token1: any) {
      return super.getResolvedCollisionsPerLevel(level, token1);
    }
  }

  function importModulesShallow(modRefId: ModRefId) {
    moduleManager.scanModule(modRefId);
    return mock.importModulesShallow({
      globalProviders: new GlobalProviders(),
      modRefId,
      moduleManager,
      unfinishedScanModules: new Set(),
    });
  }

  let mock: MockShallowModulesImporter;
  let moduleManager: ModuleManager;

  beforeEach(() => {
    clearDebugClassNames();
    mock = new MockShallowModulesImporter();
    moduleManager = new ModuleManager(new SystemLogMediator({ moduleName: 'fakeName' }));
  });

  describe('exportGlobalProviders()', () => {
    it('exported providers order', () => {
      @featureModule({
        providersPerMod: [Provider1, Provider2],
        exports: [Provider1, Provider2],
      })
      class Module1 {}

      @featureModule({
        imports: [Module1],
        providersPerMod: [Provider3, Provider4],
        exports: [Module1, Provider3, Provider4],
      })
      class Module2 {}

      @rootModule({
        imports: [Module2],
        exports: [Module2],
      })
      class AppModule {}

      expect(() => moduleManager.scanRootModule(AppModule)).not.toThrow();
      expect(() => mock.exportGlobalProviders(moduleManager)).not.toThrow();
      expect(getImportedProviders(mock.importedProvidersPerMod)).toEqual([Provider1, Provider2, Provider3, Provider4]);
    });

    it('saving map between token and modules from where need import providers for it', () => {
      @featureModule({
        providersPerMod: [Provider1],
        exports: [Provider1],
      })
      class Module1 {}

      @featureModule({
        imports: [Module1],
        providersPerMod: [Provider2],
        exports: [Provider2, Module1],
      })
      class Module2 {}

      @rootModule({
        imports: [Module2],
        providersPerMod: [Provider3],
        exports: [Module2, Provider3],
      })
      class AppModule {}

      expect(() => moduleManager.scanRootModule(AppModule)).not.toThrow();
      expect(() => mock.exportGlobalProviders(moduleManager)).not.toThrow();
      expect(getImportedProviders(mock.importedProvidersPerMod)).toEqual([Provider1, Provider2, Provider3]);

      const importObj = new ImportObj();
      importObj.modRefId = Module1;
      importObj.providers = [Provider1];
      expect(mock?.importedProvidersPerMod.get(Provider1)).toEqual(importObj);
      importObj.modRefId = Module2;
      importObj.providers = [Provider2];
      expect(mock?.importedProvidersPerMod.get(Provider2)).toEqual(importObj);
      importObj.modRefId = AppModule;
      importObj.providers = [Provider3];
      expect(mock?.importedProvidersPerMod.get(Provider3)).toEqual(importObj);
    });

    it('merge providers from reexported modules', () => {
      @featureModule({
        providersPerMod: [Provider1],
        exports: [Provider1],
      })
      class Module1 {}

      @featureModule({
        providersPerMod: [Provider2],
        imports: [Module1],
        exports: [Provider2, Module1],
      })
      class Module2 {}

      @rootModule({
        imports: [Module2],
        exports: [Module2],
      })
      class AppModule {}

      expect(() => moduleManager.scanRootModule(AppModule)).not.toThrow();
      expect(() => mock.exportGlobalProviders(moduleManager)).not.toThrow();
      expect(getImportedProviders(mock.importedProvidersPerMod)).toEqual([Provider1, Provider2]);
    });

    it('throw collisions per module (import the first and second module in parallel)', () => {
      @featureModule({
        providersPerMod: [Provider1],
        exports: [Provider1],
      })
      class Module1 {}

      @featureModule({
        providersPerMod: [{ token: Provider1, useClass: Provider2 }],
        exports: [Provider1],
      })
      class Module2 {}

      @rootModule({
        imports: [Module1, Module2],
        exports: [Module1, Module2],
      })
      class AppModule {}

      expect(() => moduleManager.scanRootModule(AppModule)).not.toThrow();
      const err = coreErrors.providersCollision('AppModule', [Provider1], ['Module1', 'Module2'], 'Mod');
      expect(() => mock.exportGlobalProviders(moduleManager)).toThrow(err);
    });

    it('throw collisions per module (import firs module with nested second module)', () => {
      @featureModule({
        providersPerMod: [Provider1],
        exports: [Provider1],
      })
      class Module1 {}

      @featureModule({
        imports: [Module1],
        providersPerMod: [{ token: Provider1, useClass: Provider2 }],
        exports: [Provider1, Module1],
      })
      class Module2 {}

      @rootModule({
        imports: [Module2],
        exports: [Module2],
      })
      class AppModule {}

      expect(() => moduleManager.scanRootModule(AppModule)).not.toThrow();
      const err = coreErrors.providersCollision('AppModule', [Provider1], ['Module1', 'Module2'], 'Mod');
      expect(() => mock.exportGlobalProviders(moduleManager)).toThrow(err);
    });

    it('cyclic dependencies between modules', () => {
      @featureModule({
        imports: [forwardRef(() => Module3)],
        exports: [forwardRef(() => Module3)],
      })
      class Module1 {}

      @featureModule({
        imports: [Module1],
        providersPerMod: [Provider1],
        exports: [Provider1, Module1],
      })
      class Module2 {}

      @featureModule({
        imports: [Module2],
        providersPerMod: [Provider2],
        exports: [Provider2, Module2],
      })
      class Module3 {}

      @rootModule({
        imports: [Module3],
        exports: [Module3],
      })
      class AppModule {}

      expect(() => moduleManager.scanRootModule(AppModule)).not.toThrow();
      expect(() => mock.exportGlobalProviders(moduleManager)).not.toThrow();
      expect(getImportedProviders(mock.importedProvidersPerMod)).toEqual([Provider1, Provider2]);
    });

    it('forbidden reexports providers', () => {
      @featureModule({
        providersPerMod: [Provider1],
      })
      class Module1 {}

      @featureModule({
        imports: [Module1],
        exports: [Provider1],
      })
      class Module2 {}

      @rootModule({ imports: [Module2] })
      class AppModule {}

      const cause = coreErrors.exportingUnknownSymbol('Module2', 'Provider1');
      const err = new CustomError(
        { msg1: 'Normalization of Module2 failed', code: 'normalizationFailed', level: 'fatal' },
        cause,
      );
      expect(() => moduleManager.scanRootModule(AppModule)).toThrow(err);
    });

    it('allow reexports module', () => {
      @featureModule({
        providersPerMod: [Provider1],
        exports: [Provider1],
      })
      class Module1 {}

      @featureModule({
        imports: [Module1],
        exports: [Module1],
      })
      class Module2 {}

      @rootModule({
        imports: [Module2],
        exports: [Module2],
      })
      class AppModule {}

      expect(() => moduleManager.scanRootModule(AppModule)).not.toThrow();
      expect(() => mock.exportGlobalProviders(moduleManager)).not.toThrow();
      expect(getImportedProviders(mock.importedProvidersPerMod)).toEqual([Provider1]);
    });

    it('resolving collision', () => {
      class Provider1 {}

      @featureModule({
        providersPerMod: [{ token: Provider1, useValue: 'one' }],
        exports: [Provider1],
      })
      class Module1 {}

      @featureModule({
        imports: [Module1],
        providersPerMod: [Provider1],
        exports: [Module1, Provider1],
      })
      class Module2 {}

      @rootModule({
        imports: [Module2],
        resolvedCollisionsPerMod: [[Provider1, Module1]],
        exports: [Module2],
      })
      class AppModule {}

      moduleManager.scanRootModule(AppModule);
      expect(() => mock.exportGlobalProviders(moduleManager)).not.toThrow();
      expect([...mock.importedProvidersPerMod]).toEqual([
        [Provider1, { modRefId: Module1, providers: [{ token: Provider1, useValue: 'one' }] }],
      ]);
    });

    it('identical duplicates but not collision with exported providers', () => {
      class Provider1 {}

      @featureModule({
        providersPerMod: [{ token: Provider1, useValue: 'one' }],
        exports: [Provider1],
      })
      class Module1 {}

      @featureModule({
        imports: [Module1],
        providersPerMod: [{ token: Provider1, useValue: 'one' }],
        exports: [Module1, Provider1],
      })
      class Module2 {}

      @rootModule({
        imports: [Module2],
        exports: [Module2],
      })
      class AppModule {}

      moduleManager.scanRootModule(AppModule);
      expect(() => mock.exportGlobalProviders(moduleManager)).not.toThrow();
    });
  });

  describe('importModulesShallow()', () => {
    class Provider0 {}
    class Provider5 {}
    class Provider6 {}
    class Provider7 {}
    class Provider8 {}
    const overriddenProvider8: Provider = { token: Provider8, useValue: 'overridden' };
    class Provider9 {}

    @featureModule({
      providersPerMod: [Provider0],
      exports: [Provider0],
    })
    class Module0 {}

    @featureModule({
      imports: [Module0],
      providersPerMod: [Provider1, Provider2, Provider3],
      exports: [Module0, Provider1, Provider2, Provider3],
    })
    class Module1 {}

    @featureModule({
      imports: [Module1],
      providersPerMod: [Provider4, Provider5, Provider6, Provider7, Provider8],
      exports: [Module1, Provider5, Provider8],
    })
    class Module2 {}

    @featureModule({
      imports: [Module2],
      providersPerMod: [Provider9, overriddenProvider8],
      exports: [Module2],
    })
    class Module3 {}

    it('exporting providers order', () => {
      importModulesShallow(Module3);
      const mod0 = mock.shallowImportsBase.get(Module0);
      expect(mod0?.baseMeta.providersPerMod.slice(1)).toEqual([Provider0]);
      expect(mod0?.baseMeta.decorator).toBe(featureModule);

      const mod1 = mock.shallowImportsBase.get(Module1);
      expect(mod1?.baseMeta.providersPerMod.slice(1)).toEqual([Provider1, Provider2, Provider3]);

      const tokensPerMod = getImportedTokens(mod1?.importedTokensMap.perMod);
      expect(tokensPerMod).toEqual([Provider0]);
      expect(mod1?.baseMeta.decorator).toBe(featureModule);

      const mod2 = mock.shallowImportsBase.get(Module2);
      expect(mod2?.baseMeta.decorator).toBe(featureModule);
      expect(mod2?.baseMeta.providersPerMod.slice(1)).toEqual([Provider4, Provider5, Provider6, Provider7, Provider8]);

      const tokensPerMod2 = getImportedTokens(mod2?.importedTokensMap.perMod);
      expect(tokensPerMod2).toEqual([Provider0, Provider1, Provider2, Provider3]);

      const mod3 = mock.shallowImportsBase.get(Module3);
      expect(getImportedTokens(mod3?.importedTokensMap.perMod)).toEqual([
        Provider0,
        Provider1,
        Provider2,
        Provider3,
        Provider5,
        Provider8,
      ]);
      expect(mod3?.baseMeta.providersPerMod.slice(1)).toEqual([Provider9, overriddenProvider8]);
      expect(mod3?.baseMeta.decorator).toBe(featureModule);
    });

    it('mapping between token and module from where need to import appropriate provider', () => {
      @rootModule({
        imports: [Module3],
      })
      class Module4 {}
      importModulesShallow(Module4);
      expect(mock.baseMeta.providersPerMod.slice(1)).toEqual([]);

      expect(mock?.importedProvidersPerMod).toBeDefined();
      const importObj = new ImportObj();
      importObj.modRefId = Module0;
      importObj.providers = [Provider0];
      expect(mock?.importedProvidersPerMod.get(Provider0)).toEqual(importObj);

      importObj.modRefId = Module1;
      importObj.providers = [Provider1];
      expect(mock?.importedProvidersPerMod.get(Provider1)).toEqual(importObj);
      importObj.providers = [Provider2];
      expect(mock?.importedProvidersPerMod.get(Provider2)).toEqual(importObj);
      importObj.providers = [Provider3];
      expect(mock?.importedProvidersPerMod.get(Provider3)).toEqual(importObj);

      importObj.modRefId = Module2;
      importObj.providers = [Provider5];
      expect(mock?.importedProvidersPerMod.get(Provider5)).toEqual(importObj);
      importObj.providers = [Provider8];
      expect(mock?.importedProvidersPerMod.get(Provider8)).toEqual(importObj);
      expect(mock.baseMeta.decorator).toBe(rootModule);
    });

    it('import Module2 and reexport Module1 with collision - Provider2', () => {
      class Provider1 {}
      class Provider2 {}
      class Provider3 {}
      const factory = makePropDecorator();

      class ClassWithFactory {
        @factory()
        method1() {}
      }

      @featureModule({
        providersPerMod: [
          Provider1,
          { token: Provider2, useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] },
        ],
        exports: [Provider1, Provider2],
      })
      class Module1 {}

      @featureModule({
        imports: [Module1],
        providersPerMod: [Provider2, Provider3],
        exports: [Module1, Provider2, Provider3],
      })
      class Module2 {}

      @rootModule({
        imports: [Module2],
      })
      class AppModule {}

      const err = coreErrors.providersCollision('AppModule', [Provider2], ['Module1', 'Module2'], 'Mod');
      expect(() => importModulesShallow(AppModule)).toThrow(err);
    });

    it('import Module2 and Module1 with collision - Provider1', () => {
      class Provider1 {}
      class Provider2 {}
      const factory = makePropDecorator();

      class ClassWithFactory {
        @factory()
        method1() {}
      }

      @featureModule({
        providersPerMod: [{ token: Provider1, useClass: Provider1 }, Provider2],
        exports: [Provider1],
      })
      class Module1 {}

      @featureModule({
        providersPerMod: [
          Provider1,
          { token: Provider2, useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] },
        ],
        exports: [Provider1, Provider2],
      })
      class Module2 {}

      @rootModule({ imports: [Module1, Module2] })
      class AppModule {}

      const err = coreErrors.providersCollision('AppModule', [Provider1], ['Module1', 'Module2'], 'Mod');
      expect(() => importModulesShallow(AppModule)).toThrow(err);
    });

    it('import multi providers that has token Provider1', () => {
      class Provider1 {}
      class Provider2 {}

      @featureModule({
        providersPerMod: [
          { token: Provider1, useValue: 'value1 of module1', multi: true },
          { token: Provider1, useValue: 'value2 of module1', multi: true },
          Provider2,
        ],
        exports: [Provider1],
      })
      class Module1 {}

      @featureModule({
        providersPerMod: [
          { token: Provider1, useValue: 'value1 of module2', multi: true },
          { token: Provider1, useValue: 'value2 of module2', multi: true },
          { token: Provider1, useValue: 'value3 of module2', multi: true },
          { token: Provider2, useValue: 'value100' },
        ],
        exports: [Provider1, Provider2],
      })
      class Module2 {}

      @rootModule({ imports: [Module1, Module2] })
      class AppModule {}

      expect(() => importModulesShallow(AppModule)).not.toThrow();
      expect([...mock.importedProvidersPerMod]).toEqual([
        [
          Provider2,
          {
            modRefId: Module2,
            providers: [{ token: Provider2, useValue: 'value100' }],
          },
        ],
      ]);
      expect([...mock.importedMultiProvidersPerMod]).toEqual([
        [
          Module1,
          [
            { token: Provider1, useValue: 'value1 of module1', multi: true },
            { token: Provider1, useValue: 'value2 of module1', multi: true },
          ],
        ],
        [
          Module2,
          [
            { token: Provider1, useValue: 'value1 of module2', multi: true },
            { token: Provider1, useValue: 'value2 of module2', multi: true },
            { token: Provider1, useValue: 'value3 of module2', multi: true },
          ],
        ],
      ]);
    });

    it('should throw an error when resolving multi providers duplicates', () => {
      class Provider1 {}

      @featureModule({
        providersPerMod: [{ token: Provider1, useValue: 'value1 of module1', multi: true }],
        exports: [Provider1],
      })
      class Module1 {}

      @featureModule({
        providersPerMod: [{ token: Provider1, useValue: 'value1 of module2', multi: true }],
        exports: [Provider1],
      })
      class Module2 {}

      @rootModule({
        imports: [Module1, Module2],
        resolvedCollisionsPerMod: [[Provider1, Module1]],
      })
      class AppModule {}

      const err = coreErrors.donotResolveCollisionForMultiProviderPerLevel('AppModule', 'Module1', 'Mod', 'Provider1');
      expect(() => importModulesShallow(AppModule)).toThrow(err);
    });

    it('exporting duplicates with "multi == true" not to throw', () => {
      class Provider1 {}
      class Provider2 {}

      @featureModule({
        providersPerMod: [{ token: Provider1, useClass: Provider1, multi: true }, Provider2],
        exports: [Provider1],
      })
      class Module1 {}

      @featureModule({
        providersPerMod: [{ token: Provider1, useClass: Provider1, multi: true }],
        exports: [Provider1],
      })
      class Module2 {}

      @rootModule({
        imports: [Module1, Module2],
      })
      class AppModule {}

      expect(() => importModulesShallow(AppModule)).not.toThrow();
    });

    it('exporting duplicates of Provider2, declared in resolvedCollisionsPerMod of root module', () => {
      class Provider1 {}
      class Provider2 {}
      class Provider3 {}
      const factory = makePropDecorator();

      class ClassWithFactory {
        @factory()
        method1() {}
      }
      const useFactoryProvider2: FactoryProvider = {
        token: Provider2,
        useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1],
      };

      @featureModule({
        providersPerMod: [Provider1, useFactoryProvider2],
        exports: [Provider1, Provider2],
      })
      class Module1 {}

      @featureModule({
        imports: [Module1],
        providersPerMod: [Provider2, Provider3],
        exports: [Module1, Provider2, Provider3],
      })
      class Module2 {}

      @rootModule({
        imports: [Module2],
        resolvedCollisionsPerMod: [[Provider2, Module1]],
      })
      class AppModule {}

      expect(() => importModulesShallow(AppModule)).not.toThrow();
      expect([...mock.importedProvidersPerMod]).toEqual([
        [Provider1, { modRefId: Module1, providers: [Provider1] }],
        [Provider2, { modRefId: Module1, providers: [useFactoryProvider2] }],
        [Provider3, { modRefId: Module2, providers: [Provider3] }],
      ]);
    });

    it('exporting duplicates in Module2 (with params), but declared in resolvedCollisionsPerMod of root module', () => {
      class Provider1 {}
      class Provider2 {}

      @featureModule({
        providersPerMod: [Provider1, Provider2],
        exports: [Provider1],
      })
      class Module1 {}

      @featureModule({
        providersPerMod: [{ token: Provider1, useClass: Provider1 }, Provider2],
        exports: [Provider1, Provider2],
      })
      class Module2 {
        static withParams() {
          return { module: Module2 };
        }
      }

      const baseModuleWithParams = Module2.withParams();

      @rootModule({
        imports: [Module1, baseModuleWithParams],
        resolvedCollisionsPerMod: [[Provider1, Module1]],
      })
      class AppModule {}

      expect(() => importModulesShallow(AppModule)).not.toThrow();
      expect([...mock.importedProvidersPerMod]).toEqual([
        [Provider1, { modRefId: Module1, providers: [Provider1] }],
        [Provider2, { modRefId: baseModuleWithParams, providers: [Provider2] }],
      ]);
    });

    it('resolved collision for feature module', () => {
      @featureModule({
        providersPerMod: [Provider1],
        exports: [Provider1],
      })
      class Module1 {}

      @featureModule({
        providersPerMod: [{ token: Provider1, useValue: 'one' }],
        exports: [Provider1],
      })
      class Module2 {}

      @featureModule({
        imports: [Module1, Module2],
        resolvedCollisionsPerMod: [[Provider1, Module1]],
        exports: [Module1, Module2],
      })
      class Module3 {}

      @rootModule({
        imports: [Module3],
        resolvedCollisionsPerMod: [[Provider1, Module2]],
      })
      class AppModule {}

      expect(() => importModulesShallow(AppModule)).not.toThrow();
      const mod3 = mock.shallowImportsBase.get(Module3)!;
      expect([...mod3.importedTokensMap.perMod]).toEqual([[Provider1, { modRefId: Module1, providers: [Provider1] }]]);
      expect([...mock.importedProvidersPerMod]).toEqual([
        [Provider1, { modRefId: Module2, providers: [{ token: Provider1, useValue: 'one' }] }],
      ]);
    });

    it('for feature module', () => {
      @featureModule({
        providersPerMod: [Provider1],
        exports: [Provider1],
      })
      class Module1 {}

      @featureModule({
        providersPerMod: [{ token: Provider1, useValue: 'one' }],
        exports: [Provider1],
      })
      class Module2 {}

      @featureModule({
        providersPerApp: [{ token: 'token1', useValue: 'value1' }],
        imports: [Module1, Module2],
      })
      class Module3 {}

      @rootModule({
        imports: [Module3],
      })
      class AppModule {}

      const err = coreErrors.providersCollision('Module3', [Provider1], ['Module1', 'Module2'], 'Mod');
      expect(() => importModulesShallow(AppModule)).toThrow(err);
    });

    it('exporting duplicates of Provider2', () => {
      @featureModule({
        exports: [Provider1, Provider2],
        providersPerMod: [{ token: Provider1, useToken: Provider1 }, Provider2],
      })
      class Module1 {}

      @featureModule({
        imports: [Module1],
        providersPerMod: [{ token: Provider2, useClass: Provider2 }, Provider3],
        exports: [Module1, Provider2, Provider3],
      })
      class Module2 {}

      @rootModule({
        imports: [Module2],
      })
      class AppModule {}

      const err = coreErrors.providersCollision('AppModule', [Provider2], ['Module1', 'Module2'], 'Mod');
      expect(() => importModulesShallow(AppModule)).toThrow(err);
    });

    it('exporting duplicates of Provider2, but declared in resolvedCollisionsPerMod of root module', () => {
      @featureModule({
        providersPerMod: [{ token: Provider1, useToken: Provider1 }, Provider2],
        exports: [Provider1, Provider2],
      })
      class Module1 {}

      @featureModule({
        imports: [Module1],
        providersPerMod: [{ token: Provider2, useClass: Provider2 }, Provider3],
        exports: [Module1, Provider2, Provider3],
      })
      class Module2 {}

      @rootModule({
        imports: [Module2],
        resolvedCollisionsPerMod: [[Provider2, Module2]],
      })
      class AppModule {}

      expect(() => importModulesShallow(AppModule)).not.toThrow();
      expect([...mock.importedProvidersPerMod]).toEqual([
        [Provider1, { modRefId: Module1, providers: [{ token: Provider1, useToken: Provider1 }] }],
        [Provider2, { modRefId: Module2, providers: [{ token: Provider2, useClass: Provider2 }] }],
        [Provider3, { modRefId: Module2, providers: [Provider3] }],
      ]);
    });

    it('exporting duplicates of Provider1 from Module1 and Module2', () => {
      @featureModule({
        providersPerMod: [{ token: Provider1, useClass: Provider1 }, Provider2],
        exports: [Provider1],
      })
      class Module0 {}

      @featureModule({
        providersPerMod: [{ token: Provider1, useToken: Provider1 }, Provider2],
        exports: [Provider1, Provider2],
      })
      class Module1 {}

      @rootModule({
        imports: [Module0, Module1],
      })
      class AppModule {}

      const err = coreErrors.providersCollision('AppModule', [Provider1], ['Module0', 'Module1'], 'Mod');
      expect(() => importModulesShallow(AppModule)).toThrow(err);
    });

    it('exporting duplicates of Provider1 from Module1 and Module2, but also includes in resolvedCollisionsPerMod of root module', () => {
      @featureModule({
        providersPerMod: [{ token: Provider1, useClass: Provider2 }, Provider2],
        exports: [Provider1, Provider2],
      })
      class Module1 {}

      @featureModule({
        providersPerMod: [
          { token: Provider1, useToken: Provider1 },
          { token: Provider2, useToken: Provider1 },
        ],
        exports: [Provider1, Provider2],
      })
      class Module2 {}

      @rootModule({
        imports: [Module1, Module2],
        resolvedCollisionsPerMod: [
          [Provider1, Module2],
          [Provider2, Module1],
        ],
      })
      class AppModule {}

      expect(() => importModulesShallow(AppModule)).not.toThrow();
      expect([...mock.importedProvidersPerMod]).toEqual([
        [Provider1, { modRefId: Module2, providers: [{ token: Provider1, useToken: Provider1 }] }],
        [Provider2, { modRefId: Module1, providers: [Provider2] }],
      ]);
    });
  });
});
