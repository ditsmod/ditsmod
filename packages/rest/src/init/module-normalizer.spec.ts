import { clearDebugClassNames, ModuleManager, rootModule, SystemLogMediator } from '@ditsmod/core';

import { ModuleNormalizer } from './module-normalizer.js';
import { addRest } from '#decorators/rest-init-hooks-and-metadata.js';
import { controller } from '#types/controller.js';
import { RestNormalizedMeta } from './rest-normalized-meta.js';

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

  describe('normalize root module only', () => {
    class Service1 {}

    @controller()
    class Controller1 {}

    @addRest({ controllers: [Controller1], providersPerRou: [Service1] })
    @rootModule()
    class AppModule {}

    it('should contain correct metadata', () => {
      const baseMeta = moduleManager.scanRootModule(AppModule);
      const meta = baseMeta.normDecorMeta.get(addRest) as RestNormalizedMeta;
      expect(meta.controllers.length).toBe(1);
      expect(meta.controllers).toEqual([Controller1]);
      expect(meta.providersPerRou.length).toBe(1);
      expect(meta.providersPerRou).toEqual([Service1]);
      expect(meta.providersPerReq.length).toBe(0);
      expect(meta.providersPerReq).toEqual([]);
    });
  });
});
