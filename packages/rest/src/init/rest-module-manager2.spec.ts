import {
  AnyObj,
  clearDebugClassNames,
  featureModule,
  ModuleManager,
  ModuleType,
  ModuleWithParams,
  BaseMeta,
  rootModule,
  SystemLogMediator,
} from '@ditsmod/core';

import { CanActivate, guard } from '../interceptors/guard.js';
import { controller } from '../types/controller.js';
import { RequestContext } from '../services/request-context.js';
import { AppendsWithParams } from './rest-init-raw-meta.js';
import { initRest } from '#decorators/rest-init-hooks-and-metadata.js';

let mock: MockModuleManager;

type ModuleId = string | ModuleType | ModuleWithParams;

class MockModuleManager extends ModuleManager {
  override map = new Map<ModuleType | ModuleWithParams, BaseMeta>();
  override mapId = new Map<string, ModuleType | ModuleWithParams>();
  override oldMap = new Map<ModuleType | ModuleWithParams, BaseMeta>();
  override oldMapId = new Map<string, ModuleType | ModuleWithParams>();
  override getOriginMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
    moduleId: ModuleId,
    throwErrIfNotFound?: boolean,
  ): BaseMeta<T, A> | undefined;
  override getOriginMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
    moduleId: ModuleId,
    throwErrIfNotFound: true,
  ): BaseMeta<T, A>;
  override getOriginMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
    moduleId: ModuleId,
    throwErrOnNotFound?: boolean,
  ) {
    return super.getOriginMetadata<T, A>(moduleId, throwErrOnNotFound);
  }
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

  const ModuleWithParams: ModuleWithParams = {
    //
    // path: 'module1',
    module: Module1,
    // guards: [Guard1],
  };
  const appendsWithParams: AppendsWithParams = {
    //
    path: 'module2',
    module: Module2,
    // guards: [Guard2],
  };

  @initRest({})
  @initRest({ appends: [appendsWithParams] })
  @rootModule({ imports: [ModuleWithParams] })
  class AppModule {}

  mock.scanRootModule(AppModule);
  expect(mock.map.size).toBe(3);
  // expect(mock.getMetadata(ModuleWithParams)?.guards).toMatchObject([{ guard: Guard1 }]);
  // expect(mock.getMetadata(appendsWithParams)?.guards).toMatchObject([{ guard: Guard2 }]);
});
