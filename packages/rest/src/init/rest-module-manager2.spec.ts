import {
  clearDebugClassNames,
  featureModule,
  ModuleManager,
  DynamicModule,
  NormalizedModuleMeta,
  SystemLogMediator,
  ModRefId,
} from '@ditsmod/core';

import { CanActivate, guard } from '../interceptors/guard.js';
import { controller } from '../types/controller.js';
import { RequestContext } from '../services/request-context.js';
import { AppendsWithOptions, type RestModuleOptions } from './rest-init-raw-meta.js';
import { initRest, restRootModule } from '#decorators/rest-init-hooks-and-metadata.js';

let mock: MockModuleManager;

class MockModuleManager extends ModuleManager {
  override map = new Map<ModRefId, NormalizedModuleMeta>();
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

  const dynamicModule: RestModuleOptions & DynamicModule = {
    path: 'module1',
    module: Module1,
    guards: [Guard1],
  };
  const appendsWithOpts: AppendsWithOptions = {
    path: 'module2',
    module: Module2,
    guards: [Guard2],
  };

  @restRootModule({
    appends: [appendsWithOpts],
    imports: [dynamicModule],
  })
  class AppModule {}

  mock.scanRootModule(AppModule);
  const initMeta1 = mock.getNormalizedModuleMeta(dynamicModule)?.initMeta.get(initRest)?.params;
  const initMeta2 = mock.getNormalizedModuleMeta(appendsWithOpts)?.initMeta.get(initRest)?.params;
  expect(mock.map.size).toBe(5);
  expect(initMeta1).toMatchObject({ guards: [{ guard: Guard1 }], path: 'module1' });
  expect(initMeta2).toMatchObject({ guards: [{ guard: Guard2 }], path: 'module2' });
});
