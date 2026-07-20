import { jest } from '@jest/globals';

import { Reflector } from '#di/reflector.js';
import { featureModule } from '#decorators/feature-module.js';
import { rootModule } from '#decorators/root-module.js';
import { Extension } from '#extension/extension-types.js';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { ModuleId, ModuleManager } from './module-manager.js';
import { AllInitHooks, InitDecoratorOptions, InitDecorator, InitHooks } from '#decorators/init-hooks-and-metadata.js';
import { NormalizedInitMeta, NormalizedModuleMeta, getProxyForInitMeta } from '#init/normalized-meta.js';
import { ModRefId } from '#types/mix.js';
import { DynamicModule } from '#decorators/module-decorator-options.js';
import { clearDebugClassNames } from '#utils/get-debug-class-name.js';
import { isDynamicModule } from '#decorators/type-guards.js';
import {
  ImportAdditionFailure,
  ImportRemovalFailure,
  ForbiddenRollback,
  ModuleIdNotFound,
  NormalizationFailure,
  ForbiddenSavingSnapshot,
  MissingRootDecorator,
} from '#errors';
import { injectable } from '#di/decorators.js';
import { forwardRef } from '#di/forward-ref.js';
import type { Provider } from '#di/top/types-and-models.js';
import { isMultiProvider } from '#di/utils.js';

describe('ModuleManager', () => {
  @injectable()
  class Service1 {}
  @injectable()
  class Service2 {}
  @injectable()
  class Service3 {}

  class MockModuleManager extends ModuleManager {
    declare map: Map<ModRefId, NormalizedModuleMeta>;
    declare mapId: Map<string, ModRefId>;
    declare snapshotMap: Map<ModRefId, NormalizedModuleMeta>;
    declare snapshotMapId: Map<string, ModRefId>;
    declare oldSnapshotMap: Map<ModRefId, NormalizedModuleMeta>;
    declare oldSnapshotMapId: Map<string, ModRefId>;

    override normalizeMeta(modRefId: ModRefId, allInitHooks: AllInitHooks): NormalizedModuleMeta {
      return super.normalizeMeta(modRefId, allInitHooks);
    }

    override getNormalizedModuleMetaFromSnapshot(moduleId: ModuleId) {
      return super.getNormalizedModuleMetaFromSnapshot(moduleId);
    }

    override copyNormalizedModuleMeta(normalizedModuleMeta: NormalizedModuleMeta): NormalizedModuleMeta {
      return super.copyNormalizedModuleMeta(normalizedModuleMeta);
    }

    override saveSnapshot() {
      super.saveSnapshot();
    }
  }

  let mock: MockModuleManager;

  beforeEach(() => {
    clearDebugClassNames();
    const systemLogMediator = new SystemLogMediator({ moduleName: 'fakeName' });
    mock = new MockModuleManager(systemLogMediator);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('scanRootModule()', () => {
    it('should scan the root module first among all modules (due to moduleNormalizer.checkAndMarkExternalModule())', () => {
      class LocalService1 {}
      class LocalService2 {}

      @featureModule({ providersPerApp: [LocalService1] })
      class Module1 {}

      @featureModule({
        providersPerApp: [LocalService2],
        imports: [Module1],
      })
      class Module2 {}

      @rootModule({ imports: [Module2] })
      class AppModule {}

      jest.spyOn(mock, 'normalizeMeta');
      mock.scanRootModule(AppModule);
      expect(mock.normalizeMeta).toHaveBeenNthCalledWith(1, AppModule, new Map());
      expect(mock.normalizeMeta).toHaveBeenNthCalledWith(2, Module2, new Map());
      expect(mock.normalizeMeta).toHaveBeenNthCalledWith(3, Module1, new Map());
    });

    it('should throw MissingRootDecorator error if the module lacks a root module decorator', () => {
      class AppModule {}
      expect(() => mock.scanRootModule(AppModule)).toThrow(new MissingRootDecorator('AppModule'));
    });

    it('should log a warning and return root metadata if scanned twice', () => {
      @rootModule({ providersPerApp: [Service1] })
      class AppModule {}

      const systemLogMediator = new SystemLogMediator({ moduleName: 'fakeName' });
      const spy = jest.spyOn(systemLogMediator, 'forbiddenRescanRootModule');
      const manager = new MockModuleManager(systemLogMediator);

      const meta1 = manager.scanRootModule(AppModule);
      const meta2 = manager.scanRootModule(AppModule);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(meta1).toBe(meta2);
    });

    it('should throw NormalizationFailure if metadata normalization fails', () => {
      class NotAModule {}

      @rootModule({ imports: [NotAModule] })
      class AppModule {}

      expect(() => mock.scanRootModule(AppModule)).toThrow(NormalizationFailure);
    });
  });

  describe('providersPerApp', () => {
    class Service0 {}
    class LocalService1 {}
    class LocalService2 {}
    class LocalService3 {}
    class LocalService4 {}
    class LocalService5 {}
    class LocalService6 {}
    class LocalService7 {}

    @featureModule({ providersPerApp: [Service0] })
    class Module0 {}

    @featureModule({ providersPerApp: [LocalService1] })
    class Module1 {}

    @featureModule({
      providersPerApp: [LocalService2, LocalService3, LocalService4],
      imports: [Module1],
    })
    class Module2 {}

    @featureModule({
      providersPerApp: [LocalService5, LocalService6],
      imports: [Module2],
    })
    class Module3 {}

    @rootModule({
      imports: [Module3, Module0],
      providersPerApp: [{ token: LocalService1, useClass: LocalService7 }],
      exports: [Module0],
    })
    class AppModule {}

    it('should collect providers from exports array without importing them', () => {
      mock.scanRootModule(AppModule);
      const providersPerApp = mock.providersPerApp;
      expect(providersPerApp.includes(Service0)).toBe(true);
    });

    it('should collect providers in a particular order', () => {
      mock.scanRootModule(AppModule);
      expect(mock.providersPerApp).toEqual([
        LocalService1,
        LocalService2,
        LocalService3,
        LocalService4,
        LocalService5,
        LocalService6,
        Service0,
      ]);
    });

    it('should work with dynamicModule', () => {
      @featureModule({})
      class Module6 {}

      mock.scanModule({ module: Module6, providersPerApp: [LocalService7] });
      const providersPerApp = mock.providersPerApp;
      expect(providersPerApp).toEqual([LocalService7]);
    });
  });

  describe('circular imports', () => {
    it('should support circular imports of modules "Module1 -> Module3 -> Module2 -> Module1" using forwardRef()', () => {
      @featureModule({ providersPerApp: [Service1], imports: [forwardRef(() => Module3)] })
      class Module1 {}

      @featureModule({ imports: [Module1], providersPerApp: [Service2] })
      class Module2 {}

      @featureModule({ imports: [Module2], providersPerApp: [Service3] })
      class Module3 {}

      @featureModule({ imports: [Module3], providersPerApp: [Service1] })
      class Module4 {}

      @rootModule({
        providersPerApp: [Service1],
        imports: [Module4],
      })
      class AppModule {}

      expect(() => mock.scanRootModule(AppModule)).not.toThrow();
      expect(mock.getNormalizedModuleMeta(Module1)?.importsModules).toEqual([Module3]);
      expect(mock.getNormalizedModuleMeta(Module3)?.importsModules).toEqual([Module2]);
    });
  });

  describe('dynamic imports (addImport)', () => {
    @rootModule({
      imports: [],
      providersPerMod: [Service1],
      extensionsMeta: {},
      exports: [],
    })
    class AppModule {}

    @featureModule({ providersPerMod: [Service1], exports: [Service1] })
    class Module1 {}

    @featureModule({ providersPerMod: [Service1], exports: [Service1] })
    class Module2 {}

    @featureModule({ providersPerMod: [Service1], exports: [Service1] })
    class Module3 {}

    @featureModule({ providersPerMod: [Service1], exports: [Service1] })
    class Module4 {}

    const module3WithProviders: DynamicModule = { module: Module3, providersPerMod: [Service2] };

    const getExpectedMeta1 = () => {
      const expectedMeta1 = new NormalizedModuleMeta();
      expectedMeta1.id = '';
      expectedMeta1.name = 'AppModule';
      expectedMeta1.modRefId = AppModule;
      expectedMeta1.providersPerMod = [Service1];
      expectedMeta1.declaredInDir = expect.any(String);
      expectedMeta1.isExternal = undefined;
      expectedMeta1.mInitHooks = expect.any(Map);
      expectedMeta1.decoratorOptions = expect.any(Object);
      return expectedMeta1;
    };

    it('should add a module to root imports and check maps, size, and commit/reset behavior', () => {
      const expectedMeta1 = getExpectedMeta1();

      mock.scanRootModule(AppModule);
      expect(mock.map.size).toBe(1);
      expect(mock.getNormalizedModuleMeta('root')).not.toBe(mock.getNormalizedModuleMetaFromSnapshot('root'));
      expect(mock.getNormalizedModuleMeta('root')).toBe(mock.getNormalizedModuleMeta('root'));
      expect(mock.getNormalizedModuleMeta('root')).toEqual(expectedMeta1);

      expect(mock.addImport(Module1)).toBe(true);
      expect(mock.snapshotMap.size).toBe(2);
      expect(mock.map.size).toBe(1);
      expect(mock.snapshotMap.has(Module1)).toBe(true);
      expect(mock.map.has(Module1)).toBe(false);
      expect(mock.oldSnapshotMapId.size).toBe(1);
      expect(mock.oldSnapshotMapId.get('root')).toBe(AppModule);
      expect(mock.oldSnapshotMap.size).toBe(1);
      expect(mock.oldSnapshotMap.get(AppModule)).toEqual(expectedMeta1);

      mock.commit();
      expect(mock.oldSnapshotMapId.size).toBe(0);
      expect(mock.oldSnapshotMap.size).toBe(0);
      expect(mock.snapshotMap.size).toBe(2);
      expect(mock.snapshotMap.has(AppModule)).toBe(true);
      expect(mock.snapshotMap.has(Module1)).toBe(true);

      mock.reset();
      expect(mock.oldSnapshotMapId.size).toBe(0);
      expect(mock.oldSnapshotMap.size).toBe(0);
      expect(mock.map.size).toBe(2);
      expect(mock.map.has(AppModule)).toBe(true);
      expect(mock.map.has(Module1)).toBe(true);
    });

    it('should return false when trying to add an already imported module', () => {
      mock.scanRootModule(AppModule);
      expect(mock.addImport(Module1)).toBe(true);
      mock.commit();
      mock.reset();

      expect(mock.addImport(Module1)).toBe(false);
    });

    it('should throw ImportAdditionFailure when target module ID is not found', () => {
      mock.scanRootModule(AppModule);
      expect(() => mock.addImport(Module2, 'fakeId')).toThrow(new ImportAdditionFailure('Module2', 'fakeId'));
    });

    it('should support multiple additions, commit, reset and verify metadata', () => {
      mock.scanRootModule(AppModule);
      mock.addImport(Module1);
      mock.commit();
      mock.reset();

      mock.addImport(Module2);
      mock.addImport(Module4);

      mock.commit();
      mock.reset();

      const expectedMeta3 = new NormalizedModuleMeta();
      expectedMeta3.id = '';
      expectedMeta3.name = 'AppModule';
      expectedMeta3.modRefId = AppModule;
      expectedMeta3.importsModules = [Module1, Module2, Module4];
      expectedMeta3.providersPerMod = [Service1];
      expectedMeta3.declaredInDir = expect.any(String);
      expectedMeta3.isExternal = undefined;
      expectedMeta3.mInitHooks = expect.any(Map);
      expectedMeta3.decoratorOptions = expect.any(Object);

      expect(mock.getNormalizedModuleMeta('root')).toEqual(expectedMeta3);
    });

    it('should support rollback operations', () => {
      mock.scanRootModule(AppModule);
      mock.addImport(Module1);
      mock.commit();
      mock.reset();

      const expectedMeta3 = new NormalizedModuleMeta();
      expectedMeta3.id = '';
      expectedMeta3.name = 'AppModule';
      expectedMeta3.modRefId = AppModule;
      expectedMeta3.importsModules = [Module1];
      expectedMeta3.providersPerMod = [Service1];
      expectedMeta3.declaredInDir = expect.any(String);
      expectedMeta3.isExternal = undefined;
      expectedMeta3.mInitHooks = expect.any(Map);
      expectedMeta3.decoratorOptions = expect.any(Object);

      mock.addImport(module3WithProviders);
      expect(mock.snapshotMap.size).toBe(3);
      expect(mock.map.size).toBe(2);
      expect(mock.getNormalizedModuleMetaFromSnapshot('root')).toEqual({
        ...expectedMeta3,
        importsWithOpts: [module3WithProviders],
      });

      mock.rollback();
      expect(mock.snapshotMap.size).toBe(2);
      expect(mock.map.size).toBe(2);
      expect(mock.getNormalizedModuleMetaFromSnapshot('root')).toEqual(expectedMeta3);
      expect(mock.getNormalizedModuleMeta('root')).toEqual(expectedMeta3);
    });
  });

  describe('dynamic removal (removeImport)', () => {
    @featureModule({ providersPerMod: [Service1], exports: [Service1] })
    class Module0 {}

    @featureModule({ imports: [Module0], providersPerMod: [Service1], exports: [Service1] })
    class Module1 {}

    @featureModule({ imports: [Module0], providersPerMod: [Service1], exports: [Service1] })
    class Module2 {}

    @featureModule({ providersPerMod: [Service1], exports: [Service1] })
    class Module3 {
      static withOpts(providersPerMod: Provider[]): DynamicModule<Module3> {
        return {
          module: Module3,
          providersPerMod,
        };
      }
    }

    const module3WithProviders = Module3.withOpts([Service2]);

    const moduleId = 'my-mix';
    @featureModule({ providersPerMod: [Service1], exports: [Service1] })
    class Module4 {
      static withOpts(providersPerMod: Provider[]): DynamicModule<Module4> {
        return {
          id: moduleId,
          module: Module4,
          providersPerMod,
        };
      }
    }

    const module4WithProviders = Module4.withOpts([Service2]);

    @rootModule({
      imports: [Module1, Module2, module3WithProviders, module4WithProviders],
      providersPerMod: [Service1],
      extensionsMeta: {},
      exports: [],
    })
    class AppModule {}

    const getExpectedMeta1 = () => {
      const expectedMeta1 = new NormalizedModuleMeta();
      expectedMeta1.id = '';
      expectedMeta1.name = 'AppModule';
      expectedMeta1.modRefId = AppModule;
      expectedMeta1.importsModules = [Module1, Module2];
      expectedMeta1.importsWithOpts = [module3WithProviders, module4WithProviders];
      expectedMeta1.providersPerMod = [Service1];
      expectedMeta1.declaredInDir = expect.any(String);
      expectedMeta1.isExternal = undefined;
      expectedMeta1.mInitHooks = expect.any(Map);
      expectedMeta1.decoratorOptions = expect.any(Object);
      return expectedMeta1;
    };

    it('should remove a module from imports and update maps/snapshots correctly', () => {
      mock.scanRootModule(AppModule);
      expect(mock.snapshotMap.size).toBe(6);
      expect(mock.map.size).toBe(6);
      expect(mock.getNormalizedModuleMeta('root')).toEqual(getExpectedMeta1());

      expect(mock.removeImport(Module0, Module1)).toBe(true);
      expect(mock.snapshotMap.get(Module1)?.importsModules).toEqual([]);
      expect(mock.map.get(Module1)?.importsModules).toEqual([Module0]);

      expect(mock.removeImport(Module0, Module2)).toBe(true);
      expect(mock.snapshotMap.get(Module2)?.importsModules).toEqual([]);
      expect(mock.map.get(Module2)?.importsModules).toEqual([Module0]);
      expect(mock.snapshotMap.size).toBe(5);
      expect(mock.map.size).toBe(6);

      mock.commit();
      mock.reset();
      expect(mock.snapshotMap.size).toBe(5);
      expect(mock.map.size).toBe(5);

      expect(mock.removeImport(Module2)).toBe(true);
      expect(mock.getNormalizedModuleMetaFromSnapshot('root')?.importsModules).toEqual([Module1]);
      expect(mock.getNormalizedModuleMeta('root')?.importsModules).toEqual([Module1, Module2]);
      expect(mock.snapshotMap.size).toBe(4);
      expect(mock.map.size).toBe(5);

      expect(mock.removeImport(module3WithProviders)).toBe(true);
      expect(mock.getNormalizedModuleMetaFromSnapshot('root')?.importsWithOpts).toEqual([module4WithProviders]);
      expect(mock.snapshotMap.size).toBe(3);

      expect(mock.removeImport(moduleId)).toBe(true);
      expect(mock.snapshotMap.size).toBe(2);
    });

    it('should return false when trying to remove a module that is not imported', () => {
      mock.scanRootModule(AppModule);
      mock.removeImport(Module2);
      expect(mock.removeImport(Module2)).toBe(false);
    });

    it('should return false if input module to remove is not found in snapshot', () => {
      mock.scanRootModule(AppModule);
      expect(mock.removeImport('non-existent')).toBe(false);
    });

    it('should throw ImportRemovalFailure if target module ID is not found', () => {
      mock.scanRootModule(AppModule);
      expect(() => mock.removeImport(Module1, 'non-existent-target')).toThrow(
        new ImportRemovalFailure('Module1', 'non-existent-target'),
      );
    });

    it('should support rollback operations during removal', () => {
      mock.scanRootModule(AppModule);
      mock.removeImport(moduleId);
      expect(mock.snapshotMap.size).toBe(5);

      mock.rollback();
      expect(mock.snapshotMap.size).toBe(6);
      expect(mock.map.size).toBe(6);
      expect(mock.getNormalizedModuleMeta('root')).toEqual(getExpectedMeta1());
    });
  });

  describe('getNormalizedModuleMeta()', () => {
    @rootModule({ providersPerApp: [Service1] })
    class AppModule {}

    it('should return undefined if module is not found and throwErrIfNotFound is false', () => {
      mock.scanRootModule(AppModule);
      expect(mock.getNormalizedModuleMeta('non-existent')).toBeUndefined();
    });

    it('should throw ModuleIdNotFound if module is not found and throwErrIfNotFound is true', () => {
      mock.scanRootModule(AppModule);
      expect(() => mock.getNormalizedModuleMeta('non-existent', true)).toThrow(new ModuleIdNotFound('non-existent'));
    });

    it('should return the metadata by ref ID or string ID', () => {
      const moduleId = 'my-custom-id';
      @featureModule({ providersPerApp: [Service1] })
      class Module1 {}

      const dynamicModule: DynamicModule = { id: moduleId, module: Module1 };

      @rootModule({ imports: [dynamicModule] })
      class MyRootModule {}

      mock.scanRootModule(MyRootModule);
      expect(mock.getNormalizedModuleMeta(dynamicModule)).toBeDefined();
      expect(mock.getNormalizedModuleMeta(moduleId)).toBeDefined();
      expect(mock.getNormalizedModuleMeta(dynamicModule)).toBe(mock.getNormalizedModuleMeta(moduleId));
    });
  });

  describe('getInjectorPerMod() / setInjectorPerMod()', () => {
    const moduleId = 'custom-id';
    @featureModule({ providersPerApp: [Service1] })
    class Module1 {}

    const dynamicModule: DynamicModule = { id: moduleId, module: Module1 };

    @rootModule({ imports: [dynamicModule] })
    class AppModule {}

    it('should set and get injectors per module correctly', () => {
      mock.scanRootModule(AppModule);
      const fakeInjector = {} as any;

      mock.setInjectorPerMod(dynamicModule, fakeInjector);
      expect(mock.getInjectorPerMod(dynamicModule)).toBe(fakeInjector);
      expect(mock.getInjectorPerMod(moduleId)).toBe(fakeInjector);
      expect(mock.getInjectorPerMod('root')).toBeUndefined();
    });

    it('should throw ModuleIdNotFound on setInjectorPerMod if target module string ID is not found in mapId', () => {
      mock.scanRootModule(AppModule);
      const fakeInjector = {} as any;
      expect(() => mock.setInjectorPerMod('non-existent', fakeInjector)).toThrow(new ModuleIdNotFound('non-existent'));
    });

    it('should throw ModuleIdNotFound if throwErrIfNotFound is true and injector is not found', () => {
      mock.scanRootModule(AppModule);
      expect(() => mock.getInjectorPerMod('non-existent', true)).toThrow(new ModuleIdNotFound('non-existent'));
    });
  });

  describe('getInstanceOf()', () => {
    const moduleId = 'custom-id';

    @injectable()
    class SomeModuleClass {}

    @featureModule({ providersPerApp: [SomeModuleClass] })
    class Module1 {}

    const dynamicModule: DynamicModule = { id: moduleId, module: Module1, providersPerApp: [SomeModuleClass] };

    @rootModule({ imports: [dynamicModule] })
    class AppModule {}

    it('should return instance of module using ref ID or string ID', () => {
      mock.scanRootModule(AppModule);

      const mockInstance = new SomeModuleClass();
      const fakeInjector = {
        get: jest.fn().mockReturnValue(mockInstance),
      } as any;

      mock.setInjectorPerMod(dynamicModule, fakeInjector);

      expect(mock.getInstanceOf(dynamicModule)).toBe(mockInstance);
      expect(mock.getInstanceOf(moduleId)).toBe(mockInstance);
      expect(fakeInjector.get).toHaveBeenCalledWith(Module1);
    });

    it('should throw ModuleIdNotFound if throwErrIfNotFound is true and module injector is not found', () => {
      mock.scanRootModule(AppModule);
      expect(() => mock.getInstanceOf('non-existent', true)).toThrow(new ModuleIdNotFound('non-existent'));
    });

    it('should return undefined if throwErrIfNotFound is false and module injector is not found', () => {
      mock.scanRootModule(AppModule);
      expect(mock.getInstanceOf('non-existent', false)).toBeUndefined();
    });
  });

  describe('rollback()', () => {
    it('should throw ForbiddenRollback if no transaction is active', () => {
      expect(() => mock.rollback()).toThrow(new ForbiddenRollback());
    });
  });

  describe('saveSnapshot()', () => {
    it('should throw ForbiddenSavingSnapshot if snapshot is already saved', () => {
      @rootModule({ providersPerApp: [Service1] })
      class AppModule {}
      mock.scanRootModule(AppModule);
      expect(() => mock.saveSnapshot()).toThrow(new ForbiddenSavingSnapshot());
    });
  });

  describe('copyNormalizedModuleMeta()', () => {
    it('should copy NormalizedModuleMeta correctly, preserving prototype and recreating initMeta proxies wrapping the copy', () => {
      interface RootInitDecoratorOptions extends InitDecoratorOptions<{ path?: string }> {
        one?: string;
      }
      class InitMeta extends NormalizedInitMeta {
        path?: string;
      }
      class InitHooks1 extends InitHooks<RootInitDecoratorOptions> {
        override normalize(normalizedModuleMeta: NormalizedModuleMeta): InitMeta {
          const meta = getProxyForInitMeta(normalizedModuleMeta, InitMeta);
          if (isDynamicModule(normalizedModuleMeta.modRefId)) {
            const params = normalizedModuleMeta.modRefId.initOpts?.get(initSome);
            meta.path = params?.path;
          }
          return meta;
        }
      }
      const initSome: InitDecorator<RootInitDecoratorOptions, { path?: string }, InitMeta> =
        Reflector.makeClassDecorator((d) => new InitHooks1(d));

      @featureModule({ providersPerApp: [{ token: 'token1', useValue: 'value1' }] })
      class Module1 {}

      const dynamicModule: DynamicModule = { module: Module1 };

      @initSome({ one: 'some-here', imports: [{ dynamicModule: dynamicModule, path: 'some-prefix' }] })
      @rootModule()
      class AppModule {}

      mock.scanRootModule(AppModule);
      const originalMod1 = mock.getNormalizedModuleMeta(dynamicModule)!;
      expect(originalMod1).toBeInstanceOf(NormalizedModuleMeta);

      // Call copyNormalizedModuleMeta
      const copiedMod1 = mock.copyNormalizedModuleMeta(originalMod1);
      expect(copiedMod1).toBeInstanceOf(NormalizedModuleMeta);
      expect(copiedMod1).not.toBe(originalMod1);

      // Maps should be new instances
      expect(copiedMod1.mInitHooks).not.toBe(originalMod1.mInitHooks);
      expect(copiedMod1.allInitHooks).not.toBe(originalMod1.allInitHooks);
      expect(copiedMod1.initMeta).not.toBe(originalMod1.initMeta);

      // The proxy inside copiedMod1.initMeta should wrap copiedMod1.
      const originalProxy = originalMod1.initMeta.get(initSome) as InitMeta;
      const copiedProxy = copiedMod1.initMeta.get(initSome) as InitMeta;

      expect(copiedProxy).toBeDefined();
      expect(copiedProxy).not.toBe(originalProxy);

      // When we mutate providersPerApp of copiedMod1, it should NOT affect originalProxy, but it should affect copiedProxy.
      copiedMod1.providersPerApp.push({ token: 'new-token', useValue: 'new-val' });
      expect(originalProxy.providersPerApp.some((p) => (p as any).token === 'new-token')).toBe(false);
      expect(copiedProxy.providersPerApp.some((p) => (p as any).token === 'new-token')).toBe(true);
    });
  });

  describe('extensions', () => {
    it('should handle root module with imported some extension', () => {
      @injectable()
      class Extension1 implements Extension<void> {
        async stage1() {}
      }

      const extensionProviders: Provider[] = [Extension1];

      @featureModule({
        extensions: [{ extension: Extension1 as any, export: true }],
      })
      class Module1 {}

      @rootModule({
        imports: [Module1],
      })
      class Module3 {}

      const expectedMeta3 = new NormalizedModuleMeta();
      expectedMeta3.id = '';
      expectedMeta3.name = 'Module3';
      expectedMeta3.modRefId = Module3;
      expectedMeta3.importsModules = [Module1];
      expectedMeta3.declaredInDir = expect.any(String);
      expectedMeta3.isExternal = undefined;
      expectedMeta3.mInitHooks = expect.any(Map);
      expectedMeta3.decoratorOptions = expect.any(Object);
      delete (expectedMeta3 as any).aExtensionConfig;
      delete (expectedMeta3 as any).aExportedExtensionConfig;

      const expectedMeta1 = new NormalizedModuleMeta();
      expectedMeta1.id = '';
      expectedMeta1.name = 'Module1';
      expectedMeta1.modRefId = Module1;
      expectedMeta1.extensionProviders = extensionProviders;
      expectedMeta1.exportedExtensionProviders = extensionProviders;
      expectedMeta1.declaredInDir = expect.any(String);
      expectedMeta1.isExternal = false;
      expectedMeta1.decoratorOptions = expect.any(Object);
      delete (expectedMeta1 as any).aExtensionConfig;
      delete (expectedMeta1 as any).aExportedExtensionConfig;
      expectedMeta1.mInitHooks = expect.any(Map);

      mock.scanRootModule(Module3);
      expect(mock.getNormalizedModuleMeta('root')).toMatchObject(expectedMeta3);
      expect(mock.getNormalizedModuleMeta(Module1)).toMatchObject(expectedMeta1);
    });

    it('should handle root module with exported and applied some extension', () => {
      @injectable()
      class Extension1 implements Extension<void> {
        async stage1() {}
      }

      const extensionProviders: Provider[] = [Extension1];

      @featureModule({
        extensions: [{ extension: Extension1 as any, export: true }],
      })
      class Module1 {}

      @rootModule({
        imports: [Module1],
        exports: [Module1],
      })
      class Module3 {}

      const expectedMeta3 = new NormalizedModuleMeta();
      expectedMeta3.id = '';
      expectedMeta3.name = 'Module3';
      expectedMeta3.modRefId = Module3;
      expectedMeta3.importsModules = [Module1];
      expectedMeta3.exportsModules = [Module1];
      expectedMeta3.declaredInDir = expect.any(String);
      expectedMeta3.isExternal = undefined;
      expectedMeta3.decoratorOptions = expect.any(Object);
      expectedMeta3.mInitHooks = expect.any(Map);
      delete (expectedMeta3 as any).aExtensionConfig;
      delete (expectedMeta3 as any).aExportedExtensionConfig;

      const expectedMeta1 = new NormalizedModuleMeta();
      expectedMeta1.id = '';
      expectedMeta1.name = 'Module1';
      expectedMeta1.modRefId = Module1;
      expectedMeta1.extensionProviders = extensionProviders;
      expectedMeta1.exportedExtensionProviders = extensionProviders;
      expectedMeta1.declaredInDir = expect.any(String);
      expectedMeta1.isExternal = false;
      expectedMeta1.decoratorOptions = expect.any(Object);
      expectedMeta1.mInitHooks = expect.any(Map);
      delete (expectedMeta1 as any).aExtensionConfig;
      delete (expectedMeta1 as any).aExportedExtensionConfig;

      mock.scanRootModule(Module3);
      expect(mock.getNormalizedModuleMeta('root')).toMatchObject(expectedMeta3);
      expect(mock.getNormalizedModuleMeta(Module1)).toMatchObject(expectedMeta1);
    });
  });

  describe('split multi providers', () => {
    it('should split multi providers and common providers correctly', () => {
      const providersPerMod: Provider[] = [
        { token: Service2, useValue: 'val4', multi: true },
        { token: Service1, useValue: 'val1', multi: true },
        { token: Service1, useValue: 'val2', multi: true },
        { token: Service1, useValue: 'val3', multi: true },
        Service3,
      ];

      @featureModule({
        providersPerMod,
        exports: [Service2, Service1, Service3],
      })
      class Module1 {}

      @rootModule({
        imports: [Module1],
      })
      class Module3 {}

      const expectedMeta3 = new NormalizedModuleMeta();
      expectedMeta3.id = '';
      expectedMeta3.name = 'Module3';
      expectedMeta3.modRefId = Module3;
      expectedMeta3.importsModules = [Module1];
      expectedMeta3.declaredInDir = expect.any(String);
      expectedMeta3.isExternal = undefined;
      expectedMeta3.decoratorOptions = expect.any(Object);
      expectedMeta3.mInitHooks = expect.any(Map);

      const expectedMeta1 = new NormalizedModuleMeta();
      expectedMeta1.id = '';
      expectedMeta1.name = 'Module1';
      expectedMeta1.modRefId = Module1;
      expectedMeta1.decoratorOptions = expect.any(Object);
      expectedMeta1.providersPerMod = providersPerMod;
      expectedMeta1.exportedProvidersPerMod = [Service3];
      expectedMeta1.exportedMultiProvidersPerMod = providersPerMod.filter(isMultiProvider);
      expectedMeta1.declaredInDir = expect.any(String);
      expectedMeta1.isExternal = false;
      expectedMeta1.mInitHooks = expect.any(Map);

      mock.scanRootModule(Module3);
      expect(mock.getNormalizedModuleMeta('root')).toEqual(expectedMeta3);
      expect(mock.getNormalizedModuleMeta(Module1)).toEqual(expectedMeta1);
    });
  });

  describe('init hooks propagation', () => {
    @featureModule()
    class HostModule1 {}
    @featureModule()
    class HostModule2 {}
    @featureModule()
    class HostModule3 {}
    @featureModule()
    class HostModule4 {}

    class InitHooks1 extends InitHooks<any> {
      override hostModule = HostModule1;
      override hostDecoratorOptions = { one: 1 };
    }

    class InitHooks2 extends InitHooks<any> {
      override hostModule = HostModule2;
      override hostDecoratorOptions = { two: 2 };
    }

    class InitHooks3 extends InitHooks<any> {
      override hostModule = HostModule3;
      override hostDecoratorOptions = { three: 3 };
    }

    class InitHooks4 extends InitHooks<any> {
      override hostModule = HostModule4;
      override hostDecoratorOptions = { four: 4 };
    }

    it('should propagate allInitHooks so that they only contain init hooks imported into the current module', () => {
      const initSome1: InitDecorator<any, any, any> = Reflector.makeClassDecorator((data) => new InitHooks1(data));
      const initSome2: InitDecorator<any, any, any> = Reflector.makeClassDecorator((data) => new InitHooks2(data));
      const initSome3: InitDecorator<any, any, any> = Reflector.makeClassDecorator((data) => new InitHooks3(data));
      const initSome4: InitDecorator<any, any, any> = Reflector.makeClassDecorator((data) => new InitHooks4(data));

      @initSome1({ name: '1' })
      @featureModule()
      class Module1 {}

      @initSome2({ name: '2' })
      @featureModule({ imports: [Module1], providersPerApp: [Service1] })
      class Module2 {}

      @initSome3({ name: '3' })
      @featureModule({ imports: [Module2], providersPerApp: [Service1] })
      class Module3 {}

      @initSome4({ name: '4' })
      @rootModule({ imports: [Module3], providersPerApp: [Service1] })
      class Module4 {}

      mock.scanRootModule(Module4);

      const mod1 = mock.getNormalizedModuleMeta(Module1, true);
      const mod2 = mock.getNormalizedModuleMeta(Module2, true);
      const mod3 = mock.getNormalizedModuleMeta(Module3, true);
      const mod4 = mock.getNormalizedModuleMeta(Module4, true);

      expect(mock.getNormalizedModuleMeta(HostModule1, true).modRefId).toBe(HostModule1);
      expect(mock.getNormalizedModuleMeta(HostModule2, true).modRefId).toBe(HostModule2);
      expect(mock.getNormalizedModuleMeta(HostModule3, true).modRefId).toBe(HostModule3);
      expect(mock.getNormalizedModuleMeta(HostModule4, true).modRefId).toBe(HostModule4);

      expect(mod1.allInitHooks.size).toBe(1);
      expect(mod1.allInitHooks.get(initSome1)?.hostModule).toBe(HostModule1);

      expect(mod2.allInitHooks.size).toBe(2);
      expect(mod2.allInitHooks.get(initSome1)?.hostModule).toBe(HostModule1);
      expect(mod2.allInitHooks.get(initSome2)?.hostModule).toBe(HostModule2);

      expect(mod3.allInitHooks.size).toBe(3);
      expect(mod3.allInitHooks.get(initSome1)?.hostModule).toBe(HostModule1);
      expect(mod3.allInitHooks.get(initSome2)?.hostModule).toBe(HostModule2);
      expect(mod3.allInitHooks.get(initSome3)?.hostModule).toBe(HostModule3);

      expect(mod4.allInitHooks.size).toBe(4);
      expect(mod4.allInitHooks.get(initSome1)?.hostModule).toBe(HostModule1);
      expect(mod4.allInitHooks.get(initSome2)?.hostModule).toBe(HostModule2);
      expect(mod4.allInitHooks.get(initSome3)?.hostModule).toBe(HostModule3);
      expect(mod4.allInitHooks.get(initSome4)?.hostModule).toBe(HostModule4);
    });

    it('should handle Module1 not having an annotation with initSome, but imported in AppModule with this decorator', () => {
      interface RootDecoratorOptions extends InitDecoratorOptions<{ path?: string }> {
        one?: string;
        two?: string;
      }
      interface InitMeta extends NormalizedInitMeta {
        path?: string;
      }
      const initSome: InitDecorator<RootDecoratorOptions, { path?: string }, InitMeta> = Reflector.makeClassDecorator(
        (d) => new InitHooks1(d),
      );

      class InitHooks1Local extends InitHooks<RootDecoratorOptions> {
        override normalize({ modRefId }: NormalizedModuleMeta): InitMeta {
          if (isDynamicModule(modRefId)) {
            const params = modRefId.initOpts?.get(initSomeLocal);
            return { path: params?.path } as InitMeta;
          }
          return {} as InitMeta;
        }
      }

      @featureModule({ providersPerApp: [{ token: 'token1', useValue: 'value1' }] })
      class Module1 {}

      const dynamicModule: DynamicModule = { module: Module1 };

      const initSomeLocal: InitDecorator<RootDecoratorOptions, { path?: string }, InitMeta> =
        Reflector.makeClassDecorator((d) => new InitHooks1Local(d));

      @initSomeLocal({ one: 'some-here', imports: [{ dynamicModule: dynamicModule, path: 'some-prefix' }] })
      @rootModule()
      class AppModuleLocal {}

      mock.scanRootModule(AppModuleLocal);
      const mod1 = mock.getNormalizedModuleMeta(dynamicModule)!;
      expect(mod1.initMeta.get(initSomeLocal)).toEqual({ path: 'some-prefix' });
    });

    it('should handle static Module1 not having an annotation with initSome, but imported in AppModule with this decorator', () => {
      interface RootDecoratorOptions extends InitDecoratorOptions<{ path?: string }> {
        one?: string;
        two?: string;
      }
      interface InitMeta extends NormalizedInitMeta {
        path?: string;
      }

      @featureModule()
      class HostModule1Local {}

      class InitHooks1Local extends InitHooks<RootDecoratorOptions> {
        override hostModule = HostModule1Local;
        override normalize({ modRefId }: NormalizedModuleMeta): InitMeta {
          return { path: 'static-default' } as InitMeta;
        }
      }

      @featureModule({ providersPerApp: [{ token: 'token1', useValue: 'value1' }] })
      class Module1 {}

      const initSomeLocal: InitDecorator<RootDecoratorOptions, { path?: string }, InitMeta> =
        Reflector.makeClassDecorator((d) => new InitHooks1Local(d));

      @initSomeLocal({ one: 'some-here', imports: [Module1] })
      @rootModule()
      class AppModuleLocal {}

      mock.scanRootModule(AppModuleLocal);
      const mod1 = mock.getNormalizedModuleMeta(Module1)!;
      expect(mod1.initMeta.get(initSomeLocal)).toEqual({ path: 'static-default' });
      expect(mod1.importsModules.includes(HostModule1Local)).toBe(true);
    });

    it('should not propagate context hooks when inheritsContext is false for static Module1', () => {
      interface RootDecoratorOptions extends InitDecoratorOptions<{ path?: string }> {
        one?: string;
      }
      interface InitMeta extends NormalizedInitMeta {
        path?: string;
      }

      @featureModule()
      class HostModule1Local {}

      class InitHooks1Local extends InitHooks<RootDecoratorOptions> {
        override hostModule = HostModule1Local;
        override normalize({ modRefId }: NormalizedModuleMeta): InitMeta {
          return { path: 'static-default' } as InitMeta;
        }
      }

      const initSomeLocal: InitDecorator<RootDecoratorOptions, { path?: string }, InitMeta> =
        Reflector.makeClassDecorator((d) => new InitHooks1Local(d));

      @featureModule({
        inheritsContext: false,
        providersPerApp: [{ token: 'token1', useValue: 'value1' }],
      })
      class Module1 {}

      @initSomeLocal({ one: 'some-here', imports: [Module1] })
      @rootModule()
      class AppModuleLocal {}

      mock.scanRootModule(AppModuleLocal);
      const mod1 = mock.getNormalizedModuleMeta(Module1)!;
      expect(mod1.initMeta.has(initSomeLocal)).toBe(false);
      expect(mod1.importsModules.includes(HostModule1Local)).toBe(false);
    });

    it('should retrieve initOpts for three different modules with params', () => {
      interface DecoratorOptions1 extends InitDecoratorOptions<{ one?: string }> {
        one?: string;
      }
      interface InitMeta1 {
        paramsForInitMeta1?: any;
      }
      interface DecoratorOptions2 extends InitDecoratorOptions<{ three?: string }> {
        three?: string;
      }
      interface InitMeta2 {
        paramsForInitMeta2?: any;
      }
      class InitHooks1Local extends InitHooks<DecoratorOptions1> {}
      class InitHooks2Local extends InitHooks<DecoratorOptions2> {}

      const initSome1: InitDecorator<DecoratorOptions1, {}, InitMeta1> = Reflector.makeClassDecorator(
        (d) => new InitHooks1Local(d),
      );
      const initSome2: InitDecorator<DecoratorOptions2, {}, InitMeta2> = Reflector.makeClassDecorator(
        (d) => new InitHooks2Local(d),
      );

      @featureModule({ providersPerApp: [{ token: 'token1', useValue: 'value1' }] })
      class Module1 {}

      @featureModule({ providersPerApp: [{ token: 'token2', useValue: 'value2' }] })
      class Module2 {}

      @featureModule({ providersPerApp: [{ token: 'token3', useValue: 'value3' }] })
      class Module3 {}

      const dynamicModule1: DynamicModule = { module: Module1 };
      const dynamicModule2: DynamicModule = { module: Module2 };
      const dynamicModule3: DynamicModule = { module: Module3 };

      @initSome1({
        imports: [
          { dynamicModule: dynamicModule1, one: 'initSome1-1' },
          { dynamicModule: dynamicModule3, one: 'initSome1-3' },
        ],
      })
      @initSome2({
        imports: [
          { dynamicModule: dynamicModule2, three: 'initSome2-2' },
          { dynamicModule: dynamicModule3, three: 'initSome2-3' },
        ],
      })
      @rootModule()
      class AppModule {}

      mock.scanRootModule(AppModule);

      function getParams(dynamicModule: DynamicModule) {
        return [...(dynamicModule.initOpts?.values() || [])];
      }
      expect(getParams(dynamicModule1)).toEqual([{ one: 'initSome1-1' }]);
      expect(getParams(dynamicModule2)).toEqual([{ three: 'initSome2-2' }]);
      expect(getParams(dynamicModule3)).toEqual([{ three: 'initSome2-3' }, { one: 'initSome1-3' }]);
    });
  });
});
