import {
  clearDebugClassNames,
  featureModule,
  forwardRef,
  ModuleManager,
  ModuleWithParams,
  Providers,
  rootModule,
  SystemLogMediator,
} from '@ditsmod/core';

import { ModuleNormalizer } from './module-normalizer.js';
import { initRest } from '#decorators/rest-init-hooks-and-metadata.js';
import { controller } from '#types/controller.js';
import { CanActivate, NormalizedGuard } from '#interceptors/guard.js';
import { RequestContext } from '#services/request-context.js';
import { AppendsWithParams } from './module-metadata.js';
import { RestModule } from './rest.module.js';

describe('rest ModuleNormalizer', () => {
  class MockModuleNormalizer extends ModuleNormalizer {}

  let mock: MockModuleNormalizer;
  let moduleManager: ModuleManager;

  beforeEach(() => {
    clearDebugClassNames();
    const systemLogMediator = new SystemLogMediator({ moduleName: 'fakeName' });
    moduleManager = new ModuleManager(systemLogMediator);
    mock = new MockModuleNormalizer();
  });

  it('module and append - both with params and without init decorator', () => {
    class Service0 {}

    @featureModule({ providersPerApp: [Service0] })
    class Module1 {}

    @featureModule({ providersPerApp: [Service0] })
    class Module2 {}

    const moduleWithParams: ModuleWithParams = { module: Module1 };
    const appendWithParams: AppendsWithParams = { module: Module2, path: 'test2' };

    // Although in `AppModule` `appendWithParams` and `moduleWithParams` are used in the context of the `initRest` decorator, `Module1` and `Module2`
    // themselves do not have this decorator, so it's important that `Module1` and `Module2` are processed using the init hooks taken from `AppModule`.
    @initRest({
      appends: [appendWithParams],
      imports: [{ modRefId: moduleWithParams, path: 'test1' }],
    })
    @rootModule({
      imports: [moduleWithParams],
    })
    class AppModule {}

    const meta1 = moduleManager.scanRootModule(AppModule).initMeta.get(initRest)!;
    expect(moduleWithParams.initParams?.get(initRest)).toEqual({ path: 'test1' });
    expect(meta1.appendsWithParams).toEqual([appendWithParams]);

    const meta2 = moduleManager.getMetadata(moduleWithParams, true).initMeta.get(initRest)!;
    expect(meta2.params.path).toEqual('test1');

    const meta3 = moduleManager.getMetadata(appendWithParams, true).initMeta.get(initRest)!;
    expect(meta3.params.path).toEqual('test2');
  });

  it('providers or modules with forwardRef', () => {
    class Service0 {}
    class Service1 {}
    class Service2 {}
    class Service3 {}
    class Service4 {}

    @featureModule({ providersPerApp: [Service0] })
    class Module1 {}

    @featureModule({ providersPerApp: [Service0] })
    class Module2 {}

    @featureModule({ providersPerApp: [Service0] })
    class Module3 {}

    @featureModule({ providersPerApp: [Service0] })
    class Module4 {}

    @featureModule({ providersPerApp: [Service0] })
    class Module5 {}

    @featureModule({ providersPerApp: [Service0] })
    class Module6 {}

    const module2WithParams: ModuleWithParams = { module: forwardRef(() => Module2) };
    const module4WithParams: ModuleWithParams = { module: forwardRef(() => Module4) };
    const appendWithParams: AppendsWithParams = { module: forwardRef(() => Module6), path: 'test2' };
    @initRest({
      appends: [forwardRef(() => Module5), appendWithParams],
      imports: [{ modRefId: module2WithParams, path: 'test1' }],
      providersPerRou: [
        forwardRef(() => Service1),
        { token: forwardRef(() => Service3), useClass: forwardRef(() => Service3), multi: true },
      ],
      providersPerReq: [
        forwardRef(() => Service2),
        { token: forwardRef(() => Service4), useToken: forwardRef(() => Service4), multi: true },
      ],
      resolvedCollisionsPerRou: [[forwardRef(() => Service1), forwardRef(() => Module3)]],
      resolvedCollisionsPerReq: [[forwardRef(() => Service2), module4WithParams]],
      exports: [
        forwardRef(() => Service1),
        forwardRef(() => Service2),
        forwardRef(() => Service3),
        forwardRef(() => Service4),
      ],
    })
    @rootModule({
      imports: [forwardRef(() => Module1), module2WithParams],
    })
    class AppModule {}

    const baseMeta = moduleManager.scanRootModule(AppModule);

    const meta1 = moduleManager.getMetadata(AppModule, true).initMeta.get(initRest)!;
    expect(meta1.providersPerRou).toEqual([Service1, { token: Service3, useClass: Service3, multi: true }]);
    expect(meta1.providersPerReq).toEqual([Service2, { token: Service4, useToken: Service4, multi: true }]);
    expect(meta1.exportedProvidersPerRou).toEqual([Service1]);
    expect(meta1.exportedProvidersPerReq).toEqual([Service2]);
    expect(meta1.exportedMultiProvidersPerRou).toEqual([{ token: Service3, useClass: Service3, multi: true }]);
    expect(meta1.exportedMultiProvidersPerReq).toEqual([{ token: Service4, useToken: Service4, multi: true }]);
    expect(meta1.resolvedCollisionsPerRou).toEqual([[Service1, Module3]]);
    expect(meta1.resolvedCollisionsPerReq).toEqual([[Service2, { module: Module4 }]]);
    expect(meta1.appendsModules).toEqual([Module5]);
    expect(meta1.appendsWithParams).toEqual([appendWithParams]);

    const meta2 = moduleManager.getMetadata(module2WithParams, true).initMeta.get(initRest)!;
    expect(meta2.params.path).toEqual('test1');

    const meta3 = moduleManager.getMetadata(appendWithParams, true).initMeta.get(initRest)!;
    expect(meta3.params.path).toEqual('test2');

    expect(baseMeta.importsModules).toEqual([Module1, RestModule]);
    expect(baseMeta.importsWithParams).toEqual([{ module: Module2, initParams: expect.any(Map) }]);
  });

  it('merge static metadata with append params', () => {
    class Service1 {}
    class Service2 {}
    class Guard1 implements CanActivate {
      canActivate(ctx: RequestContext, params?: any[]): boolean | Response | Promise<boolean | Response> {
        return false;
      }
    }
    class Guard2 implements CanActivate {
      canActivate(ctx: RequestContext, params?: any[]): boolean | Response | Promise<boolean | Response> {
        return false;
      }
    }

    @initRest({
      providersPerRou: new Providers().passThrough(Service1),
      providersPerReq: [Service2],
      exports: [Service1, Service2],
    })
    @featureModule()
    class Module1 {}

    const appendsWithParams: AppendsWithParams = {
      path: 'one',
      guards: [Guard1, [Guard2, { property1: 'some-value' }]],
      module: Module1,
    };

    @initRest({
      appends: [appendsWithParams],
    })
    @rootModule()
    class AppModule {}

    const baseMeta = moduleManager.scanRootModule(AppModule);
    const meta1 = moduleManager.getMetadata(AppModule, true).initMeta.get(initRest)!;
    const modRefIds = baseMeta.allInitHooks.get(initRest)?.getModulesToScan(meta1);
    expect(modRefIds).toEqual([appendsWithParams]);
    expect(baseMeta.importsModules).toEqual([RestModule]);
    expect(baseMeta.importsWithParams).toEqual([]);

    const meta2 = moduleManager.getMetadata(appendsWithParams, true).initMeta.get(initRest)!;
    expect(meta2.params.path).toBe('one');
    expect(meta2.params.guards).toEqual<NormalizedGuard[]>([
      { guard: Guard1 },
      { guard: Guard2, params: [{ property1: 'some-value' }] },
    ]);
    expect(meta2.providersPerRou).toEqual([Service1]);
    expect(meta2.providersPerReq).toEqual([Service2]);
    expect(meta2.exportedProvidersPerRou).toEqual([Service1]);
    expect(meta2.exportedProvidersPerReq).toEqual([Service2]);
  });

  it('merge static metadata with import params', () => {
    class Service1 {}
    class Service2 {}
    class Service3 {}
    class Service4 {}
    class Guard1 implements CanActivate {
      canActivate(ctx: RequestContext, params?: any[]): boolean | Response | Promise<boolean | Response> {
        return false;
      }
    }
    class Guard2 implements CanActivate {
      canActivate(ctx: RequestContext, params?: any[]): boolean | Response | Promise<boolean | Response> {
        return false;
      }
    }

    @initRest({
      providersPerRou: new Providers().passThrough(Service1),
      providersPerReq: [Service3],
      exports: [Service1, Service3],
    })
    @featureModule()
    class Module1 {}

    const moduleWithParams: ModuleWithParams = { module: Module1 };

    @initRest({
      imports: [
        {
          modRefId: moduleWithParams,
          path: 'one',
          guards: [Guard1, [Guard2, { property1: 'some-value' }]],
          providersPerRou: [Service2],
          providersPerReq: [Service4],
          exports: [Service2, Service4],
        },
      ],
    })
    @rootModule()
    class AppModule {}

    const baseMeta = moduleManager.scanRootModule(AppModule);
    const meta1 = moduleManager.getMetadata(AppModule, true).initMeta.get(initRest)!;
    const modRefIds = baseMeta.allInitHooks.get(initRest)?.getModulesToScan(meta1);
    expect(modRefIds).toEqual([]);
    expect(baseMeta.importsModules).toEqual([RestModule]);
    expect(baseMeta.importsWithParams).toEqual([moduleWithParams]);

    const meta2 = moduleManager.getMetadata(moduleWithParams, true).initMeta.get(initRest)!;
    expect(meta2.params.path).toBe('one');
    expect(meta2.params.guards).toEqual<NormalizedGuard[]>([
      { guard: Guard1 },
      { guard: Guard2, params: [{ property1: 'some-value' }] },
    ]);
    expect(meta2.providersPerRou).toEqual([Service1, Service2]);
    expect(meta2.providersPerReq).toEqual([Service3, Service4]);
    expect(meta2.exportedProvidersPerRou).toEqual([Service1, Service2]);
    expect(meta2.exportedProvidersPerReq).toEqual([Service3, Service4]);
  });

  it('normalize controllers, multi providers and resolved providers', () => {
    class Service1 {}
    class Service2 {}
    class Module1 {}
    class Module2 {}

    @controller()
    class Controller1 {}

    @initRest({
      controllers: [Controller1],
      providersPerRou: [Service1, { token: Service2, useClass: Service2, multi: true }],
      resolvedCollisionsPerRou: [[Service1, Module1]],
      resolvedCollisionsPerReq: [[Service2, Module2]],
      exports: [Service1, Service2],
    })
    @rootModule()
    class AppModule {}

    const baseMeta = moduleManager.scanRootModule(AppModule);
    const meta = baseMeta.initMeta.get(initRest)!;
    expect(meta.controllers).toEqual([Controller1]);
    expect(meta.providersPerRou).toEqual([Service1, { token: Service2, useClass: Service2, multi: true }]);
    expect(meta.exportedProvidersPerRou).toEqual([Service1]);
    expect(meta.exportedMultiProvidersPerRou).toEqual([{ token: Service2, useClass: Service2, multi: true }]);
    expect(meta.providersPerReq.length).toBe(0);
    expect(meta.resolvedCollisionsPerRou).toEqual([[Service1, Module1]]);
    expect(meta.resolvedCollisionsPerReq).toEqual([[Service2, Module2]]);
  });

  it('wrong imports/exports of modules', () => {
    class Service1 {}

    @featureModule({ providersPerApp: [Service1] })
    class Module1 {}

    @initRest({ exports: [{ module: Module1 }] })
    @rootModule()
    class AppModule {}

    const msg = '"Module1" is listed in "export" but missing from the "imports" array';
    expect(() => moduleManager.scanRootModule(AppModule)).toThrow(msg);
  });
});
