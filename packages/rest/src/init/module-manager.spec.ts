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
  rootModule,
  injectable,
  forwardRef,
  Provider,
} from '@ditsmod/core';

import { controller } from '../types/controller.js';
import { initRest } from '#decorators/rest-init-hooks-and-metadata.js';
import { AppendsWithParams, RestModuleParams } from './module-metadata.js';
import { RestNormalizedMeta } from './rest-normalized-meta.js';
import { CanActivate, guard } from '#interceptors/guard.js';
import { RequestContext } from '#services/request-context.js';
import { RestModule } from './rest.module.js';

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
  function getInitMeta(moduleId: ModuleId) {
    const baseMeta = mock.getMetadata(moduleId);
    // console.log(baseMeta);
    return baseMeta?.initMeta.get(initRest);
  }

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

      @initRest({ appends: [{ path: 'v1', module: Version1Module }] })
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

    it('should throw an error, during imports module without export and without controllers ', () => {
      class Provider1 {}
      class Provider2 {}
      @controller()
      class Controller1 {}

      @initRest({ controllers: [Controller1] })
      @featureModule({
        providersPerMod: [Provider1, Provider2],
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

      @initRest({ controllers: [Provider1] })
      @featureModule({
        providersPerMod: [Provider1, Provider2],
      })
      class Module1 {}

      expect(() => mock.scanModule(Module1)).not.toThrow();
    });
  });

  it('empty root module', () => {
    @initRest()
    @rootModule()
    class AppModule {}

    const expectedMeta = new RestNormalizedMeta();
    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(2);
    expect(getInitMeta('root')).toEqual(expectedMeta);
  });

  it('circular imports modules with forwardRef()', () => {
    @controller()
    class Controller1 {}

    @injectable()
    class Provider1 {}

    @featureModule({ providersPerApp: [Provider1], imports: [forwardRef(() => Module3)] })
    class Module1 {}

    @initRest({ controllers: [Controller1] })
    @featureModule({ imports: [Module1] })
    class Module2 {}

    @initRest({ controllers: [Controller1] })
    @featureModule({ imports: [Module2] })
    class Module3 {}

    @initRest({ controllers: [Controller1] })
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

    @initRest({ providersPerRou: [], providersPerReq: [Provider1] })
    @rootModule()
    class AppModule {}

    const expectedMeta = new RestNormalizedMeta();
    expectedMeta.providersPerReq = [Provider1];
    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(2);
    expect(getInitMeta('root')).toEqual(expectedMeta);
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

    @initRest({ controllers: [Controller1] })
    @featureModule()
    class Module1 {}

    @initRest({ controllers: [Controller1] })
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

    @initRest({ controllers: [Controller1] })
    @featureModule()
    class Module1 {
      static withParams(): ModuleWithParams<Module1> {
        return {
          module: this,
        };
      }
    }

    const moduleWithParams = Module1.withParams();

    @initRest({ controllers: [Controller1] })
    @featureModule({
      imports: [moduleWithParams],
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

    @initRest({ controllers: [Controller1] })
    @featureModule()
    class Module1 {
      static withParams(): ModuleWithParams<Module1> {
        return {
          module: this,
        };
      }
    }

    const moduleWithParams = Module1.withParams();

    @initRest({ controllers: [Controller1] })
    @featureModule({
      imports: [moduleWithParams],
      exports: [Module1],
    })
    class Module2 {}

    const msg = 'Reexport from Module2 failed: Module1 includes in exports, but not includes in imports';
    expect(() => mock.scanModule(Module2)).toThrow(msg);
  });

  it('exports module without imports it', () => {
    @controller()
    class Controller1 {}

    @initRest({ controllers: [Controller1] })
    @featureModule()
    class Module1 {}

    @initRest({ controllers: [Controller1] })
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

    @initRest({ providersPerReq: [Provider1] })
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

    const fn = () => module4WithParams;
    @initRest({ controllers: [Controller1] })
    @featureModule({ imports: [forwardRef(fn)] })
    class Module1 {}

    @injectable()
    class Provider0 {}

    @injectable()
    class Provider1 {}

    @initRest({ providersPerRou: [Provider1], exports: [Provider1] })
    @featureModule({
      imports: [Module1],
      providersPerMod: [Provider0],
      exports: [Provider0, Module1],
    })
    class Module2 {}

    @initRest({ controllers: [Controller1] })
    @featureModule()
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

    @initRest({ controllers: [] })
    @rootModule({
      imports: [Module1, Module2],
      providersPerApp: [],
      extensionsMeta: {},
      exports: [],
    })
    class Module3 {}

    const expectedMeta1 = new RestNormalizedMeta();
    expectedMeta1.controllers = [Controller1];
    mock.scanRootModule(Module3);
    expect(mock.map.size).toBe(5);
    expect(getInitMeta('1')).toEqual(expectedMeta1);

    const expectedMeta2 = new RestNormalizedMeta();
    expectedMeta2.providersPerRou = [Provider1];
    expectedMeta2.exportedProvidersPerRou = [Provider1];
    expect(mock.map.get(Module2)?.initMeta.get(initRest)).toEqual(expectedMeta2);

    const expectedMeta3 = new RestNormalizedMeta();
    expect(getInitMeta('root')).toEqual(expectedMeta3);

    const expectedMeta4 = new RestNormalizedMeta();
    expectedMeta4.controllers = [Controller1];

    expect(mock.map.get(module4WithParams)?.initMeta.get(initRest)).toEqual(expectedMeta4);
  });

  it('imports and appends with gruards for some modules', () => {
    @guard()
    class Guard1 implements CanActivate {
      async canActivate(ctx: RequestContext, params?: any[]) {
        return false;
      }
    }

    @guard()
    class Guard2 implements CanActivate {
      async canActivate(ctx: RequestContext, params?: any[]) {
        return false;
      }
    }

    @controller()
    class Controller1 {}

    @controller()
    class Controller2 {}

    @initRest({ controllers: [Controller1] })
    @featureModule()
    class Module1 {}

    @initRest({ controllers: [Controller2] })
    @featureModule()
    class Module2 {}

    const modRefId: ModuleWithParams = { module: Module1 };
    const moduleWithParams: RestModuleParams = { path: 'module1', modRefId, guards: [Guard1] };
    const appendsWithParams: AppendsWithParams = { path: 'module2', module: Module2, guards: [Guard2] };

    @initRest({ appends: [appendsWithParams], imports: [moduleWithParams] })
    @rootModule()
    class AppModule {}

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(4);
    expect(getInitMeta(modRefId)?.params.guards).toMatchObject([{ guard: Guard1 }]);
    expect(getInitMeta(appendsWithParams)?.params.guards).toMatchObject([{ guard: Guard2 }]);
  });

  it('programmatically adding some modules to "imports" array of root module', () => {
    @injectable()
    class Provider1 {}

    @controller()
    class Controller1 {}

    @initRest({ providersPerReq: [Provider1], controllers: [] })
    @rootModule({
      imports: [],
      extensionsMeta: {},
      exports: [],
    })
    class AppModule {}

    @initRest({ controllers: [Controller1] })
    @featureModule()
    class Module1 {}

    @initRest({ controllers: [Controller1] })
    @featureModule()
    class Module2 {}

    @initRest({ controllers: [Controller1] })
    @featureModule()
    class Module3 {
      static withParams(providersPerMod: Provider[]): ModuleWithParams<Module3> {
        return {
          module: Module3,
          providersPerMod,
        };
      }
    }

    @initRest({ controllers: [Controller1] })
    @featureModule()
    class Module4 {}

    @injectable()
    class Provider2 {}

    const module3WithProviders = Module3.withParams([Provider2]);

    const expectedMeta1 = new RestNormalizedMeta();
    expectedMeta1.providersPerReq = [Provider1];

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(2);
    expect(mock.getOriginMetadata('root')).toBe(mock.getOriginMetadata('root'));
    expect(getInitMeta('root')).toEqual(expectedMeta1);

    expect(mock.addImport(Module1)).toBe(true);
    expect(mock.map.size).toBe(3);
    expect(mock.map.has(Module1)).toBe(true);
    expect(mock.oldMapId.size).toBe(1);
    expect(mock.oldMapId.get('root')).toBe(AppModule);
    expect(mock.oldMap.size).toBe(2);
    expect(mock.oldMap.get(AppModule)?.initMeta.get(initRest)).toEqual(expectedMeta1);

    expect(mock.addImport(Module1)).toBe(false);
    expect(mock.oldMap.size).toBe(2);
    expect(mock.oldMap.has(AppModule)).toBe(true);
    expect(mock.oldMap.get(AppModule)?.initMeta.get(initRest)).toEqual(expectedMeta1);
    expect(mock.map.size).toBe(3);
    expect(mock.map.has(Module1)).toBe(true);

    mock.commit();
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.size).toBe(0);
    expect(mock.map.size).toBe(3);
    expect(mock.map.has(AppModule)).toBe(true);
    expect(mock.map.has(Module1)).toBe(true);

    expect(() => mock.addImport(Module2, 'fakeId')).toThrow('Failed adding Module2 to imports');
    expect(mock.map.size).toBe(3);
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.size).toBe(0);

    const expectedMeta2 = new RestNormalizedMeta();
    expectedMeta2.providersPerReq = [Provider1];

    mock.addImport(Module2);
    expect(mock.map.size).toBe(4);
    expect(mock.map.has(Module2)).toBe(true);
    expect(mock.oldMap.size).toBe(3);
    expect(mock.oldMap.has(AppModule)).toBe(true);
    expect(mock.oldMap.has(Module1)).toBe(true);
    expect(mock.oldMapId.size).toBe(1);
    expect(mock.oldMapId.get('root')).toBe(AppModule);
    expect(mock.oldMap.get(AppModule)?.initMeta.get(initRest)).toEqual(expectedMeta2);

    mock.addImport(Module4);
    expect(mock.map.size).toBe(5);
    expect(mock.map.has(Module4)).toBe(true);
    expect(mock.oldMap.size).toBe(3);
    expect(mock.oldMap.has(AppModule)).toBe(true);
    expect(mock.oldMap.has(Module1)).toBe(true);
    expect(mock.oldMapId.size).toBe(1);
    expect(mock.oldMapId.get('root')).toBe(AppModule);

    mock.commit();
    expect(mock.map.size).toBe(5);
    expect(mock.map.has(AppModule)).toBe(true);
    expect(mock.map.has(Module1)).toBe(true);
    expect(mock.map.has(Module2)).toBe(true);
    expect(mock.map.has(Module4)).toBe(true);
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.has(AppModule)).toBe(false);

    const expectedMeta3 = new RestNormalizedMeta();
    expectedMeta3.providersPerReq = [Provider1];

    expect(getInitMeta('root')).toEqual(expectedMeta3);

    mock.addImport(module3WithProviders);
    expect(mock.map.size).toBe(6);
    expect(mock.oldMap.size).toBe(5);
    expect(getInitMeta('root')).toMatchObject({ providersPerReq: [Provider1] });
    expect(mock.map.has(module3WithProviders)).toBe(true);

    mock.rollback();
    expect(mock.map.size).toBe(5);
    expect(getInitMeta('root')).toEqual(expectedMeta3);
    expect(mock.map.has(module3WithProviders)).toBe(false);
    expect(mock.oldMap.size).toBe(0);
  });

  it('programmatically removing some modules from "imports" array of root module', () => {
    @injectable()
    class Provider1 {}

    @controller()
    class Controller1 {}

    @initRest({ controllers: [Controller1] })
    @featureModule()
    class Module0 {}

    @initRest({ controllers: [Controller1] })
    @featureModule({ imports: [Module0] })
    class Module1 {}

    @initRest({ controllers: [Controller1] })
    @featureModule({ imports: [Module0] })
    class Module2 {}

    @initRest({ controllers: [Controller1] })
    @featureModule()
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
    @initRest({ controllers: [Controller1] })
    @featureModule()
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

    @initRest({ providersPerReq: [Provider1], controllers: [] })
    @rootModule({
      imports: [Module1, Module2, module3WithProviders, module4WithProviders],
      extensionsMeta: {},
      exports: [],
    })
    class AppModule {}

    const expectedMeta1 = new RestNormalizedMeta();
    expectedMeta1.providersPerReq = [Provider1];

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(7);
    expect(getInitMeta('root')).toEqual(expectedMeta1);
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.size).toBe(0);
    expect(mock.map.get(Module1)).toMatchObject({ importsModules: [Module0, RestModule] });

    expect(mock.removeImport(Module0, Module1)).toBe(true);
    expect(mock.map.get(Module1)).toMatchObject({ importsModules: [RestModule] });
    expect(mock.map.size).toBe(7);
    expect(mock.map.has(Module0)).toBe(true);
    expect(mock.oldMap.size).toBe(7);
    expect(mock.oldMap.get(Module1)).toMatchObject({ importsModules: [Module0, RestModule] });
    expect(mock.oldMap.has(Module0)).toBe(true);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMapId.has(moduleId)).toBe(true);
    expect(mock.oldMapId.get('root')).toBe(AppModule);

    expect(mock.map.get(Module2)).toMatchObject({ importsModules: [Module0, RestModule] });
    expect(mock.removeImport(Module0, Module2)).toBe(true);
    expect(mock.map.get(Module2)).toMatchObject({ importsModules: [RestModule] });
    expect(mock.map.size).toBe(6);
    expect(mock.map.has(Module0)).toBe(false);
    expect(mock.oldMap.size).toBe(7);
    expect(mock.oldMap.get(Module2)).toMatchObject({ importsModules: [Module0, RestModule] });
    expect(mock.oldMap.has(Module0)).toBe(true);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMapId.has(moduleId)).toBe(true);
    expect(mock.oldMapId.get('root')).toBe(AppModule);

    mock.commit();
    expect(mock.map.size).toBe(6);
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.size).toBe(0);

    const expectedMeta2 = new RestNormalizedMeta();
    expectedMeta2.providersPerReq = [Provider1];

    expect(getInitMeta('root')).toMatchObject({ providersPerReq: [Provider1] });
    expect(mock.removeImport(Module2)).toBe(true);
    expect(getInitMeta('root')).toMatchObject({ providersPerReq: [Provider1] });
    expect(mock.map.size).toBe(5);
    expect(mock.oldMap.get(AppModule)).toMatchObject({ importsModules: [Module1, Module2, RestModule] });
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(6);

    expect(mock.removeImport(Module2)).toBe(false);
    expect(mock.map.size).toBe(5);
    expect(getInitMeta('root')).toMatchObject({ providersPerReq: [Provider1] });
    expect(getInitMeta('root')).toEqual(expectedMeta2);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(6);

    const expectedMeta3 = new RestNormalizedMeta();
    expectedMeta3.providersPerReq = [Provider1];

    expect(getInitMeta('root')).toMatchObject({ providersPerReq: [Provider1] });
    expect(mock.removeImport(module3WithProviders)).toBe(true);
    expect(getInitMeta('root')).toMatchObject({ providersPerReq: [Provider1] });
    expect(mock.map.size).toBe(4);
    expect(getInitMeta('root')).toEqual(expectedMeta3);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(6);
    expect(mock.oldMap.get(AppModule)).toMatchObject({
      importsWithParams: [module3WithProviders, module4WithProviders],
    });

    const expectedMeta4 = new RestNormalizedMeta();
    expectedMeta4.providersPerReq = [Provider1];

    expect(mock.removeImport(moduleId)).toBe(true);
    expect(mock.map.size).toBe(3);
    expect(getInitMeta('root')).toEqual(expectedMeta4);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(6);

    mock.rollback();
    expect(mock.mapId.size).toBe(2);
    expect(mock.map.size).toBe(6);
    expect(getInitMeta('root')).toEqual(expectedMeta1);
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

    const expectedMeta3 = new RestNormalizedMeta();
    delete (expectedMeta3 as any).aExtensionConfig;
    delete (expectedMeta3 as any).aExportedExtensionConfig;

    const expectedMeta1 = new RestNormalizedMeta();
    delete (expectedMeta1 as any).aExtensionConfig;
    delete (expectedMeta1 as any).aExportedExtensionConfig;

    mock.scanRootModule(Module3);
    expect(getInitMeta('root')).toBeFalsy();
    expect(getInitMeta(Module1)).toBeFalsy();
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

    const expectedMeta3 = new RestNormalizedMeta();
    delete (expectedMeta3 as any).aExtensionConfig;
    delete (expectedMeta3 as any).aExportedExtensionConfig;

    const expectedMeta1 = new RestNormalizedMeta();
    delete (expectedMeta1 as any).aExtensionConfig;
    delete (expectedMeta1 as any).aExportedExtensionConfig;

    mock.scanRootModule(Module3);
    expect(getInitMeta('root')).toBeFalsy();
    expect(getInitMeta(Module1)).toBeFalsy();
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

    @initRest({ providersPerReq, exports: [Provider2, Provider1, Provider3] })
    @featureModule()
    class Module1 {}

    @rootModule({
      imports: [Module1],
    })
    class Module3 {}

    const expectedMeta1 = new RestNormalizedMeta();
    expectedMeta1.exportedProvidersPerReq = [Provider3];
    expectedMeta1.providersPerReq = providersPerReq;
    expectedMeta1.exportedMultiProvidersPerReq = [
      { token: Provider2, useValue: 'val4', multi: true },
      { token: Provider1, useValue: 'val1', multi: true },
      { token: Provider1, useValue: 'val2', multi: true },
      { token: Provider1, useValue: 'val3', multi: true },
    ];

    mock.scanRootModule(Module3);
    expect(getInitMeta('root')).toBeFalsy();
    expect(getInitMeta(Module1)).toEqual(expectedMeta1);
  });
});
