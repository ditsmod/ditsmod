import {
  clearDebugClassNames,
  featureModule,
  ModuleManager,
  ModuleWithParams,
  Providers,
  rootModule,
  SystemLogMediator,
} from '@ditsmod/core';

import { ModuleNormalizer } from './module-normalizer.js';
import { initRest } from '#decorators/rest-init-hooks-and-metadata.js';
import { controller } from '#types/controller.js';
import { RestNormalizedMeta } from './rest-normalized-meta.js';
import { CanActivate, NormalizedGuard } from '#interceptors/guard.js';
import { RequestContext } from '#services/request-context.js';
import { AppendsWithParams } from './module-metadata.js';

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
    const modRefIds = moduleManager.allInitHooks.get(initRest)?.getModulesToScan(meta1);
    expect(modRefIds).toEqual([appendsWithParams]);
    expect(baseMeta.importsModules).toEqual([]);
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
    const modRefIds = moduleManager.allInitHooks.get(initRest)?.getModulesToScan(meta1);
    expect(modRefIds).toEqual([]);
    expect(baseMeta.importsModules).toEqual([]);
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

  describe('normalize root module only', () => {
    class Service1 {}

    @controller()
    class Controller1 {}

    @initRest({ controllers: [Controller1], providersPerRou: [Service1] })
    @rootModule()
    class AppModule {}

    it('should contain correct metadata', () => {
      const baseMeta = moduleManager.scanRootModule(AppModule);
      const meta = baseMeta.initMeta.get(initRest) as RestNormalizedMeta;
      expect(meta.controllers.length).toBe(1);
      expect(meta.controllers).toEqual([Controller1]);
      expect(meta.providersPerRou.length).toBe(1);
      expect(meta.providersPerRou).toEqual([Service1]);
      expect(meta.providersPerReq.length).toBe(0);
      expect(meta.providersPerReq).toEqual([]);
    });
  });
});
