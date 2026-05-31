import {
  clearDebugClassNames,
  featureModule,
  ModuleManager,
  ModuleWithParams,
  BaseMeta,
  SystemLogMediator,
  ModRefId,
  type Context,
} from '@ditsmod/core';

import { CanActivate, guard } from '../interceptors/guard.js';
import { controller } from '../types/controller.js';
import { AppendsWithParams, type RestModuleParams } from './rest-init-raw-meta.js';
import { initRest, restRootModule } from '#decorators/rest-init-hooks-and-metadata.js';

let mock: MockModuleManager;

class MockModuleManager extends ModuleManager {
  override map = new Map<ModRefId, BaseMeta>();
  override mapId = new Map<string, ModRefId>();
}

beforeEach(() => {
  clearDebugClassNames();
  const systemLogMediator = new SystemLogMediator({ moduleName: 'fakeName' });
  mock = new MockModuleManager(systemLogMediator);
});

it('imports and appends with gruards for some modules', () => {
  @guard()
  class Guard1 implements CanActivate {
    async canActivate(ctx: Context, params?: any[]) {
      return false;
    }
  }

  @guard()
  class Guard2 implements CanActivate {
    async canActivate(ctx: Context, params?: any[]) {
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

  const moduleWithParams: RestModuleParams & ModuleWithParams = {
    path: 'module1',
    module: Module1,
    guards: [Guard1],
  };
  const appendsWithParams: AppendsWithParams = {
    path: 'module2',
    module: Module2,
    guards: [Guard2],
  };

  @restRootModule({
    appends: [appendsWithParams],
    imports: [moduleWithParams],
  })
  class AppModule {}

  mock.scanRootModule(AppModule);
  const initMeta1 = mock.getBaseMeta(moduleWithParams)?.initMeta.get(initRest)?.params;
  const initMeta2 = mock.getBaseMeta(appendsWithParams)?.initMeta.get(initRest)?.params;
  expect(mock.map.size).toBe(5);
  expect(initMeta1).toMatchObject({ guards: [{ guard: Guard1 }], path: 'module1' });
  expect(initMeta2).toMatchObject({ guards: [{ guard: Guard2 }], path: 'module2' });
});
