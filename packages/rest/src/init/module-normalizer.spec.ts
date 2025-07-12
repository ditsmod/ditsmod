import {
  clearDebugClassNames,
  featureModule,
  ModuleManager,
  ModuleWithParams,
  Provider,
  rootModule,
  SystemLogMediator,
} from '@ditsmod/core';

import { ModuleNormalizer } from './module-normalizer.js';
import { addRest } from '#decorators/rest-metadata.js';
import { controller } from '#types/controller.js';

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

  fdescribe('case 1', () => {
    class Service1 {}

    @controller()
    class Controller1 {}

    @addRest({ controllers: [Controller1], providersPerRou: [Service1] })
    @rootModule()
    class AppModule {}

    it('should collects providers from exports array without imports them', () => {
      const baseMeta = moduleManager.scanRootModule(AppModule);
      console.log(baseMeta);
    });
  });

  describe('providersPerApp', () => {
    class Provider0 {}
    class Provider1 {}
    class Provider2 {}
    class Provider3 {}
    class Provider4 {}
    class Provider5 {}
    class Provider6 {}
    class Provider7 {}

    @featureModule({ providersPerApp: [Provider0] })
    class Module0 {}

    @featureModule({ providersPerApp: [Provider1] })
    class Module1 {}

    @featureModule({
      providersPerApp: [Provider2, Provider3, Provider4],
      imports: [Module1],
    })
    class Module2 {}

    @featureModule({
      providersPerApp: [Provider5, Provider6],
      imports: [Module2],
    })
    class Module3 {}

    @rootModule({
      imports: [Module3, Module0],
      providersPerApp: [{ token: Provider1, useClass: Provider7 }],
      exports: [Module0],
    })
    class AppModule {}

    it('should collects providers from exports array without imports them', () => {
      moduleManager.scanRootModule(AppModule);
      const providersPerApp = moduleManager.providersPerApp;
      expect(providersPerApp.includes(Provider0)).toBe(true);
    });

    it('should collects providers in particular order', () => {
      moduleManager.scanRootModule(AppModule);
      const providersPerApp = moduleManager.providersPerApp;
      expect(providersPerApp).toEqual([Provider1, Provider2, Provider3, Provider4, Provider5, Provider6, Provider0]);
    });

    it('should works with baseModuleWithParams', () => {
      @featureModule({})
      class Module6 {
        static withParams(providers: Provider[]): ModuleWithParams<Module6> {
          return {
            module: Module6,
            providersPerApp: providers,
          };
        }
      }
      const modWithParams = Module6.withParams([Provider7]);
      moduleManager.scanModule(modWithParams);
      const providersPerApp = moduleManager.providersPerApp;
      expect(providersPerApp).toEqual([Provider7]);
    });
  });
});
