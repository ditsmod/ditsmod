import {
  ModuleType,
  ModuleWithParams,
  ModuleManager,
  NormalizedMeta,
  AnyObj,
  clearDebugClassNames,
  SystemLogMediator,
  featureModule,
  Extension,
  InjectionToken,
  rootModule,
  CallsiteUtils,
  injectable,
  forwardRef,
  Provider,
  isMultiProvider,
  ModRefId,
} from '@ditsmod/core';
import { jest } from '@jest/globals';

import { controller } from '../types/controller.js';
import { addRest } from '#decorators/rest-metadata.js';
import { RestModuleParams } from './module-metadata.js';
import { RestNormalizedMeta } from './rest-normalized-meta.js';

describe('ModuleManager', () => {
  // console.log = jest.fn();
  type ModuleId = string | ModuleType | ModuleWithParams;

  class MockModuleManager extends ModuleManager {
    override map = new Map<ModuleType | ModuleWithParams, NormalizedMeta>();
    override mapId = new Map<string, ModuleType | ModuleWithParams>();
    override oldMap = new Map<ModuleType | ModuleWithParams, NormalizedMeta>();
    override oldMapId = new Map<string, ModuleType | ModuleWithParams>();
    override getOriginMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
      moduleId: ModuleId,
      throwErrIfNotFound?: boolean,
    ): NormalizedMeta<T, A> | undefined;
    override getOriginMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
      moduleId: ModuleId,
      throwErrIfNotFound: true,
    ): NormalizedMeta<T, A>;
    override getOriginMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
      moduleId: ModuleId,
      throwErrOnNotFound?: boolean,
    ) {
      return super.getOriginMetadata<T, A>(moduleId, throwErrOnNotFound);
    }
  }

  let mock: MockModuleManager;

  beforeEach(() => {
    clearDebugClassNames();
    const systemLogMediator = new SystemLogMediator({ moduleName: 'fakeName' });
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

      @addRest({ appends: [{ path: 'v1', module: Version1Module }] })
      @featureModule()
      class Module2 {}

      expect(() => mock.scanModule(Module2)).not.toThrow();
    });

    it('should works with extension only', () => {
      class Ext implements Extension {
        async stage1() {}
      }

      @featureModule({
        extensions: [{ extension: Ext, export: true }],
      })
      class Module1 {}

      expect(() => mock.scanModule(Module1)).not.toThrow();
    });

    it('should throw an error, during imports module without export and without controllers', () => {
      class Provider1 {}
      class Provider2 {}
      @controller()
      class Controller1 {}

      @addRest({ controllers: [Controller1] })
      @featureModule({ providersPerMod: [Provider1, Provider2] })
      class Module1 {}
      
      @addRest()
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

      @addRest({ controllers: [Provider1] })
      @featureModule({ providersPerMod: [Provider1, Provider2] })
      class Module1 {}

      expect(() => mock.scanModule(Module1)).not.toThrow();
    });
  });

  it('empty root module', () => {
    @rootModule({})
    class AppModule {}

    const expectedMeta = new NormalizedMeta();
    expectedMeta.id = '';
    expectedMeta.name = 'AppModule';
    expectedMeta.modRefId = AppModule;
    expectedMeta.decorator = rootModule;
    expectedMeta.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta.isExternal = false;
    expectedMeta.rawDecorMeta = expect.any(Map);

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

    @addRest({ controllers: [Controller1] })
    @featureModule({ imports: [Module1] })
    class Module2 {}

    @addRest({ controllers: [Controller1] })
    @featureModule({ imports: [Module2] })
    class Module3 {}

    @addRest({ controllers: [Controller1] })
    @featureModule({ imports: [Module3] })
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

    @addRest({ providersPerRou: [], providersPerReq: [Provider1], controllers: [] })
    @rootModule({
      imports: [],
      extensionsMeta: {},
      exports: [],
    })
    class AppModule {}

    const expectedMeta = new NormalizedMeta();
    expectedMeta.id = '';
    expectedMeta.name = 'AppModule';
    expectedMeta.modRefId = AppModule;
    expectedMeta.decorator = rootModule;
    expectedMeta.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta.isExternal = false;
    expectedMeta.rawDecorMeta = expect.any(Map);
    expectedMeta.normDecorMeta = expect.any(Map);

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

    const msg = '"Module1" does not have the "@rootModule()" or "@featureModule()" decorator';
    expect(() => mock.scanRootModule(Module2)).toThrow(msg);
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

    @addRest({ controllers: [Controller1] })
    @featureModule()
    class Module1 {}

    @addRest({ controllers: [Controller1] })
    @featureModule({
      imports: [Module1],
      exports: [Module1],
    })
    class Module2 {}

    expect(() => mock.scanModule(Module2)).not.toThrow();
  });

  it('properly reexport module with params, case 1', () => {
    @controller()
    class Controller1 {}

    @addRest({ controllers: [Controller1] })
    @featureModule()
    class Module1 {
      static withParams(): ModuleWithParams<Module1> {
        return {
          module: this,
        };
      }
    }

    const moduleWithParams = Module1.withParams();

    @addRest({ controllers: [Controller1] })
    @featureModule({
      imports: [moduleWithParams],
      exports: [moduleWithParams],
    })
    class Module2 {}

    expect(() => mock.scanModule(Module2)).not.toThrow();
  });

  it('exports multi providers', () => {
    class Multi {}

    const exportedMultiProvidersPerReq = [{ token: Multi, useClass: Multi, multi: true }];

    @addRest({
      providersPerReq: [{ token: Multi, useClass: Multi, multi: true }],
      exports: [Multi],
    })
    @featureModule()
    class Module1 {}

    const baseMeta = mock.scanModule(Module1);
    const meta = baseMeta.normDecorMeta.get(addRest)! as RestNormalizedMeta;
    expect(meta.exportedProvidersPerReq.length).toBe(0);
    expect(meta.exportedMultiProvidersPerReq).toEqual(exportedMultiProvidersPerReq);
  });

  it('not properly reexport module with params, case 2', () => {
    @controller()
    class Controller1 {}

    @addRest({ controllers: [Controller1] })
    @featureModule()
    class Module1 {
      static withParams(): ModuleWithParams<Module1> {
        return {
          module: this,
        };
      }
    }

    const moduleWithParams = Module1.withParams();

    @addRest({ controllers: [Controller1] })
    @featureModule({
      imports: [moduleWithParams],
      exports: [Module1],
    })
    class Module2 {}

    expect(() => mock.scanModule(Module2)).not.toThrow();
  });

  it('exports module without imports it', () => {
    @controller()
    class Controller1 {}

    @addRest({ controllers: [Controller1] })
    @featureModule()
    class Module1 {}

    @addRest({ controllers: [Controller1] })
    @featureModule({ exports: [Module1] })
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

    @addRest({ providersPerReq: [Provider1] })
    @featureModule({ exports: [{ token: Provider1, useClass: Provider1 }] })
    class Module2 {}

    expect(() => mock.scanModule(Module2)).toThrow('failed: in "exports" array must be includes tokens only');
  });

  it('module exported invalid extension', () => {
    @injectable()
    class Extension1 {}

    @featureModule({ extensions: [{ extension: Extension1 as any, export: true }] })
    class Module2 {}

    expect(() => mock.scanModule(Module2)).toThrow('must have stage1(), stage2() or stage3() method');
  });

  it('module exported valid extension', () => {
    @injectable()
    class Extension1 implements Extension {
      async stage1() {}
    }

    @featureModule({ extensions: [{ extension: Extension1 as any, export: true }] })
    class Module2 {}

    expect(() => mock.scanModule(Module2)).not.toThrow();
  });

  it('root module with imported some other modules', () => {
    @controller()
    class Controller1 {}

    const fn = () => Module4;
    @addRest({ controllers: [Controller1] })
    @featureModule({ id: '1', imports: [forwardRef(fn)] })
    class Module1 {}

    @injectable()
    class Provider0 {}

    @injectable()
    class Provider1 {}

    @addRest({ providersPerRou: [Provider1], exports: [Provider1] })
    @featureModule({
      imports: [Module1],
      providersPerMod: [Provider0],
      exports: [Provider0, Module1],
    })
    class Module2 {}

    @injectable()
    class Provider2 {}

    @addRest({ controllers: [Controller1], providersPerRou: [Provider2] })
    @featureModule()
    class Module4 {}

    @addRest({ controllers: [] })
    @rootModule({
      imports: [Module1, Module2],
      providersPerApp: [],
      extensionsMeta: {},
      exports: [],
    })
    class Module3 {}

    const expectedMeta1 = new NormalizedMeta();
    expectedMeta1.id = '1';
    expectedMeta1.name = 'Module1';
    expectedMeta1.modRefId = Module1;
    // expectedMeta1.controllers = [Controller1];
    expectedMeta1.importsModules = [Module4];
    expectedMeta1.decorator = featureModule;
    expectedMeta1.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta1.isExternal = false;
    expectedMeta1.rawDecorMeta = expect.any(Map);
    expectedMeta1.normDecorMeta = expect.any(Map);

    mock.scanRootModule(Module3);
    expect(mock.map.size).toBe(4);
    expect(mock.getMetadata('1')).toEqual(expectedMeta1);

    const expectedMeta2 = new NormalizedMeta();
    expectedMeta2.id = '';
    expectedMeta2.name = 'Module2';
    expectedMeta2.modRefId = Module2;
    expectedMeta2.importsModules = [Module1];
    expectedMeta2.providersPerMod = [Provider0];
    expectedMeta2.exportsModules = [Module1];
    expectedMeta2.exportedProvidersPerMod = [Provider0];
    expectedMeta2.decorator = featureModule;
    expectedMeta2.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta2.isExternal = false;
    expectedMeta2.rawDecorMeta = expect.any(Map);
    expectedMeta2.normDecorMeta = expect.any(Map);

    expect(mock.map.get(Module2)).toEqual(expectedMeta2);

    const expectedMeta3 = new NormalizedMeta();
    expectedMeta3.id = '';
    expectedMeta3.name = 'Module3';
    expectedMeta3.modRefId = Module3;
    expectedMeta3.importsModules = [Module1, Module2];
    expectedMeta3.decorator = rootModule;
    expectedMeta3.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta3.isExternal = false;
    expectedMeta3.rawDecorMeta = expect.any(Map);
    expectedMeta3.normDecorMeta = expect.any(Map);

    expect(mock.getMetadata('root')).toEqual(expectedMeta3);

    const expectedMeta4 = new RestNormalizedMeta();
    expectedMeta4.providersPerRou = [Provider2];
    expectedMeta4.controllers = [Controller1];
    const meta = mock.map.get(Module4)!.normDecorMeta.get(addRest) as RestNormalizedMeta;

    expect(meta).toEqual(expectedMeta4);
  });

  it('programmatically adding some modules to "imports" array of root module', () => {
    @injectable()
    class Provider1 {}

    @controller()
    class Controller1 {}

    @addRest({ controllers: [], providersPerReq: [Provider1] })
    @rootModule({
      imports: [],
      extensionsMeta: {},
      exports: [],
    })
    class AppModule {}

    @addRest({ controllers: [Controller1] })
    @featureModule()
    class Module1 {}

    @addRest({ controllers: [Controller1] })
    @featureModule()
    class Module2 {}

    @injectable()
    class Provider2 {}

    @addRest({ controllers: [Controller1], providersPerReq: [Provider2] })
    @featureModule()
    class Module3 {}

    @addRest({ controllers: [Controller1] })
    @featureModule()
    class Module4 {}

    const expectedMeta1 = new NormalizedMeta();
    expectedMeta1.id = '';
    expectedMeta1.name = 'AppModule';
    expectedMeta1.modRefId = AppModule;
    expectedMeta1.decorator = rootModule;
    expectedMeta1.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta1.isExternal = false;
    expectedMeta1.rawDecorMeta = expect.any(Map);
    expectedMeta1.normDecorMeta = expect.any(Map);

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
    expectedMeta2.decorator = rootModule;
    expectedMeta2.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta2.isExternal = false;
    expectedMeta2.rawDecorMeta = expect.any(Map);
    expectedMeta2.normDecorMeta = expect.any(Map);

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
    expectedMeta3.decorator = rootModule;
    expectedMeta3.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta3.isExternal = false;
    expectedMeta3.rawDecorMeta = expect.any(Map);
    expectedMeta3.normDecorMeta = expect.any(Map);

    expect(mock.getMetadata('root') === mock.getMetadata('root')).toBe(false);
    expect(mock.getMetadata('root')).toEqual(expectedMeta3);

    mock.addImport(Module3);
    expect(mock.map.size).toBe(5);
    expect(mock.oldMap.size).toBe(4);
    expect(mock.getMetadata('root')).toEqual({
      ...expectedMeta3,
      importsModules: [Module1, Module2, Module4, Module3],
    });
    expect(mock.map.has(Module3)).toBe(true);

    mock.rollback();
    expect(mock.map.size).toBe(4);
    expect(mock.getMetadata('root')).toEqual(expectedMeta3);
    expect(mock.map.has(Module3)).toBe(false);
    expect(mock.oldMap.size).toBe(0);
  });

  it('programmatically removing some modules from "imports" array of root module', () => {
    @injectable()
    class Provider1 {}

    @controller()
    class Controller1 {}

    @addRest({ controllers: [Controller1] })
    @featureModule()
    class Module0 {}

    @addRest({ controllers: [Controller1] })
    @featureModule({ imports: [Module0] })
    class Module1 {}

    @addRest({ controllers: [Controller1] })
    @featureModule({ imports: [Module0] })
    class Module2 {}

    @injectable()
    class Provider2 {}

    @addRest({ controllers: [Controller1], providersPerRou: [Provider2] })
    @featureModule()
    class Module3 {}

    const moduleId = 'my-mix';
    @addRest({ controllers: [Controller1], providersPerRou: [Provider2] })
    @featureModule({ id: moduleId })
    class Module4 {}

    @addRest({
      controllers: [],
      providersPerReq: [Provider1],
    })
    @rootModule({
      imports: [Module1, Module2, Module3, Module4],
      extensionsMeta: {},
      exports: [],
    })
    class AppModule {}

    const expectedMeta1 = new NormalizedMeta();
    expectedMeta1.id = '';
    expectedMeta1.name = 'AppModule';
    expectedMeta1.modRefId = AppModule;
    expectedMeta1.importsModules = [Module1, Module2, Module3, Module4];
    expectedMeta1.importsWithParams = [];
    expectedMeta1.decorator = rootModule;
    expectedMeta1.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta1.isExternal = false;
    expectedMeta1.rawDecorMeta = expect.any(Map);
    expectedMeta1.normDecorMeta = expect.any(Map);

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
    expectedMeta2.importsModules = [Module1, Module3, Module4];
    expectedMeta2.importsWithParams = [];
    expectedMeta2.decorator = rootModule;
    expectedMeta2.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta2.isExternal = false;
    expectedMeta2.rawDecorMeta = expect.any(Map);
    expectedMeta2.normDecorMeta = expect.any(Map);

    expect(mock.getMetadata('root')).toMatchObject({ importsModules: [Module1, Module2, Module3, Module4] });
    expect(mock.removeImport(Module2)).toBe(true);
    expect(mock.getMetadata('root')).toMatchObject({ importsModules: [Module1, Module3, Module4] });
    expect(mock.map.size).toBe(4);
    expect(mock.oldMap.get(AppModule)).toMatchObject({ importsModules: [Module1, Module2, Module3, Module4] });
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(5);

    expect(mock.removeImport(Module2)).toBe(false);
    expect(mock.map.size).toBe(4);
    expect(mock.getMetadata('root')).toMatchObject({ importsModules: [Module1, Module3, Module4] });
    expect(mock.getMetadata('root')).toEqual(expectedMeta2);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(5);

    const expectedMeta3 = new NormalizedMeta();
    expectedMeta3.id = '';
    expectedMeta3.name = 'AppModule';
    expectedMeta3.modRefId = AppModule;
    expectedMeta3.importsModules = [Module1, Module4];
    expectedMeta3.importsWithParams = [];
    expectedMeta3.decorator = rootModule;
    expectedMeta3.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta3.isExternal = false;
    expectedMeta3.rawDecorMeta = expect.any(Map);
    expectedMeta3.normDecorMeta = expect.any(Map);

    expect(mock.getMetadata('root')).toMatchObject({
      importsWithParams: [],
      importsModules: [Module1, Module3, Module4],
    });
    expect(mock.removeImport(Module3)).toBe(true);
    expect(mock.getMetadata('root')).toMatchObject({ importsModules: [Module1, Module4] });
    expect(mock.map.size).toBe(3);
    expect(mock.getMetadata('root')).toEqual(expectedMeta3);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(5);
    expect(mock.oldMap.get(AppModule)).toMatchObject({
      importsWithParams: [],
      importsModules: [Module1, Module2, Module3, Module4],
    });

    const expectedMeta4 = new NormalizedMeta();
    expectedMeta4.id = '';
    expectedMeta4.name = 'AppModule';
    expectedMeta4.modRefId = AppModule;
    expectedMeta4.importsModules = [Module1];
    expectedMeta4.decorator = rootModule;
    expectedMeta4.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta4.isExternal = false;
    expectedMeta4.rawDecorMeta = expect.any(Map);
    expectedMeta4.normDecorMeta = expect.any(Map);

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
    expectedMeta3.rawDecorMeta = expect.any(Map);
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
    expectedMeta1.rawDecorMeta = expect.any(Map);
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
    expectedMeta3.rawDecorMeta = expect.any(Map);
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
    expectedMeta1.rawDecorMeta = expect.any(Map);
    delete (expectedMeta1 as any).aExtensionConfig;
    delete (expectedMeta1 as any).aExportedExtensionConfig;

    mock.scanRootModule(Module3);
    expect(mock.getMetadata('root')).toMatchObject(expectedMeta3);
    expect(mock.getMetadata(Module1)).toMatchObject(expectedMeta1);
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

    @addRest({ providersPerReq, exports: [Provider2, Provider1, Provider3] })
    @featureModule()
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
    expectedMeta3.rawDecorMeta = expect.any(Map);

    const expectedMeta1 = new NormalizedMeta();
    expectedMeta1.id = '';
    expectedMeta1.name = 'Module1';
    expectedMeta1.modRefId = Module1;
    expectedMeta1.decorator = featureModule;
    expectedMeta1.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta1.isExternal = false;
    expectedMeta1.rawDecorMeta = expect.any(Map);
    expectedMeta1.normDecorMeta = expect.any(Map);

    mock.scanRootModule(Module3);
    expect(mock.getMetadata('root')).toEqual(expectedMeta3);
    expect(mock.getMetadata(Module1)).toEqual(expectedMeta1);
  });
});
