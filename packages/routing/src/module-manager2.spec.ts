import { beforeEach, expect, it } from 'vitest';
import {
  AnyObj,
  clearDebugClassNames,
  featureModule,
  ModuleManager,
  ModuleType,
  ModuleWithParams,
  NormalizedModuleMetadata,
  rootModule,
  SystemLogMediator,
} from '@ditsmod/core';

import { CanActivate, guard } from './interceptors/guard.js';
import { AppendsWithParams } from './types.js';
import { controller } from './controller.js';
import { RequestContext } from './request-context.js';

let mock: MockModuleManager;

type ModuleId = string | ModuleType | ModuleWithParams;

class MockModuleManager extends ModuleManager {
  override map = new Map<ModuleType | ModuleWithParams, NormalizedModuleMetadata>();
  override mapId = new Map<string, ModuleType | ModuleWithParams>();
  override oldMap = new Map<ModuleType | ModuleWithParams, NormalizedModuleMetadata>();
  override oldMapId = new Map<string, ModuleType | ModuleWithParams>();
  override getRawMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
    moduleId: ModuleId,
    throwErrIfNotFound?: boolean,
  ): NormalizedModuleMetadata<T, A> | undefined;
  override getRawMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
    moduleId: ModuleId,
    throwErrIfNotFound: true,
  ): NormalizedModuleMetadata<T, A>;
  override getRawMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
    moduleId: ModuleId,
    throwErrOnNotFound?: boolean,
  ) {
    return super.getRawMetadata<T, A>(moduleId, throwErrOnNotFound);
  }
}

beforeEach(() => {
  clearDebugClassNames();
  const systemLogMediator = new SystemLogMediator({ moduleName: 'fakeName', path: '' });
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

  @featureModule({ controllers: [Controller1] })
  class Module1 {}

  @featureModule({ controllers: [Controller2] })
  class Module2 {}

  const moduleWithParams: ModuleWithParams = {
    //
    path: 'module1',
    module: Module1,
    // guards: [Guard1],
  };
  const appendsWithParams: AppendsWithParams = {
    //
    path: 'module2',
    module: Module2,
    // guards: [Guard2],
  };

  @rootModule({
    imports: [moduleWithParams],
    appends: [appendsWithParams],
  })
  class AppModule {}

  mock.scanRootModule(AppModule);
  expect(mock.map.size).toBe(3);
  // expect(mock.getMetadata(moduleWithParams)?.guardsPerMod).toMatchObject([{ guard: Guard1 }]);
  // expect(mock.getMetadata(appendsWithParams)?.guardsPerMod).toMatchObject([{ guard: Guard2 }]);
});
