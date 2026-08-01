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
import { RestAppendOptions, type RestDynamicOptions } from './rest-mixin-raw-meta.js';
import { mixinRest, restRootModule } from '#decorators/rest-module-mixins.js';

let mock: MockModuleManager;

class MockModuleManager extends ModuleManager {
  declare map: Map<ModRefId, NormalizedModuleMeta>;
  declare mapId: Map<string, ModRefId>;
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

  @mixinRest({ controllers: [Controller1] })
  @featureModule()
  class Module1 {}

  @mixinRest({ controllers: [Controller2] })
  @featureModule()
  class Module2 {}

  const dynamicModule: RestDynamicOptions & DynamicModule = {
    path: 'module1',
    module: Module1,
    guards: [Guard1],
  };
  const appendsWithOpts: RestAppendOptions = {
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
  const mixinMeta1 = mock.getNormalizedModuleMeta(dynamicModule)?.normalizedMixinMetaMap.get(mixinRest)?.params;
  const mixinMeta2 = mock.getNormalizedModuleMeta(appendsWithOpts)?.normalizedMixinMetaMap.get(mixinRest)?.params;
  expect(mock.map.size).toBe(5);
  expect(mixinMeta1).toMatchObject({ guards: [{ guard: Guard1 }], path: 'module1' });
  expect(mixinMeta2).toMatchObject({ guards: [{ guard: Guard2 }], path: 'module2' });
});
