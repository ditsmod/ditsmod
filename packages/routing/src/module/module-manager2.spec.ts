import { beforeEach, expect, it } from 'vitest';
import {
  AnyObj,
  clearDebugClassNames,
  featureModule,
  ModuleManager,
  ModuleType,
  ModuleWithParams,
  NormalizedMeta,
  rootModule,
  SystemLogMediator,
} from '@ditsmod/core';

import { CanActivate, guard } from '../interceptors/guard.js';
import { controller } from '../types/controller.js';
import { RequestContext } from '../services/request-context.js';
import { AppendsWithParams } from './module-metadata.js';
import { routingMetadata } from '#decorators/routing-metadata.js';

let mock: MockModuleManager;

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

  @routingMetadata({ controllers: [Controller1] })
  @featureModule()
  class Module1 {}

  @routingMetadata({ controllers: [Controller2] })
  @featureModule()
  class Module2 {}

  const ModuleWithParams: ModuleWithParams = {
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

  @routingMetadata({})
  @routingMetadata({ appends: [appendsWithParams] })
  @rootModule({ imports: [ModuleWithParams] })
  class AppModule {}

  mock.scanRootModule(AppModule);
  expect(mock.map.size).toBe(3);
  // expect(mock.getMetadata(ModuleWithParams)?.guardsPerMod).toMatchObject([{ guard: Guard1 }]);
  // expect(mock.getMetadata(appendsWithParams)?.guardsPerMod).toMatchObject([{ guard: Guard2 }]);
});
