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

    const moduleWithParams: ModuleWithParams = { module: forwardRef(() => Module2) };
    @initRest({
      importsWithParams: [{ modRefId: moduleWithParams, path: 'test1' }],
      providersPerRou: [forwardRef(() => Service3)],
      providersPerReq: [forwardRef(() => Service4)],
      exports: [forwardRef(() => Service3), forwardRef(() => Service4)],
    })
    @rootModule({
      imports: [forwardRef(() => Module1), moduleWithParams],
      providersPerApp: [forwardRef(() => Service1)],
      providersPerMod: [forwardRef(() => Service2)],
      exports: [forwardRef(() => Service2), forwardRef(() => Module1), moduleWithParams],
    })
    class AppModule {}

    const baseMeta = moduleManager.scanRootModule(AppModule);

    const meta1 = moduleManager.getMetadata(AppModule, true).initMeta.get(initRest)!;
    expect(meta1.providersPerRou).toEqual([Service3]);
    expect(meta1.providersPerReq).toEqual([Service4]);
    expect(meta1.exportedProvidersPerRou).toEqual([Service3]);
    expect(meta1.exportedProvidersPerReq).toEqual([Service4]);

    const meta2 = moduleManager.getMetadata(moduleWithParams, true).initMeta.get(initRest)!;
    expect(meta2.params.path).toEqual('test1');

    expect(baseMeta.importsModules).toEqual([Module1, RestModule]);
    expect(baseMeta.exportsModules).toEqual([Module1]);
    expect(baseMeta.importsWithParams).toEqual([{ module: Module2, srcInitMeta: expect.any(Map) }]);
    expect(baseMeta.exportsWithParams).toEqual([{ module: Module2, srcInitMeta: expect.any(Map) }]);
    expect(baseMeta.providersPerApp).toEqual([Service1]);
    expect(baseMeta.providersPerMod).toEqual([Service2]);
    expect(baseMeta.exportedProvidersPerMod).toEqual([Service2]);
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
      importsWithParams: [
        {
          path: 'one',
          guards: [Guard1, [Guard2, { property1: 'some-value' }]],
          modRefId: moduleWithParams,
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

    const msg = '"Module1" is listed in "export" but missing from the "importsWithParams" array';
    expect(() => moduleManager.scanRootModule(AppModule)).toThrow(msg);
  });

  it('proprly works with imports/exports of modules', () => {
    class Service1 {}

    @featureModule({ providersPerApp: [Service1] })
    class Module1 {}
    const moduleWithParams: ModuleWithParams = { module: Module1 };

    @initRest({
      importsWithParams: [{ modRefId: moduleWithParams }],
      exports: [moduleWithParams],
    })
    @rootModule()
    class AppModule {}

    const baseMeta = moduleManager.scanRootModule(AppModule);
    expect(baseMeta.importsModules).toEqual([RestModule]);
    expect(baseMeta.exportsModules).toEqual([]);
    expect(baseMeta.importsWithParams).toEqual([moduleWithParams]);
    expect(baseMeta.exportsWithParams).toEqual([moduleWithParams]);
  });
});
