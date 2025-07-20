import { jest } from '@jest/globals';

import { injectable, forwardRef, Provider, isMultiProvider, makeClassDecorator } from '#di';
import { featureModule } from '#decorators/feature-module.js';
import { rootModule } from '#decorators/root-module.js';
import { Extension } from '#extension/extension-types.js';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { CallsiteUtils } from '#utils/callsites.js';
import { AllInitHooks, ModuleManager } from './module-manager.js';
import { ModuleType, AnyObj, ModRefId } from '#types/mix.js';
import { ModuleWithParams } from '#types/module-metadata.js';
import { AddDecorator, NormalizedMeta } from '#types/normalized-meta.js';
import { clearDebugClassNames } from '#utils/get-debug-class-name.js';
import { InitHooksAndRawMeta } from '#decorators/init-hooks-and-metadata.js';

describe('ModuleManager', () => {
  console.log = jest.fn();
  type ModuleId = string | ModuleType | ModuleWithParams;
  @injectable()
  class Service1 {}
  @injectable()
  class Service2 {}
  @injectable()
  class Service3 {}

  class MockModuleManager extends ModuleManager {
    declare map: Map<ModuleType | ModuleWithParams, NormalizedMeta>;
    declare mapId: Map<string, ModuleType | ModuleWithParams>;
    declare oldMap: Map<ModuleType | ModuleWithParams, NormalizedMeta>;
    declare oldMapId: Map<string, ModuleType | ModuleWithParams>;

    override getOriginMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
      moduleId: ModuleId,
      throwErrIfNotFound?: boolean,
    ): NormalizedMeta | undefined;

    override getOriginMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
      moduleId: ModuleId,
      throwErrIfNotFound: true,
    ): NormalizedMeta;

    override getOriginMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
      moduleId: ModuleId,
      throwErrOnNotFound?: boolean,
    ) {
      return super.getOriginMetadata<T, A>(moduleId, throwErrOnNotFound);
    }

    override normalizeMetadata(modRefId: ModRefId, allInitHooks: AllInitHooks): NormalizedMeta {
      return super.normalizeMetadata(modRefId, allInitHooks);
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

  it('root module should be scanned first among all modules (because of moduleNormalizer.checkAndMarkExternalModule())', () => {
    class Service1 {}
    class Service2 {}

    @featureModule({
      providersPerApp: [Service1],
      imports: [Module1],
    })
    class Module1 {}

    @featureModule({
      providersPerApp: [Service2],
      imports: [Module1],
    })
    class Module2 {}

    @rootModule({
      imports: [Module2],
    })
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
    expect(mock.getMetadata(Module1)?.importsModules).toEqual([Module3]);
    expect(mock.getMetadata(Module3)?.importsModules).toEqual([Module2]);
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

    const module3WithProviders: ModuleWithParams = { module: Module3, providersPerMod: [Service2] };

    const expectedMeta1 = new NormalizedMeta();
    expectedMeta1.id = '';
    expectedMeta1.name = 'AppModule';
    expectedMeta1.modRefId = AppModule;
    expectedMeta1.providersPerMod = [Service1];
    expectedMeta1.decorator = rootModule;
    expectedMeta1.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta1.isExternal = false;
    expectedMeta1.mInitHooksAndRawMeta = expect.any(Map);

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(1);
    expect(mock.getMetadata('root')).not.toBe(mock.getMetadata('root'));
    expect(mock.getOriginMetadata('root')).toBe(mock.getOriginMetadata('root'));
    expect(mock.getMetadata('root')).toEqual(expectedMeta1);

    expect(mock.addImport(Module1)).toBe(true);
    expect(mock.map.size).toBe(2);
    expect(mock.map.has(Module1)).toBe(true);
    expect(mock.oldMapId.size).toBe(1);
    expect(mock.oldMapId.get('root')).toBe(AppModule);
    expect(mock.oldMap.size).toBe(1);
    expect(mock.oldMap.get(AppModule)).toEqual(expectedMeta1);

    expect(mock.addImport(Module1)).toBe(false);
    expect(mock.oldMap.size).toBe(1);
    expect(mock.oldMap.has(AppModule)).toBe(true);
    expect(mock.oldMap.get(AppModule)).toEqual(expectedMeta1);
    expect(mock.map.size).toBe(2);
    expect(mock.map.has(Module1)).toBe(true);

    mock.commit();
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.size).toBe(0);
    expect(mock.map.size).toBe(2);
    expect(mock.map.has(AppModule)).toBe(true);
    expect(mock.map.has(Module1)).toBe(true);

    expect(() => mock.addImport(Module2, 'fakeId')).toThrow(/Failed adding Module2 to imports/);
    expect(mock.map.size).toBe(2);
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.size).toBe(0);

    const expectedMeta2 = new NormalizedMeta();
    expectedMeta2.id = '';
    expectedMeta2.name = 'AppModule';
    expectedMeta2.modRefId = AppModule;
    expectedMeta2.importsModules = [Module1];
    expectedMeta2.providersPerMod = [Service1];
    expectedMeta2.decorator = rootModule;
    expectedMeta2.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta2.isExternal = false;
    expectedMeta2.mInitHooksAndRawMeta = expect.any(Map);

    mock.addImport(Module2);
    expect(mock.map.size).toBe(3);
    expect(mock.map.has(Module2)).toBe(true);
    expect(mock.oldMap.size).toBe(2);
    expect(mock.oldMap.has(AppModule)).toBe(true);
    expect(mock.oldMap.has(Module1)).toBe(true);
    expect(mock.oldMapId.size).toBe(1);
    expect(mock.oldMapId.get('root')).toBe(AppModule);
    expect(mock.oldMap.get(AppModule)).toEqual(expectedMeta2);

    mock.addImport(Module4);
    expect(mock.map.size).toBe(4);
    expect(mock.map.has(Module4)).toBe(true);
    expect(mock.oldMap.size).toBe(2);
    expect(mock.oldMap.has(AppModule)).toBe(true);
    expect(mock.oldMap.has(Module1)).toBe(true);
    expect(mock.oldMapId.size).toBe(1);
    expect(mock.oldMapId.get('root')).toBe(AppModule);

    mock.commit();
    expect(mock.map.size).toBe(4);
    expect(mock.map.has(AppModule)).toBe(true);
    expect(mock.map.has(Module1)).toBe(true);
    expect(mock.map.has(Module2)).toBe(true);
    expect(mock.map.has(Module4)).toBe(true);
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.has(AppModule)).toBe(false);

    const expectedMeta3 = new NormalizedMeta();
    expectedMeta3.id = '';
    expectedMeta3.name = 'AppModule';
    expectedMeta3.modRefId = AppModule;
    expectedMeta3.importsModules = [Module1, Module2, Module4];
    expectedMeta3.providersPerMod = [Service1];
    expectedMeta3.decorator = rootModule;
    expectedMeta3.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta3.isExternal = false;
    expectedMeta3.mInitHooksAndRawMeta = expect.any(Map);

    expect(mock.getMetadata('root') === mock.getMetadata('root')).toBe(false);
    expect(mock.getMetadata('root')).toEqual(expectedMeta3);

    mock.addImport(module3WithProviders);
    expect(mock.map.size).toBe(5);
    expect(mock.oldMap.size).toBe(4);
    expect(mock.getMetadata('root')).toEqual({ ...expectedMeta3, importsWithParams: [module3WithProviders] });
    expect(mock.map.has(module3WithProviders)).toBe(true);

    mock.rollback();
    expect(mock.map.size).toBe(4);
    expect(mock.getMetadata('root')).toEqual(expectedMeta3);
    expect(mock.map.has(module3WithProviders)).toBe(false);
    expect(mock.oldMap.size).toBe(0);
  });

  it('programmatically removing some modules from "imports" array of root module', () => {
    @featureModule({ providersPerMod: [Service1], exports: [Service1] })
    class Module0 {}

    @featureModule({ providersPerMod: [Service1], exports: [Service1], imports: [Module0] })
    class Module1 {}

    @featureModule({ providersPerMod: [Service1], exports: [Service1], imports: [Module0] })
    class Module2 {}

    @featureModule({ providersPerMod: [Service1], exports: [Service1] })
    class Module3 {
      static withParams(providersPerMod: Provider[]): ModuleWithParams<Module3> {
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
      static withParams(providersPerMod: Provider[]): ModuleWithParams<Module4> {
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

    const expectedMeta1 = new NormalizedMeta();
    expectedMeta1.id = '';
    expectedMeta1.name = 'AppModule';
    expectedMeta1.modRefId = AppModule;
    expectedMeta1.importsModules = [Module1, Module2];
    expectedMeta1.importsWithParams = [module3WithProviders, module4WithProviders];
    expectedMeta1.providersPerMod = [Service1];
    expectedMeta1.decorator = rootModule;
    expectedMeta1.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta1.isExternal = false;
    expectedMeta1.mInitHooksAndRawMeta = expect.any(Map);

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(6);
    expect(mock.getMetadata('root')).toEqual(expectedMeta1);
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.size).toBe(0);
    expect(mock.map.get(Module1)).toMatchObject({ importsModules: [Module0] });

    expect(mock.removeImport(Module0, Module1)).toBe(true);
    expect(mock.map.get(Module1)).toMatchObject({ importsModules: [] });
    expect(mock.map.size).toBe(6);
    expect(mock.map.has(Module0)).toBe(true);
    expect(mock.oldMap.size).toBe(6);
    expect(mock.oldMap.get(Module1)).toMatchObject({ importsModules: [Module0] });
    expect(mock.oldMap.has(Module0)).toBe(true);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMapId.has(moduleId)).toBe(true);
    expect(mock.oldMapId.get('root')).toBe(AppModule);

    expect(mock.map.get(Module2)).toMatchObject({ importsModules: [Module0] });
    expect(mock.removeImport(Module0, Module2)).toBe(true);
    expect(mock.map.get(Module2)).toMatchObject({ importsModules: [] });
    expect(mock.map.size).toBe(5);
    expect(mock.map.has(Module0)).toBe(false);
    expect(mock.oldMap.size).toBe(6);
    expect(mock.oldMap.get(Module2)).toMatchObject({ importsModules: [Module0] });
    expect(mock.oldMap.has(Module0)).toBe(true);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMapId.has(moduleId)).toBe(true);
    expect(mock.oldMapId.get('root')).toBe(AppModule);

    mock.commit();
    expect(mock.map.size).toBe(5);
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.size).toBe(0);

    const expectedMeta2 = new NormalizedMeta();
    expectedMeta2.id = '';
    expectedMeta2.name = 'AppModule';
    expectedMeta2.modRefId = AppModule;
    expectedMeta2.importsModules = [Module1];
    expectedMeta2.importsWithParams = [module3WithProviders, module4WithProviders];
    expectedMeta2.providersPerMod = [Service1];
    expectedMeta2.decorator = rootModule;
    expectedMeta2.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta2.isExternal = false;
    expectedMeta2.mInitHooksAndRawMeta = expect.any(Map);

    expect(mock.getMetadata('root')).toMatchObject({ importsModules: [Module1, Module2] });
    expect(mock.removeImport(Module2)).toBe(true);
    expect(mock.getMetadata('root')).toMatchObject({ importsModules: [Module1] });
    expect(mock.map.size).toBe(4);
    expect(mock.oldMap.get(AppModule)).toMatchObject({ importsModules: [Module1, Module2] });
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(5);

    expect(mock.removeImport(Module2)).toBe(false);
    expect(mock.map.size).toBe(4);
    expect(mock.getMetadata('root')).toMatchObject({ importsModules: [Module1] });
    expect(mock.getMetadata('root')).toEqual(expectedMeta2);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(5);

    const expectedMeta3 = new NormalizedMeta();
    expectedMeta3.id = '';
    expectedMeta3.name = 'AppModule';
    expectedMeta3.modRefId = AppModule;
    expectedMeta3.importsModules = [Module1];
    expectedMeta3.importsWithParams = [module4WithProviders];
    expectedMeta3.providersPerMod = [Service1];
    expectedMeta3.decorator = rootModule;
    expectedMeta3.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta3.isExternal = false;
    expectedMeta3.mInitHooksAndRawMeta = expect.any(Map);

    expect(mock.getMetadata('root')).toMatchObject({
      importsWithParams: [module3WithProviders, module4WithProviders],
    });
    expect(mock.removeImport(module3WithProviders)).toBe(true);
    expect(mock.getMetadata('root')).toMatchObject({ importsWithParams: [module4WithProviders] });
    expect(mock.map.size).toBe(3);
    expect(mock.getMetadata('root')).toEqual(expectedMeta3);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(5);
    expect(mock.oldMap.get(AppModule)).toMatchObject({
      importsWithParams: [module3WithProviders, module4WithProviders],
    });

    const expectedMeta4 = new NormalizedMeta();
    expectedMeta4.id = '';
    expectedMeta4.name = 'AppModule';
    expectedMeta4.modRefId = AppModule;
    expectedMeta4.importsModules = [Module1];
    expectedMeta4.providersPerMod = [Service1];
    expectedMeta4.decorator = rootModule;
    expectedMeta4.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta4.isExternal = false;
    expectedMeta4.mInitHooksAndRawMeta = expect.any(Map);

    expect(mock.removeImport(moduleId)).toBe(true);
    expect(mock.map.size).toBe(2);
    expect(mock.getMetadata('root')).toEqual(expectedMeta4);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(5);

    mock.rollback();
    expect(mock.mapId.size).toBe(2);
    expect(mock.map.size).toBe(5);
    expect(mock.getMetadata('root')).toEqual(expectedMeta1);
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.size).toBe(0);
  });

  it('root module with imported some extension', () => {
    @injectable()
    class Extension1 implements Extension<void> {
      async stage1() {}
    }

    const extensionsProviders: Provider[] = [Extension1];

    @featureModule({
      extensions: [{ extension: Extension1 as any, export: true }],
    })
    class Module1 {}

    @rootModule({
      imports: [Module1],
    })
    class Module3 {}

    const expectedMeta3 = new NormalizedMeta();
    expectedMeta3.id = '';
    expectedMeta3.name = 'Module3';
    expectedMeta3.modRefId = Module3;
    expectedMeta3.importsModules = [Module1];
    expectedMeta3.decorator = rootModule;
    expectedMeta3.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta3.isExternal = false;
    expectedMeta3.mInitHooksAndRawMeta = expect.any(Map);
    delete (expectedMeta3 as any).aExtensionConfig;
    delete (expectedMeta3 as any).aExportedExtensionConfig;

    const expectedMeta1 = new NormalizedMeta();
    expectedMeta1.id = '';
    expectedMeta1.name = 'Module1';
    expectedMeta1.modRefId = Module1;
    expectedMeta1.extensionsProviders = extensionsProviders;
    expectedMeta1.exportedExtensionsProviders = extensionsProviders;
    expectedMeta1.decorator = featureModule;
    expectedMeta1.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta1.isExternal = false;
    delete (expectedMeta1 as any).aExtensionConfig;
    delete (expectedMeta1 as any).aExportedExtensionConfig;
    expectedMeta1.mInitHooksAndRawMeta = expect.any(Map);

    mock.scanRootModule(Module3);
    expect(mock.getMetadata('root')).toMatchObject(expectedMeta3);
    expect(mock.getMetadata(Module1)).toMatchObject(expectedMeta1);
  });

  it('root module with exported globaly some extension', () => {
    @injectable()
    class Extension1 implements Extension<void> {
      async stage1() {}
    }

    const extensionsProviders: Provider[] = [Extension1];

    @featureModule({
      extensions: [{ extension: Extension1 as any, export: true }],
    })
    class Module1 {}

    @rootModule({
      imports: [Module1],
      exports: [Module1],
    })
    class Module3 {}

    const expectedMeta3 = new NormalizedMeta();
    expectedMeta3.id = '';
    expectedMeta3.name = 'Module3';
    expectedMeta3.modRefId = Module3;
    expectedMeta3.importsModules = [Module1];
    expectedMeta3.exportsModules = [Module1];
    expectedMeta3.decorator = rootModule;
    expectedMeta3.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta3.isExternal = false;
    expectedMeta3.mInitHooksAndRawMeta = expect.any(Map);
    delete (expectedMeta3 as any).aExtensionConfig;
    delete (expectedMeta3 as any).aExportedExtensionConfig;

    const expectedMeta1 = new NormalizedMeta();
    expectedMeta1.id = '';
    expectedMeta1.name = 'Module1';
    expectedMeta1.modRefId = Module1;
    expectedMeta1.extensionsProviders = extensionsProviders;
    expectedMeta1.exportedExtensionsProviders = extensionsProviders;
    expectedMeta1.decorator = featureModule;
    expectedMeta1.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta1.isExternal = false;
    expectedMeta1.mInitHooksAndRawMeta = expect.any(Map);
    delete (expectedMeta1 as any).aExtensionConfig;
    delete (expectedMeta1 as any).aExportedExtensionConfig;

    mock.scanRootModule(Module3);
    expect(mock.getMetadata('root')).toMatchObject(expectedMeta3);
    expect(mock.getMetadata(Module1)).toMatchObject(expectedMeta1);
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

    const expectedMeta3 = new NormalizedMeta();
    expectedMeta3.id = '';
    expectedMeta3.name = 'Module3';
    expectedMeta3.modRefId = Module3;
    expectedMeta3.importsModules = [Module1];
    expectedMeta3.decorator = rootModule;
    expectedMeta3.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta3.isExternal = false;
    expectedMeta3.mInitHooksAndRawMeta = expect.any(Map);

    const expectedMeta1 = new NormalizedMeta();
    expectedMeta1.id = '';
    expectedMeta1.name = 'Module1';
    expectedMeta1.modRefId = Module1;
    expectedMeta1.providersPerMod = providersPerMod;
    expectedMeta1.exportedProvidersPerMod = [Service3];
    expectedMeta1.exportedMultiProvidersPerMod = providersPerMod.filter(isMultiProvider);
    expectedMeta1.decorator = featureModule;
    expectedMeta1.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta1.isExternal = false;
    expectedMeta1.mInitHooksAndRawMeta = expect.any(Map);

    mock.scanRootModule(Module3);
    expect(mock.getMetadata('root')).toEqual(expectedMeta3);
    expect(mock.getMetadata(Module1)).toEqual(expectedMeta1);
  });

  it('allInitHooks should only contain init hooks imported into the current module', () => {
    class Service1 {}
    @featureModule()
    class HostModule1 {}
    @featureModule()
    class HostModule2 {}
    @featureModule()
    class HostModule3 {}
    @featureModule()
    class HostModule4 {}

    class InitHooksAndRawMeta1 extends InitHooksAndRawMeta<any> {
      override hostModule = HostModule1;
      override getHostInitHooks() {
        return new InitHooksAndRawMeta1({ one: 1 });
      }
    }

    class InitHooksAndRawMeta2 extends InitHooksAndRawMeta<any> {
      override hostModule = HostModule2;
      override getHostInitHooks() {
        return new InitHooksAndRawMeta2({ two: 2 });
      }
    }

    class InitHooksAndRawMeta3 extends InitHooksAndRawMeta<any> {
      override hostModule = HostModule3;
      override getHostInitHooks() {
        return new InitHooksAndRawMeta3({ three: 3 });
      }
    }

    class InitHooksAndRawMeta4 extends InitHooksAndRawMeta<any> {
      override hostModule = HostModule4;
      override getHostInitHooks() {
        return new InitHooksAndRawMeta4({ four: 4 });
      }
    }

    const initSome1: AddDecorator<any, any> = makeClassDecorator((data) => new InitHooksAndRawMeta1(data));
    const initSome2: AddDecorator<any, any> = makeClassDecorator((data) => new InitHooksAndRawMeta2(data));
    const initSome3: AddDecorator<any, any> = makeClassDecorator((data) => new InitHooksAndRawMeta3(data));
    const initSome4: AddDecorator<any, any> = makeClassDecorator((data) => new InitHooksAndRawMeta4(data));

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
    const mod1 = mock.getMetadata(Module1, true);
    const mod2 = mock.getMetadata(Module2, true);
    const mod3 = mock.getMetadata(Module3, true);
    const mod4 = mock.getMetadata(Module4, true);

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
});
