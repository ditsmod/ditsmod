import { beforeEach, describe, expect, it, vi } from 'vitest';

import { controller } from '#decorators/controller.js';
import { featureModule } from '#decorators/module.js';
import { rootModule } from '#decorators/root-module.js';
import { InjectionToken, forwardRef, injectable, isMultiProvider } from '#di';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { AnyObj, CanActivate, ModuleType } from '#types/mix.js';
import { Provider } from '#di/types-and-models.js';
import { ModuleWithParams, AppendsWithParams } from '#types/module-metadata.js';
import { Extension } from '#extension/extension-types.js';
import { NormalizedModuleMetadata } from '#types/normalized-module-metadata.js';
import { CallsiteUtils } from '#utils/callsites.js';
import { ModuleManager } from '#init/module-manager.js';
import { RequestContext } from '#services/request-context.js';
import { clearDebugClassNames } from '#utils/get-debug-class-name.js';

describe('ModuleManager', () => {
  console.log = vi.fn();
  type ModuleId = string | ModuleType | ModuleWithParams;

  class MockModuleManager extends ModuleManager {
    override map = new Map<ModuleType | ModuleWithParams, NormalizedModuleMetadata>();
    override mapId = new Map<string, ModuleType | ModuleWithParams>();
    override oldMap = new Map<ModuleType | ModuleWithParams, NormalizedModuleMetadata>();
    override oldMapId = new Map<string, ModuleType | ModuleWithParams>();
    override getRawMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
      moduleId: ModuleId,
      throwErrIfNotFound?: boolean,
    ): NormalizedModuleMetadata<T, A> | undefined;
    override getRawMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
      moduleId: ModuleId,
      throwErrIfNotFound: true,
    ): NormalizedModuleMetadata<T, A>;
    override getRawMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
      moduleId: ModuleId,
      throwErrOnNotFound?: boolean,
    ) {
      return super.getRawMetadata<T, A>(moduleId, throwErrOnNotFound);
    }
  }

  let mock: MockModuleManager;

  beforeEach(() => {
    clearDebugClassNames();
    const systemLogMediator = new SystemLogMediator({ moduleName: 'fakeName', path: '' });
    mock = new MockModuleManager(systemLogMediator);
  });

  describe('quickCheckMetadata()', () => {
    it('should throw an error, when no export and no controllers', () => {
      class Provider1 {}
      class Provider2 {}

      @featureModule({
        providersPerMod: [Provider1, Provider2],
      })
      class Module1 {}

      expect(() => mock.scanModule(Module1)).toThrow(/Normalization of Module1 failed: this module should have/);
    });

    it('should works, when no export and no controllers, but with appends for prefix (for version)', () => {
      class Provider1 {}
      class Provider2 {}

      @featureModule({
        providersPerMod: [Provider1, Provider2],
        exports: [Provider1],
      })
      class Version1Module {}

      @featureModule({ appends: [{ path: 'v1', module: Version1Module }] })
      class Module2 {}

      expect(() => mock.scanModule(Module2)).not.toThrow();
    });

    it('should works with extension only', () => {
      class Ext implements Extension {
        async stage1() {}
      }
      const GROUP1_EXTENSIONS = new InjectionToken('GROUP1_EXTENSIONS');

      @featureModule({
        extensions: [{ extension: Ext, group: GROUP1_EXTENSIONS, export: true }],
      })
      class Module1 {}

      expect(() => mock.scanModule(Module1)).not.toThrow();
    });

    it('should throw an error, during imports module without export and without controllers', () => {
      class Provider1 {}
      class Provider2 {}
      @controller()
      class Controller1 {}

      @featureModule({
        providersPerMod: [Provider1, Provider2],
        controllers: [Controller1],
      })
      class Module1 {}

      @featureModule({ imports: [Module1] })
      class Module2 {}

      expect(() => mock.scanModule(Module2)).toThrow('Normalization of Module2 failed: this module should have');
    });

    it('should not throw an error, when exports some provider', () => {
      class Provider1 {}
      class Provider2 {}

      @featureModule({
        exports: [Provider1],
        providersPerMod: [Provider1, Provider2],
      })
      class Module1 {}

      expect(() => mock.scanModule(Module1)).not.toThrow();
    });

    it('should not throw an error, when declare some controller', () => {
      @controller()
      class Provider1 {}
      class Provider2 {}

      @featureModule({
        controllers: [Provider1],
        providersPerMod: [Provider1, Provider2],
      })
      class Module1 {}

      expect(() => mock.scanModule(Module1)).not.toThrow();
    });
  });

  it('empty root module', () => {
    @rootModule({})
    class AppModule {}

    const expectedMeta = new NormalizedModuleMetadata();
    expectedMeta.id = '';
    expectedMeta.name = 'AppModule';
    expectedMeta.modRefId = AppModule;
    expectedMeta.decorator = rootModule;
    expectedMeta.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta.isExternal = false;
    expectedMeta.rawMeta = expect.any(Object);

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(1);
    expect(mock.getMetadata('root')).toEqual(expectedMeta);
  });

  it('circular imports modules with forwardRef()', () => {
    @controller()
    class Controller1 {}

    @injectable()
    class Provider1 {}

    @featureModule({ providersPerApp: [Provider1], imports: [forwardRef(() => Module3)] })
    class Module1 {}

    @featureModule({ imports: [Module1], controllers: [Controller1] })
    class Module2 {}

    @featureModule({ imports: [Module2], controllers: [Controller1] })
    class Module3 {}

    @featureModule({ imports: [Module3], controllers: [Controller1] })
    class Module4 {}

    @rootModule({
      imports: [Module4],
    })
    class AppModule {}

    expect(() => mock.scanRootModule(AppModule)).not.toThrow();
  });

  it('non properly exports from root module', () => {
    class Provider1 {}

    @rootModule({
      exports: [Provider1],
    })
    class AppModule {}

    expect(() => mock.scanRootModule(AppModule)).toThrow(/if "Provider1" is a provider, it must be included in/);
  });

  it('root module with some metadata', () => {
    @injectable()
    class Provider1 {}

    @rootModule({
      imports: [],
      providersPerRou: [],
      providersPerReq: [Provider1],
      extensionsMeta: {},
      controllers: [],
      exports: [],
    })
    class AppModule {}

    const expectedMeta = new NormalizedModuleMetadata();
    expectedMeta.id = '';
    expectedMeta.name = 'AppModule';
    expectedMeta.modRefId = AppModule;
    expectedMeta.providersPerReq = [Provider1];
    expectedMeta.decorator = rootModule;
    expectedMeta.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta.isExternal = false;
    expectedMeta.rawMeta = expect.any(Object);

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(1);
    expect(mock.getMetadata('root')).toEqual(expectedMeta);
  });

  it('root module without @rootModule decorator', () => {
    @featureModule()
    class Module1 {}

    expect(() => mock.scanRootModule(Module1)).toThrow('"Module1" does not have the "@rootModule()" decorator');
  });

  it('root module imported module without @featureModule decorator', () => {
    class Module1 {}

    @rootModule({ imports: [Module1] })
    class Module2 {}

    expect(() => mock.scanRootModule(Module2)).toThrow('"Module1" does not have the "@featureModule()" decorator');
  });

  it('module reexported another module without @featureModule decorator', () => {
    class Module1 {}

    @featureModule({ imports: [Module1], exports: [Module1] })
    class Module2 {}

    expect(() => mock.scanModule(Module2)).toThrow(/if "Module1" is a provider, it must be included in/);
  });

  it('properly reexport module', () => {
    @controller()
    class Controller1 {}

    @featureModule({ controllers: [Controller1] })
    class Module1 {}

    @featureModule({
      imports: [Module1],
      controllers: [Controller1],
      exports: [Module1],
    })
    class Module2 {}

    expect(() => mock.scanModule(Module2)).not.toThrow();
  });

  it('properly reexport module with params, case 1', () => {
    @controller()
    class Controller1 {}

    @featureModule({ controllers: [Controller1] })
    class Module1 {
      static withParams(): ModuleWithParams<Module1> {
        return {
          module: this,
        };
      }
    }

    const moduleWithParams = Module1.withParams();

    @featureModule({
      imports: [moduleWithParams],
      controllers: [Controller1],
      exports: [moduleWithParams],
    })
    class Module2 {}

    expect(() => mock.scanModule(Module2)).not.toThrow();
  });

  it('exports multi providers', () => {
    class Multi {}

    const exportedMultiProvidersPerMod = [{ token: Multi, useClass: Multi, multi: true }];

    @featureModule()
    class Module1 {
      static withParams(): ModuleWithParams<Module1> {
        return {
          module: this,
          providersPerMod: [{ token: Multi, useClass: Multi, multi: true }],
          exports: [Multi],
        };
      }
    }

    const moduleWithParams = Module1.withParams();

    const meta = mock.scanModule(moduleWithParams);
    expect(meta.exportedProvidersPerMod.length).toBe(0);
    expect(meta.exportedMultiProvidersPerMod).toEqual(exportedMultiProvidersPerMod);
  });

  it('not properly reexport module with params, case 2', () => {
    @controller()
    class Controller1 {}

    @featureModule({ controllers: [Controller1] })
    class Module1 {
      static withParams(): ModuleWithParams<Module1> {
        return {
          module: this,
        };
      }
    }

    const moduleWithParams = Module1.withParams();

    @featureModule({
      imports: [moduleWithParams],
      controllers: [Controller1],
      exports: [Module1],
    })
    class Module2 {}

    expect(() => mock.scanModule(Module2)).not.toThrow();
  });

  it('exports module without imports it', () => {
    @controller()
    class Controller1 {}

    @featureModule({ controllers: [Controller1] })
    class Module1 {}

    @featureModule({ controllers: [Controller1], exports: [Module1] })
    class Module2 {}

    expect(() => mock.scanModule(Module2)).toThrow(/Reexport from Module2 failed: Module1 includes in exports/);
  });

  it('module exported provider from providersPerApp', () => {
    @injectable()
    class Provider1 {}

    @featureModule({ providersPerApp: [Provider1], exports: [Provider1] })
    class Module2 {}

    expect(() => mock.scanModule(Module2)).toThrow(/includes in "providersPerApp" and "exports" of/);
  });

  it('module exported normalized provider', () => {
    @injectable()
    class Provider1 {}

    @featureModule({ providersPerReq: [Provider1], exports: [{ token: Provider1, useClass: Provider1 }] })
    class Module2 {}

    expect(() => mock.scanModule(Module2)).toThrow('failed: in "exports" array must be includes tokens only');
  });

  it('module exported invalid extension', () => {
    @injectable()
    class Extension1 {}
    const TEST_EXTENSIONS = new InjectionToken<Extension>('TEST_EXTENSIONS');

    @featureModule({ extensions: [{ extension: Extension1 as any, group: TEST_EXTENSIONS, export: true }] })
    class Module2 {}

    expect(() => mock.scanModule(Module2)).toThrow('must have stage1(), stage2() or stage3() method');
  });

  it('module exported valid extension', () => {
    @injectable()
    class Extension1 implements Extension {
      async stage1() {}
    }
    const TEST_EXTENSIONS = new InjectionToken<Extension>('TEST_EXTENSIONS');

    @featureModule({ extensions: [{ extension: Extension1 as any, group: TEST_EXTENSIONS, export: true }] })
    class Module2 {}

    expect(() => mock.scanModule(Module2)).not.toThrow();
  });

  it('root module with imported some other modules', () => {
    @controller()
    class Controller1 {}

    const fn = () => module4WithParams;
    @featureModule({ id: '1', imports: [forwardRef(fn)], controllers: [Controller1] })
    class Module1 {}

    @injectable()
    class Provider0 {}

    @injectable()
    class Provider1 {}

    @featureModule({
      imports: [Module1],
      providersPerMod: [Provider0],
      providersPerRou: [Provider1],
      exports: [Provider0, Provider1, Module1],
    })
    class Module2 {}

    @featureModule({ controllers: [Controller1] })
    class Module4 {
      static withParams(providersPerMod: Provider[]): ModuleWithParams<Module4> {
        return {
          module: Module4,
          providersPerMod,
        };
      }
    }

    @injectable()
    class Provider2 {}

    const module4WithParams = Module4.withParams([Provider2]);

    @rootModule({
      imports: [Module1, Module2],
      providersPerApp: [],
      extensionsMeta: {},
      controllers: [],
      exports: [],
    })
    class Module3 {}

    const expectedMeta1 = new NormalizedModuleMetadata();
    expectedMeta1.id = '1';
    expectedMeta1.name = 'Module1';
    expectedMeta1.modRefId = Module1;
    expectedMeta1.controllers = [Controller1];
    expectedMeta1.importsWithParams = [module4WithParams];
    expectedMeta1.decorator = featureModule;
    expectedMeta1.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta1.isExternal = false;
    expectedMeta1.rawMeta = expect.any(Object);

    mock.scanRootModule(Module3);
    expect(mock.map.size).toBe(4);
    expect(mock.getMetadata('1')).toEqual(expectedMeta1);

    const expectedMeta2 = new NormalizedModuleMetadata();
    expectedMeta2.id = '';
    expectedMeta2.name = 'Module2';
    expectedMeta2.modRefId = Module2;
    expectedMeta2.importsModules = [Module1];
    expectedMeta2.providersPerMod = [Provider0];
    expectedMeta2.providersPerRou = [Provider1];
    expectedMeta2.exportsModules = [Module1];
    expectedMeta2.exportedProvidersPerMod = [Provider0];
    expectedMeta2.exportedProvidersPerRou = [Provider1];
    expectedMeta2.decorator = featureModule;
    expectedMeta2.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta2.isExternal = false;
    expectedMeta2.rawMeta = expect.any(Object);

    expect(mock.map.get(Module2)).toEqual(expectedMeta2);

    const expectedMeta3 = new NormalizedModuleMetadata();
    expectedMeta3.id = '';
    expectedMeta3.name = 'Module3';
    expectedMeta3.modRefId = Module3;
    expectedMeta3.importsModules = [Module1, Module2];
    expectedMeta3.decorator = rootModule;
    expectedMeta3.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta3.isExternal = false;
    expectedMeta3.rawMeta = expect.any(Object);

    expect(mock.getMetadata('root')).toEqual(expectedMeta3);

    const expectedMeta4 = new NormalizedModuleMetadata();
    expectedMeta4.id = '';
    expectedMeta4.name = 'Module4';
    expectedMeta4.controllers = [Controller1];
    expectedMeta4.modRefId = module4WithParams;
    expectedMeta4.providersPerMod = [Provider2];
    expectedMeta4.decorator = featureModule;
    expectedMeta4.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta4.isExternal = false;
    expectedMeta4.rawMeta = expect.any(Object);

    expect(mock.map.get(module4WithParams)).toEqual(expectedMeta4);
  });

  it('programmatically adding some modules to "imports" array of root module', () => {
    @injectable()
    class Provider1 {}

    @controller()
    class Controller1 {}

    @rootModule({
      imports: [],
      providersPerReq: [Provider1],
      extensionsMeta: {},
      controllers: [],
      exports: [],
    })
    class AppModule {}

    @featureModule({ controllers: [Controller1] })
    class Module1 {}

    @featureModule({ controllers: [Controller1] })
    class Module2 {}

    @featureModule({ controllers: [Controller1] })
    class Module3 {
      static withParams(providersPerMod: Provider[]): ModuleWithParams<Module3> {
        return {
          module: Module3,
          providersPerMod,
        };
      }
    }

    @featureModule({ controllers: [Controller1] })
    class Module4 {}

    @injectable()
    class Provider2 {}

    const module3WithProviders = Module3.withParams([Provider2]);

    const expectedMeta1 = new NormalizedModuleMetadata();
    expectedMeta1.id = '';
    expectedMeta1.name = 'AppModule';
    expectedMeta1.modRefId = AppModule;
    expectedMeta1.providersPerReq = [Provider1];
    expectedMeta1.decorator = rootModule;
    expectedMeta1.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta1.isExternal = false;
    expectedMeta1.rawMeta = expect.any(Object);

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(1);
    expect(mock.getMetadata('root')).not.toBe(mock.getMetadata('root'));
    expect(mock.getRawMetadata('root')).toBe(mock.getRawMetadata('root'));
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

    const expectedMeta2 = new NormalizedModuleMetadata();
    expectedMeta2.id = '';
    expectedMeta2.name = 'AppModule';
    expectedMeta2.modRefId = AppModule;
    expectedMeta2.importsModules = [Module1];
    expectedMeta2.providersPerReq = [Provider1];
    expectedMeta2.decorator = rootModule;
    expectedMeta2.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta2.isExternal = false;
    expectedMeta2.rawMeta = expect.any(Object);

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

    const expectedMeta3 = new NormalizedModuleMetadata();
    expectedMeta3.id = '';
    expectedMeta3.name = 'AppModule';
    expectedMeta3.modRefId = AppModule;
    expectedMeta3.importsModules = [Module1, Module2, Module4];
    expectedMeta3.providersPerReq = [Provider1];
    expectedMeta3.decorator = rootModule;
    expectedMeta3.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta3.isExternal = false;
    expectedMeta3.rawMeta = expect.any(Object);

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
    @injectable()
    class Provider1 {}

    @controller()
    class Controller1 {}

    @featureModule({ controllers: [Controller1] })
    class Module0 {}

    @featureModule({ controllers: [Controller1], imports: [Module0] })
    class Module1 {}

    @featureModule({ controllers: [Controller1], imports: [Module0] })
    class Module2 {}

    @featureModule({ controllers: [Controller1] })
    class Module3 {
      static withParams(providersPerMod: Provider[]): ModuleWithParams<Module3> {
        return {
          module: Module3,
          providersPerMod,
        };
      }
    }

    @injectable()
    class Provider2 {}

    const module3WithProviders = Module3.withParams([Provider2]);

    const moduleId = 'my-mix';
    @featureModule({ controllers: [Controller1] })
    class Module4 {
      static withParams(providersPerMod: Provider[]): ModuleWithParams<Module4> {
        return {
          id: moduleId,
          module: Module4,
          providersPerMod,
        };
      }
    }

    const module4WithProviders = Module4.withParams([Provider2]);

    @rootModule({
      imports: [Module1, Module2, module3WithProviders, module4WithProviders],
      providersPerReq: [Provider1],
      extensionsMeta: {},
      controllers: [],
      exports: [],
    })
    class AppModule {}

    const expectedMeta1 = new NormalizedModuleMetadata();
    expectedMeta1.id = '';
    expectedMeta1.name = 'AppModule';
    expectedMeta1.modRefId = AppModule;
    expectedMeta1.importsModules = [Module1, Module2];
    expectedMeta1.importsWithParams = [module3WithProviders, module4WithProviders];
    expectedMeta1.providersPerReq = [Provider1];
    expectedMeta1.decorator = rootModule;
    expectedMeta1.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta1.isExternal = false;
    expectedMeta1.rawMeta = expect.any(Object);

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

    const expectedMeta2 = new NormalizedModuleMetadata();
    expectedMeta2.id = '';
    expectedMeta2.name = 'AppModule';
    expectedMeta2.modRefId = AppModule;
    expectedMeta2.importsModules = [Module1];
    expectedMeta2.importsWithParams = [module3WithProviders, module4WithProviders];
    expectedMeta2.providersPerReq = [Provider1];
    expectedMeta2.decorator = rootModule;
    expectedMeta2.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta2.isExternal = false;
    expectedMeta2.rawMeta = expect.any(Object);

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

    const expectedMeta3 = new NormalizedModuleMetadata();
    expectedMeta3.id = '';
    expectedMeta3.name = 'AppModule';
    expectedMeta3.modRefId = AppModule;
    expectedMeta3.importsModules = [Module1];
    expectedMeta3.importsWithParams = [module4WithProviders];
    expectedMeta3.providersPerReq = [Provider1];
    expectedMeta3.decorator = rootModule;
    expectedMeta3.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta3.isExternal = false;
    expectedMeta3.rawMeta = expect.any(Object);

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

    const expectedMeta4 = new NormalizedModuleMetadata();
    expectedMeta4.id = '';
    expectedMeta4.name = 'AppModule';
    expectedMeta4.modRefId = AppModule;
    expectedMeta4.importsModules = [Module1];
    expectedMeta4.providersPerReq = [Provider1];
    expectedMeta4.decorator = rootModule;
    expectedMeta4.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta4.isExternal = false;
    expectedMeta4.rawMeta = expect.any(Object);

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

    const GROUP_EXTENSIONS = new InjectionToken<Extension<void>[]>('GROUP_EXTENSIONS');
    const extensionsProviders: Provider[] = [
      Extension1,
      { token: GROUP_EXTENSIONS, useToken: Extension1, multi: true },
    ];

    @featureModule({
      extensions: [{ extension: Extension1 as any, group: GROUP_EXTENSIONS, export: true }],
    })
    class Module1 {}

    @rootModule({
      imports: [Module1],
    })
    class Module3 {}

    const expectedMeta3 = new NormalizedModuleMetadata();
    expectedMeta3.id = '';
    expectedMeta3.name = 'Module3';
    expectedMeta3.modRefId = Module3;
    expectedMeta3.importsModules = [Module1];
    expectedMeta3.decorator = rootModule;
    expectedMeta3.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta3.isExternal = false;
    expectedMeta3.rawMeta = expect.any(Object);
    delete (expectedMeta3 as any).aExtensionConfig;
    delete (expectedMeta3 as any).aExportedExtensionConfig;

    const expectedMeta1 = new NormalizedModuleMetadata();
    expectedMeta1.id = '';
    expectedMeta1.name = 'Module1';
    expectedMeta1.modRefId = Module1;
    expectedMeta1.extensionsProviders = extensionsProviders;
    expectedMeta1.exportedExtensionsProviders = extensionsProviders;
    expectedMeta1.decorator = featureModule;
    expectedMeta1.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta1.isExternal = false;
    expectedMeta1.rawMeta = expect.any(Object);
    delete (expectedMeta1 as any).aExtensionConfig;
    delete (expectedMeta1 as any).aExportedExtensionConfig;

    mock.scanRootModule(Module3);
    expect(mock.getMetadata('root')).toMatchObject(expectedMeta3);
    expect(mock.getMetadata(Module1)).toMatchObject(expectedMeta1);
  });

  it('root module with exported globaly some extension', () => {
    @injectable()
    class Extension1 implements Extension<void> {
      async stage1() {}
    }

    const GROUP_EXTENSIONS = new InjectionToken<Extension<void>[]>('GROUP_EXTENSIONS');
    const extensionsProviders: Provider[] = [
      Extension1,
      { token: GROUP_EXTENSIONS, useToken: Extension1, multi: true },
    ];

    @featureModule({
      extensions: [{ extension: Extension1 as any, group: GROUP_EXTENSIONS, export: true }],
    })
    class Module1 {}

    @rootModule({
      imports: [Module1],
      exports: [Module1],
    })
    class Module3 {}

    const expectedMeta3 = new NormalizedModuleMetadata();
    expectedMeta3.id = '';
    expectedMeta3.name = 'Module3';
    expectedMeta3.modRefId = Module3;
    expectedMeta3.importsModules = [Module1];
    expectedMeta3.exportsModules = [Module1];
    expectedMeta3.decorator = rootModule;
    expectedMeta3.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta3.isExternal = false;
    expectedMeta3.rawMeta = expect.any(Object);
    delete (expectedMeta3 as any).aExtensionConfig;
    delete (expectedMeta3 as any).aExportedExtensionConfig;

    const expectedMeta1 = new NormalizedModuleMetadata();
    expectedMeta1.id = '';
    expectedMeta1.name = 'Module1';
    expectedMeta1.modRefId = Module1;
    expectedMeta1.extensionsProviders = extensionsProviders;
    expectedMeta1.exportedExtensionsProviders = extensionsProviders;
    expectedMeta1.decorator = featureModule;
    expectedMeta1.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta1.isExternal = false;
    expectedMeta1.rawMeta = expect.any(Object);
    delete (expectedMeta1 as any).aExtensionConfig;
    delete (expectedMeta1 as any).aExportedExtensionConfig;

    mock.scanRootModule(Module3);
    expect(mock.getMetadata('root')).toMatchObject(expectedMeta3);
    expect(mock.getMetadata(Module1)).toMatchObject(expectedMeta1);
  });

  describe('init extensions', () => {
    interface MyInterface {
      one: string;
      two: number;
    }
    const MY_EXTENSIONS = new InjectionToken<Extension<MyInterface>[]>('MY_EXTENSIONS');

    it('exports token of an extension without this extension', async () => {
      @rootModule({ exports: [MY_EXTENSIONS] })
      class AppModule {}

      const msg = 'is a token of extension, this extension must be included in';
      expect(() => mock.scanRootModule(AppModule)).toThrow(msg);
    });

    it('should throw error about no extension', async () => {
      @rootModule({ exports: [MY_EXTENSIONS] })
      class AppModule {}

      const msg = 'is a token of extension, this extension must be included in';
      expect(() => mock.scanRootModule(AppModule)).toThrow(msg);
    });
  });

  it('split multi providers and common providers', () => {
    class Provider1 {}
    class Provider2 {}
    class Provider3 {}

    const providersPerReq: Provider[] = [
      { token: Provider2, useValue: 'val4', multi: true },
      { token: Provider1, useValue: 'val1', multi: true },
      { token: Provider1, useValue: 'val2', multi: true },
      { token: Provider1, useValue: 'val3', multi: true },
      Provider3,
    ];

    @featureModule({
      providersPerReq,
      exports: [Provider2, Provider1, Provider3],
    })
    class Module1 {}

    @rootModule({
      imports: [Module1],
    })
    class Module3 {}

    const expectedMeta3 = new NormalizedModuleMetadata();
    expectedMeta3.id = '';
    expectedMeta3.name = 'Module3';
    expectedMeta3.modRefId = Module3;
    expectedMeta3.importsModules = [Module1];
    expectedMeta3.decorator = rootModule;
    expectedMeta3.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta3.isExternal = false;
    expectedMeta3.rawMeta = expect.any(Object);

    const expectedMeta1 = new NormalizedModuleMetadata();
    expectedMeta1.id = '';
    expectedMeta1.name = 'Module1';
    expectedMeta1.modRefId = Module1;
    expectedMeta1.providersPerReq = providersPerReq;
    expectedMeta1.exportedProvidersPerReq = [Provider3];
    expectedMeta1.exportedMultiProvidersPerReq = providersPerReq.filter(isMultiProvider);
    expectedMeta1.decorator = featureModule;
    expectedMeta1.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta1.isExternal = false;
    expectedMeta1.rawMeta = expect.any(Object);

    mock.scanRootModule(Module3);
    expect(mock.getMetadata('root')).toEqual(expectedMeta3);
    expect(mock.getMetadata(Module1)).toEqual(expectedMeta1);
  });
});
