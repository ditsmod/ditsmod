import { jest } from '@jest/globals';
import {
  ModuleWithParams,
  ModuleManager,
  BaseMeta,
  clearDebugClassNames,
  SystemLogMediator,
  featureModule,
  Extension,
  rootModule,
  injectable,
  forwardRef,
  Provider,
  ModuleWithInitParams,
  ModRefId,
} from '@ditsmod/core';
import {
  ExportingUnknownSymbol,
  ForbiddenExportNormalizedProvider,
  InvalidExtension,
  ModuleShouldHaveValue,
  NormalizationFailed,
  RootNotHaveDecorator,
} from '@ditsmod/core/errors';

import { controller } from '../types/controller.js';
import { initRest } from '#decorators/rest-init-hooks-and-metadata.js';
import { AppendsWithParams } from './rest-init-raw-meta.js';
import { RestInitMeta } from './rest-init-meta.js';
import { CanActivate, guard } from '#interceptors/guard.js';
import { RequestContext } from '#services/request-context.js';
import { RestModule } from './rest.module.js';

describe('ModuleManager', () => {
  console.log = jest.fn();
  type ModuleId = string | ModRefId;

  class MockModuleManager extends ModuleManager {
    override map = new Map<ModRefId, BaseMeta>();
    override mapId = new Map<string, ModRefId>();
    override snapshotMap = new Map<ModRefId, BaseMeta>();
    override snapshotMapId = new Map<string, ModRefId>();
    override oldSnapshotMap = new Map<ModRefId, BaseMeta>();
    override oldSnapshotMapId = new Map<string, ModRefId>();
  }

  let mock: MockModuleManager;
  function getInitMeta(moduleId: ModuleId) {
    const baseMeta = mock.getBaseMeta(moduleId);
    // console.log(baseMeta);
    return baseMeta?.initMeta.get(initRest);
  }

  beforeEach(() => {
    clearDebugClassNames();
    const systemLogMediator = new SystemLogMediator({ moduleName: 'fakeName' });
    mock = new MockModuleManager(systemLogMediator);
  });

  describe('quickCheckMetadata()', () => {
    it('should throw an error, when no export, no extensions and no controllers', () => {
      class Provider1 {}

      @featureModule({ providersPerMod: [Provider1] })
      class Module1 {}

      const err = new NormalizationFailed('Module1', new ModuleShouldHaveValue());
      expect(() => mock.scanModule(Module1)).toThrow(err);
    });

    it('should works, when no export and no controllers, but appends with prefix', () => {
      class Provider1 {}

      @featureModule({
        providersPerMod: [Provider1],
        exports: [Provider1],
      })
      class Module1 {}

      @initRest({ appends: [{ path: 'v1', module: Module1 }] })
      @featureModule()
      class Module2 {}

      expect(() => mock.scanModule(Module2)).not.toThrow();
    });

    it('should works with extension only', () => {
      class Ext implements Extension {
        async stage1() {}
      }

      @featureModule({ extensions: [{ extension: Ext, export: true }] })
      class Module1 {}

      expect(() => mock.scanModule(Module1)).not.toThrow();
    });

    it('should not throw an error, when exports some provider', () => {
      class Provider1 {}

      @featureModule({
        providersPerMod: [Provider1],
        exports: [Provider1],
      })
      class Module1 {}

      expect(() => mock.scanModule(Module1)).not.toThrow();
    });

    it('should not throw an error, when declare some controller', () => {
      @controller()
      class Controller1 {}

      @initRest({ controllers: [Controller1] })
      @featureModule()
      class Module1 {}

      expect(() => mock.scanModule(Module1)).not.toThrow();
    });
  });

  it('populate in initRest providers per a module and per an application', () => {
    class Service1 {}
    class Service2 {}
    class Service3 {}
    class Service4 {}
    class Service5 {}
    class Service6 {}

    @initRest({
      providersPerApp: [Service3],
      providersPerMod: [Service4],
    })
    @featureModule({
      providersPerApp: [Service1],
      providersPerMod: [Service2],
    })
    class Module1 {}

    @initRest({
      imports: [Module1],
      providersPerApp: [Service5],
      providersPerMod: [Service6],
    })
    @rootModule()
    class AppModule {}

    mock.scanRootModule(AppModule);
    const rootBaseMeta = mock.map.get(AppModule);
    const baseMeta1 = mock.map.get(Module1);

    expect(baseMeta1?.providersPerApp).toEqual([Service1, Service3]);
    expect(baseMeta1?.providersPerMod.includes(Service2)).toBeTruthy();
    expect(baseMeta1?.providersPerMod.includes(Service4)).toBeTruthy();
    expect(rootBaseMeta?.providersPerApp).toEqual([Service5]);
    expect(rootBaseMeta?.providersPerMod.includes(Service6)).toBeTruthy();

    const mod1InitMeta = baseMeta1?.initMeta.get(initRest);
    expect(mod1InitMeta?.providersPerApp).toEqual(baseMeta1?.providersPerApp);
    expect(mod1InitMeta?.providersPerMod).toEqual(baseMeta1?.providersPerMod);
    expect(mod1InitMeta?.providersPerMod.includes(Service2)).toBeTruthy();
    expect(mod1InitMeta?.providersPerMod.includes(Service4)).toBeTruthy();

    const rootInitMeta = rootBaseMeta?.initMeta.get(initRest);
    expect(rootInitMeta?.providersPerApp).toEqual(rootBaseMeta?.providersPerApp);
    expect(rootInitMeta?.providersPerMod).toEqual(rootBaseMeta?.providersPerMod);
    expect(rootInitMeta?.providersPerMod.includes(Service6)).toBeTruthy();
  });

  it('empty root module with rootModule decorator only', () => {
    @rootModule()
    class AppModule {}

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(1);
    expect(mock.map.get(AppModule)).toBeDefined();
  });

  it('empty root module with initRest decorator', () => {
    @initRest()
    @rootModule()
    class AppModule {}

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(2);
    expect(mock.map.get(AppModule)).toBeDefined();
    expect(mock.map.get(RestModule)).toBeDefined();
  });

  it('non properly exports from root module', () => {
    class Provider1 {}

    @rootModule({ exports: [Provider1] })
    class AppModule {}

    const err = new NormalizationFailed('AppModule', new ExportingUnknownSymbol('AppModule', 'Provider1'));
    expect(() => mock.scanRootModule(AppModule)).toThrow(err);
  });

  it('root module with some metadata', () => {
    @injectable()
    class Provider1 {}

    @initRest({ providersPerRou: [], providersPerReq: [Provider1] })
    @rootModule()
    class AppModule {}

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(2);
    expect(getInitMeta('root')?.providersPerReq).toEqual([Provider1]);
  });

  it('root module without @rootModule decorator', () => {
    @featureModule()
    class Module1 {}

    const err = new RootNotHaveDecorator('Module1');
    expect(() => mock.scanRootModule(Module1)).toThrow(err);
  });

  it('root module imported module without @featureModule decorator', () => {
    class Module1 {}

    @rootModule({ imports: [Module1] })
    class Module2 {}

    const msg = '"Module1" does not have the "@rootModule()" or "@featureModule()" decorator';
    expect(() => mock.scanRootModule(Module2)).toThrow(msg);
  });

  it('properly reexport module with params', () => {
    @controller()
    class Controller1 {}

    @initRest({ controllers: [Controller1] })
    @featureModule()
    class Module1 {}

    const moduleWithParams: ModuleWithParams = { module: Module1 };

    @initRest({ imports: [moduleWithParams], exports: [moduleWithParams] })
    @featureModule()
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

    const err = new NormalizationFailed('Module2', new ForbiddenExportNormalizedProvider('Module2', 'Provider1'));
    expect(() => mock.scanModule(Module2)).toThrow(err);
  });

  it('module exported invalid extension', () => {
    @injectable()
    class Extension1 {}

    @featureModule({ extensions: [{ extension: Extension1 as any, export: true }] })
    class Module2 {}

    const err = new NormalizationFailed('Module2', new InvalidExtension('Module2', 'Extension1'));
    expect(() => mock.scanModule(Module2)).toThrow(err);
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
    class AppModule {}

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(5);
    expect(getInitMeta(Module1)?.controllers).toEqual([Controller1]);

    expect(mock.map.get(Module2)?.initMeta.get(initRest)?.providersPerRou).toEqual([Provider1]);
    expect(mock.map.get(Module2)?.initMeta.get(initRest)?.exportedProvidersPerRou).toEqual([Provider1]);

    expect(getInitMeta('root')?.importsModules).toEqual([Module1, Module2, RestModule]);

    const initMeta = mock.map.get(module4WithParams)?.initMeta.get(initRest);
    expect(initMeta?.importsModules).toEqual([RestModule]);
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
    class Module1 {
      static withParams(): ModuleWithInitParams<Module1> {
        return {
          module: this,
          initParams: new Map(),
        };
      }
    }

    @initRest({ controllers: [Controller2] })
    @featureModule()
    class Module2 {}

    const moduleWithParams = Module1.withParams();
    moduleWithParams.initParams.set(initRest, { path: 'module1', guards: [Guard1] });
    const appendsWithParams: AppendsWithParams = { path: 'module2', module: Module2, guards: [Guard2] };

    @initRest({ appends: [appendsWithParams] })
    @rootModule({ imports: [moduleWithParams] })
    class AppModule {}

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(4);
    expect(getInitMeta(moduleWithParams)?.params.guards).toMatchObject([{ guard: Guard1 }]);
    expect(getInitMeta(appendsWithParams)?.params.guards).toMatchObject([{ guard: Guard2 }]);
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

    const expectedMeta3 = new RestInitMeta();
    delete (expectedMeta3 as any).aExtensionConfig;
    delete (expectedMeta3 as any).aExportedExtensionConfig;

    const expectedMeta1 = new RestInitMeta();
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

    const expectedMeta3 = new RestInitMeta();
    delete (expectedMeta3 as any).aExtensionConfig;
    delete (expectedMeta3 as any).aExportedExtensionConfig;

    const expectedMeta1 = new RestInitMeta();
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
    class AppModule {}

    const expectedMeta1 = {} as RestInitMeta;
    expectedMeta1.importsModules = [RestModule];
    expectedMeta1.exportedProvidersPerReq = [Provider3];
    expectedMeta1.providersPerReq = providersPerReq;
    expectedMeta1.exportedMultiProvidersPerReq = [
      { token: Provider2, useValue: 'val4', multi: true },
      { token: Provider1, useValue: 'val1', multi: true },
      { token: Provider1, useValue: 'val2', multi: true },
      { token: Provider1, useValue: 'val3', multi: true },
    ];

    mock.scanRootModule(AppModule);
    expect(getInitMeta('root')?.importsModules).toEqual([Module1]);
    expect(getInitMeta(Module1)).toMatchObject(expectedMeta1);
  });
});
