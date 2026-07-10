import { jest } from '@jest/globals';

import { Reflector } from '#di/reflector.js';
import { featureModule } from '#decorators/feature-module.js';
import { rootModule } from '#decorators/root-module.js';
import { Extension } from '#extension/extension-types.js';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { ModuleId, ModuleManager } from './module-manager.js';
import { AllInitHooks, InitDecoratorOptions, InitDecorator, InitHooks } from '#decorators/init-hooks-and-metadata.js';
import { NormalizedInitMeta, NormalizedModuleMeta } from '#init/base-meta.js';
import { ModRefId } from '#types/mix.js';
import { DynamicModule } from '#decorators/module-decorator-options.js';
import { clearDebugClassNames } from '#utils/get-debug-class-name.js';
import { isDynamicModule } from '#decorators/type-guards.js';
import { FailAddingToImports } from '#errors';
import { injectable } from '#di/decorators.js';
import { forwardRef } from '#di/forward-ref.js';
import type { Provider } from '#di/top/types-and-models.js';
import { isMultiProvider } from '#di/utils.js';

describe('ModuleManager', () => {
  // console.log = jest.fn();
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

    override normalizeMetadata(modRefId: ModRefId, allInitHooks: AllInitHooks): NormalizedModuleMeta {
      return super.normalizeMetadata(modRefId, allInitHooks);
    }

    override getNormalizedModuleMetaFromSnapshot(moduleId: ModuleId) {
      return super.getNormalizedModuleMetaFromSnapshot(moduleId);
    }
  }

  let mock: MockModuleManager;

  beforeEach(() => {
    clearDebugClassNames();
    const systemLogMediator = new SystemLogMediator({ moduleName: 'fakeName' });
    mock = new MockModuleManager(systemLogMediator);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should scan the root module first among all modules (due to moduleNormalizer.checkAndMarkExternalModule())', () => {
    class Service1 {}
    class Service2 {}

    @featureModule({ providersPerApp: [Service1] })
    class Module1 {}

    @featureModule({
      providersPerApp: [Service2],
      imports: [Module1],
    })
    class Module2 {}

    @rootModule({ imports: [Module2] })
    class AppModule {}

    jest.spyOn(mock, 'normalizeMetadata');
    mock.scanRootModule(AppModule);
    expect(mock.normalizeMetadata).toHaveBeenNthCalledWith(1, AppModule, new Map());
    expect(mock.normalizeMetadata).toHaveBeenNthCalledWith(2, Module2, new Map());
    expect(mock.normalizeMetadata).toHaveBeenNthCalledWith(3, Module1, new Map());
  });

  describe('providersPerApp', () => {
    class Service0 {}
    class Service1 {}
    class Service2 {}
    class Service3 {}
    class Service4 {}
    class Service5 {}
    class Service6 {}
    class Service7 {}

    @featureModule({ providersPerApp: [Service0] })
    class Module0 {}

    @featureModule({ providersPerApp: [Service1] })
    class Module1 {}

    @featureModule({
      providersPerApp: [Service2, Service3, Service4],
      imports: [Module1],
    })
    class Module2 {}

    @featureModule({
      providersPerApp: [Service5, Service6],
      imports: [Module2],
    })
    class Module3 {}

    @rootModule({
      imports: [Module3, Module0],
      providersPerApp: [{ token: Service1, useClass: Service7 }],
      exports: [Module0],
    })
    class AppModule {}

    it('should collects providers from exports array without imports them', () => {
      mock.scanRootModule(AppModule);
      const providersPerApp = mock.providersPerApp;
      expect(providersPerApp.includes(Service0)).toBe(true);
    });

    it('should collects providers in particular order', () => {
      mock.scanRootModule(AppModule);
      expect(mock.providersPerApp).toEqual([Service1, Service2, Service3, Service4, Service5, Service6, Service0]);
    });

    it('should works with moduleWithParams', () => {
      @featureModule({})
      class Module6 {}

      mock.scanModule({ module: Module6, providersPerApp: [Service7] });
      const providersPerApp = mock.providersPerApp;
      expect(providersPerApp).toEqual([Service7]);
    });
  });

  it('circular imports modules "Module1 -> Module3 -> Module2 -> Module1" with forwardRef()', () => {
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

  it('programmatically adding some modules to "imports" array of root module', () => {
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

    const expectedMeta1 = new NormalizedModuleMeta();
    expectedMeta1.id = '';
    expectedMeta1.name = 'AppModule';
    expectedMeta1.modRefId = AppModule;
    expectedMeta1.providersPerMod = [Service1];
    expectedMeta1.declaredInDir = expect.any(String);
    expectedMeta1.isExternal = undefined;
    expectedMeta1.mInitHooks = expect.any(Map);
    expectedMeta1.decoratorOptions = expect.any(Object);

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

    expect(mock.addImport(Module1)).toBe(false);
    expect(mock.oldSnapshotMap.size).toBe(1);
    expect(mock.oldSnapshotMap.has(AppModule)).toBe(true);
    expect(mock.oldSnapshotMap.get(AppModule)).toEqual(expectedMeta1);
    expect(mock.snapshotMap.size).toBe(2);
    expect(mock.map.size).toBe(1);
    expect(mock.snapshotMap.has(Module1)).toBe(true);
    expect(mock.map.has(Module1)).toBe(false);

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

    expect(() => mock.addImport(Module2, 'fakeId')).toThrow(new FailAddingToImports('Module2', 'fakeId'));
    expect(mock.map.size).toBe(2);
    expect(mock.oldSnapshotMapId.size).toBe(0);
    expect(mock.oldSnapshotMap.size).toBe(0);

    mock.addImport(Module2);
    expect(mock.snapshotMap.size).toBe(3);
    expect(mock.map.size).toBe(2);
    expect(mock.snapshotMap.has(Module2)).toBe(true);
    expect(mock.map.has(Module2)).toBe(false);
    expect(mock.oldSnapshotMap.size).toBe(2);
    expect(mock.oldSnapshotMap.has(AppModule)).toBe(true);
    expect(mock.oldSnapshotMap.has(Module1)).toBe(true);
    expect(mock.oldSnapshotMapId.size).toBe(1);
    expect(mock.oldSnapshotMapId.get('root')).toBe(AppModule);

    const expectedMeta2 = new NormalizedModuleMeta();
    expectedMeta2.id = '';
    expectedMeta2.name = 'AppModule';
    expectedMeta2.modRefId = AppModule;
    expectedMeta2.importsModules = [Module1];
    expectedMeta2.providersPerMod = [Service1];
    expectedMeta2.declaredInDir = expect.any(String);
    expectedMeta2.isExternal = undefined;
    expectedMeta2.mInitHooks = expect.any(Map);
    expectedMeta2.decoratorOptions = expect.any(Object);
    expect(mock.oldSnapshotMap.get(AppModule)).toEqual(expectedMeta2);

    mock.addImport(Module4);
    expect(mock.snapshotMap.size).toBe(4);
    expect(mock.map.size).toBe(2);
    expect(mock.snapshotMap.has(Module4)).toBe(true);
    expect(mock.map.has(Module4)).toBe(false);
    expect(mock.oldSnapshotMap.size).toBe(2);
    expect(mock.oldSnapshotMap.has(AppModule)).toBe(true);
    expect(mock.oldSnapshotMap.has(Module1)).toBe(true);
    expect(mock.oldSnapshotMapId.size).toBe(1);
    expect(mock.oldSnapshotMapId.get('root')).toBe(AppModule);

    mock.commit();
    expect(mock.snapshotMap.size).toBe(4);
    expect(mock.snapshotMap.has(AppModule)).toBe(true);
    expect(mock.snapshotMap.has(Module1)).toBe(true);
    expect(mock.snapshotMap.has(Module2)).toBe(true);
    expect(mock.snapshotMap.has(Module4)).toBe(true);
    expect(mock.oldSnapshotMapId.size).toBe(0);
    expect(mock.oldSnapshotMap.has(AppModule)).toBe(false);

    mock.reset();
    expect(mock.map.size).toBe(4);
    expect(mock.map.has(AppModule)).toBe(true);
    expect(mock.map.has(Module1)).toBe(true);
    expect(mock.map.has(Module2)).toBe(true);
    expect(mock.map.has(Module4)).toBe(true);
    expect(mock.oldSnapshotMapId.size).toBe(0);
    expect(mock.oldSnapshotMap.has(AppModule)).toBe(false);

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

    expect(mock.getNormalizedModuleMeta('root') === mock.getNormalizedModuleMeta('root')).toBe(true);
    expect(mock.getNormalizedModuleMeta('root') !== mock.getNormalizedModuleMetaFromSnapshot('root')).toBe(true);
    expect(mock.getNormalizedModuleMeta('root')).toEqual(expectedMeta3);

    mock.addImport(module3WithProviders);
    expect(mock.snapshotMap.size).toBe(5);
    expect(mock.map.size).toBe(4);
    expect(mock.oldSnapshotMap.size).toBe(4);
    expect(mock.getNormalizedModuleMetaFromSnapshot('root')).toEqual({
      ...expectedMeta3,
      importsWithParams: [module3WithProviders],
    });
    expect(mock.snapshotMap.has(module3WithProviders)).toBe(true);
    expect(mock.map.has(module3WithProviders)).toBe(false);

    mock.rollback();
    expect(mock.snapshotMap.size).toBe(4);
    expect(mock.map.size).toBe(4);
    expect(mock.getNormalizedModuleMetaFromSnapshot('root')).toEqual(expectedMeta3);
    expect(mock.getNormalizedModuleMeta('root')).toEqual(expectedMeta3);
    expect(mock.snapshotMap.has(module3WithProviders)).toBe(false);
    expect(mock.map.has(module3WithProviders)).toBe(false);
    expect(mock.oldSnapshotMap.size).toBe(0);
  });

  it('programmatically removing some modules from "imports" array of root module', () => {
    @featureModule({ providersPerMod: [Service1], exports: [Service1] })
    class Module0 {}

    @featureModule({ imports: [Module0], providersPerMod: [Service1], exports: [Service1] })
    class Module1 {}

    @featureModule({ imports: [Module0], providersPerMod: [Service1], exports: [Service1] })
    class Module2 {}

    @featureModule({ providersPerMod: [Service1], exports: [Service1] })
    class Module3 {
      static withParams(providersPerMod: Provider[]): DynamicModule<Module3> {
        return {
          module: Module3,
          providersPerMod,
        };
      }
    }

    const module3WithProviders = Module3.withParams([Service2]);

    const moduleId = 'my-mix';
    @featureModule({ providersPerMod: [Service1], exports: [Service1] })
    class Module4 {
      static withParams(providersPerMod: Provider[]): DynamicModule<Module4> {
        return {
          id: moduleId,
          module: Module4,
          providersPerMod,
        };
      }
    }

    const module4WithProviders = Module4.withParams([Service2]);

    @rootModule({
      imports: [Module1, Module2, module3WithProviders, module4WithProviders],
      providersPerMod: [Service1],
      extensionsMeta: {},
      exports: [],
    })
    class AppModule {}

    const expectedMeta1 = new NormalizedModuleMeta();
    expectedMeta1.id = '';
    expectedMeta1.name = 'AppModule';
    expectedMeta1.modRefId = AppModule;
    expectedMeta1.importsModules = [Module1, Module2];
    expectedMeta1.importsWithParams = [module3WithProviders, module4WithProviders];
    expectedMeta1.providersPerMod = [Service1];
    expectedMeta1.declaredInDir = expect.any(String);
    expectedMeta1.isExternal = undefined;
    expectedMeta1.mInitHooks = expect.any(Map);
    expectedMeta1.decoratorOptions = expect.any(Object);

    mock.scanRootModule(AppModule);
    expect(mock.snapshotMap.size).toBe(6);
    expect(mock.map.size).toBe(6);
    expect(mock.getNormalizedModuleMeta('root')).toEqual(expectedMeta1);
    expect(mock.oldSnapshotMapId.size).toBe(0);
    expect(mock.oldSnapshotMap.size).toBe(0);
    expect(mock.snapshotMap.get(Module1)?.importsModules).toEqual([Module0]);
    expect(mock.map.get(Module1)?.importsModules).toEqual([Module0]);

    expect(mock.removeImport(Module0, Module1)).toBe(true);
    expect(mock.snapshotMap.get(Module1)?.importsModules).toEqual([]);
    expect(mock.map.get(Module1)?.importsModules).toEqual([Module0]);
    expect(mock.snapshotMap.size).toBe(6);
    expect(mock.map.size).toBe(6);
    expect(mock.snapshotMap.has(Module0)).toBe(true);
    expect(mock.map.has(Module0)).toBe(true);
    expect(mock.oldSnapshotMap.size).toBe(6);
    expect(mock.oldSnapshotMap.get(Module1)?.importsModules).toEqual([Module0]);
    expect(mock.oldSnapshotMap.has(Module0)).toBe(true);
    expect(mock.oldSnapshotMapId.size).toBe(2);
    expect(mock.oldSnapshotMapId.has(moduleId)).toBe(true);
    expect(mock.oldSnapshotMapId.get('root')).toBe(AppModule);

    expect(mock.snapshotMap.get(Module2)?.importsModules).toEqual([Module0]);
    expect(mock.map.get(Module2)?.importsModules).toEqual([Module0]);
    expect(mock.removeImport(Module0, Module2)).toBe(true);
    expect(mock.snapshotMap.get(Module2)?.importsModules).toEqual([]);
    expect(mock.map.get(Module2)?.importsModules).toEqual([Module0]);
    expect(mock.snapshotMap.size).toBe(5);
    expect(mock.map.size).toBe(6);
    expect(mock.snapshotMap.has(Module0)).toBe(false);
    expect(mock.map.has(Module0)).toBe(true);
    expect(mock.oldSnapshotMap.size).toBe(6);
    expect(mock.oldSnapshotMap.get(Module2)?.importsModules).toEqual([Module0]);
    expect(mock.oldSnapshotMap.has(Module0)).toBe(true);
    expect(mock.oldSnapshotMapId.size).toBe(2);
    expect(mock.oldSnapshotMapId.has(moduleId)).toBe(true);
    expect(mock.oldSnapshotMapId.get('root')).toBe(AppModule);

    mock.commit();
    expect(mock.snapshotMap.size).toBe(5);
    expect(mock.map.size).toBe(6);
    expect(mock.oldSnapshotMapId.size).toBe(0);
    expect(mock.oldSnapshotMap.size).toBe(0);

    mock.reset();
    expect(mock.snapshotMap.size).toBe(5);
    expect(mock.map.size).toBe(5);
    expect(mock.oldSnapshotMapId.size).toBe(0);
    expect(mock.oldSnapshotMap.size).toBe(0);

    expect(mock.getNormalizedModuleMeta('root')?.importsModules).toEqual([Module1, Module2]);
    expect(mock.removeImport(Module2)).toBe(true);
    expect(mock.getNormalizedModuleMetaFromSnapshot('root')?.importsModules).toEqual([Module1]);
    expect(mock.getNormalizedModuleMeta('root')?.importsModules).toEqual([Module1, Module2]);
    expect(mock.snapshotMap.size).toBe(4);
    expect(mock.map.size).toBe(5);
    expect(mock.oldSnapshotMap.get(AppModule)?.importsModules).toEqual([Module1, Module2]);
    expect(mock.oldSnapshotMapId.size).toBe(2);
    expect(mock.oldSnapshotMap.size).toBe(5);

    expect(mock.removeImport(Module2)).toBe(false);
    expect(mock.snapshotMap.size).toBe(4);
    expect(mock.map.size).toBe(5);
    expect(mock.getNormalizedModuleMetaFromSnapshot('root')?.importsModules).toEqual([Module1]);
    expect(mock.getNormalizedModuleMeta('root')?.importsModules).toEqual([Module1, Module2]);

    const expectedMeta2 = new NormalizedModuleMeta();
    expectedMeta2.id = '';
    expectedMeta2.name = 'AppModule';
    expectedMeta2.modRefId = AppModule;
    expectedMeta2.importsModules = [Module1];
    expectedMeta2.importsWithParams = [module3WithProviders, module4WithProviders];
    expectedMeta2.providersPerMod = [Service1];
    expectedMeta2.declaredInDir = expect.any(String);
    expectedMeta2.isExternal = undefined;
    expectedMeta2.mInitHooks = expect.any(Map);
    expectedMeta2.decoratorOptions = expect.any(Object);

    expect(mock.getNormalizedModuleMetaFromSnapshot('root')).toEqual(expectedMeta2);
    expect(mock.oldSnapshotMapId.size).toBe(2);
    expect(mock.oldSnapshotMap.size).toBe(5);

    expect(mock.getNormalizedModuleMetaFromSnapshot('root')?.importsWithParams).toEqual([
      module3WithProviders,
      module4WithProviders,
    ]);
    expect(mock.getNormalizedModuleMeta('root')?.importsWithParams).toEqual([
      module3WithProviders,
      module4WithProviders,
    ]);
    expect(mock.removeImport(module3WithProviders)).toBe(true);
    expect(mock.getNormalizedModuleMetaFromSnapshot('root')?.importsWithParams).toEqual([module4WithProviders]);
    expect(mock.getNormalizedModuleMeta('root')?.importsWithParams).toEqual([
      module3WithProviders,
      module4WithProviders,
    ]);
    expect(mock.snapshotMap.size).toBe(3);
    expect(mock.map.size).toBe(5);

    const expectedMeta3 = new NormalizedModuleMeta();
    expectedMeta3.id = '';
    expectedMeta3.name = 'AppModule';
    expectedMeta3.modRefId = AppModule;
    expectedMeta3.importsModules = [Module1];
    expectedMeta3.importsWithParams = [module4WithProviders];
    expectedMeta3.providersPerMod = [Service1];
    expectedMeta3.declaredInDir = expect.any(String);
    expectedMeta3.isExternal = undefined;
    expectedMeta3.mInitHooks = expect.any(Map);
    expectedMeta3.decoratorOptions = expect.any(Object);

    expect(mock.getNormalizedModuleMetaFromSnapshot('root')).toEqual(expectedMeta3);
    expect(mock.oldSnapshotMapId.size).toBe(2);
    expect(mock.oldSnapshotMap.size).toBe(5);
    expect(mock.oldSnapshotMap.get(AppModule)?.importsWithParams).toEqual([module3WithProviders, module4WithProviders]);

    const expectedMeta4 = new NormalizedModuleMeta();
    expectedMeta4.id = '';
    expectedMeta4.name = 'AppModule';
    expectedMeta4.modRefId = AppModule;
    expectedMeta4.importsModules = [Module1];
    expectedMeta4.providersPerMod = [Service1];
    expectedMeta4.declaredInDir = expect.any(String);
    expectedMeta4.isExternal = undefined;
    expectedMeta4.mInitHooks = expect.any(Map);
    expectedMeta4.decoratorOptions = expect.any(Object);

    expect(mock.removeImport(moduleId)).toBe(true);
    expect(mock.snapshotMap.size).toBe(2);
    expect(mock.map.size).toBe(5);
    expect(mock.getNormalizedModuleMetaFromSnapshot('root')).toEqual(expectedMeta4);
    expect(mock.oldSnapshotMapId.size).toBe(2);
    expect(mock.oldSnapshotMap.size).toBe(5);

    mock.rollback();
    expect(mock.snapshotMapId.size).toBe(2);
    expect(mock.mapId.size).toBe(2);
    expect(mock.snapshotMap.size).toBe(5);
    expect(mock.map.size).toBe(5);
    expect(mock.getNormalizedModuleMeta('root')).toEqual(expectedMeta1);
    expect(mock.oldSnapshotMapId.size).toBe(0);
    expect(mock.oldSnapshotMap.size).toBe(0);
  });

  it('root module with imported some extension', () => {
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

  it('root module with exported appy some extension', () => {
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

  it('split multi providers and common providers', () => {
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

  it('import hostModules; allInitHooks should only contain init hooks imported into the current module', () => {
    class Service1 {}
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

    mod1.importsModules.includes(HostModule1);
    mod2.importsModules.includes(HostModule2);
    mod3.importsModules.includes(HostModule3);
    mod4.importsModules.includes(HostModule4);

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

  it('Module1 does not have an annotation with initSome, but imported in AppModule with this decorator', () => {
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

    class InitHooks1 extends InitHooks<RootDecoratorOptions> {
      override normalize({ modRefId }: NormalizedModuleMeta): InitMeta {
        if (isDynamicModule(modRefId)) {
          const params = modRefId.initParams?.get(initSome);
          return { path: params?.path } as InitMeta;
        }

        return {} as InitMeta;
      }
    }

    @featureModule({ providersPerApp: [{ token: 'token1', useValue: 'value1' }] })
    class Module1 {}

    const moduleWithParams: DynamicModule = { module: Module1 };

    @initSome({ one: 'some-here', imports: [{ dynamicModule: moduleWithParams, path: 'some-prefix' }] })
    @rootModule()
    class AppModule {}

    mock.scanRootModule(AppModule);
    const mod1 = mock.getNormalizedModuleMeta(moduleWithParams)!;
    expect(mod1.initMeta.get(initSome)).toEqual({ path: 'some-prefix' });
  });

  it('get initParams for three different modules with params', () => {
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
    class InitHooks1 extends InitHooks<DecoratorOptions1> {}
    class InitHooks2 extends InitHooks<DecoratorOptions2> {}
    const initSome1: InitDecorator<DecoratorOptions1, {}, InitMeta1> = Reflector.makeClassDecorator(
      (d) => new InitHooks1(d),
    );
    const initSome2: InitDecorator<DecoratorOptions2, {}, InitMeta2> = Reflector.makeClassDecorator(
      (d) => new InitHooks2(d),
    );

    @featureModule({ providersPerApp: [{ token: 'token1', useValue: 'value1' }] })
    class Module1 {}

    @featureModule({ providersPerApp: [{ token: 'token2', useValue: 'value2' }] })
    class Module2 {}

    @featureModule({ providersPerApp: [{ token: 'token3', useValue: 'value3' }] })
    class Module3 {}

    const moduleWithParams1: DynamicModule = { module: Module1 };
    const moduleWithParams2: DynamicModule = { module: Module2 };
    const moduleWithParams3: DynamicModule = { module: Module3 };

    @initSome1({
      imports: [
        { dynamicModule: moduleWithParams1, one: 'initSome1-1' },
        { dynamicModule: moduleWithParams3, one: 'initSome1-3' },
      ],
    })
    @initSome2({
      imports: [
        { dynamicModule: moduleWithParams2, three: 'initSome2-2' },
        { dynamicModule: moduleWithParams3, three: 'initSome2-3' },
      ],
    })
    @rootModule()
    class AppModule {}

    mock.scanRootModule(AppModule);

    function getParams(moduleWithParams: DynamicModule) {
      return [...(moduleWithParams.initParams?.values() || [])];
    }
    expect(getParams(moduleWithParams1)).toEqual([{ one: 'initSome1-1' }]);
    expect(getParams(moduleWithParams2)).toEqual([{ three: 'initSome2-2' }]);
    expect(getParams(moduleWithParams3)).toEqual([{ three: 'initSome2-3' }, { one: 'initSome1-3' }]);
  });
});
