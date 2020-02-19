import 'reflect-metadata';
import { ReflectiveInjector, Injectable, Type } from 'ts-di';

import { ModuleFactory } from './module-factory';
import { NormalizedProvider } from './utils/ng-utils';
import { Module, ModuleMetadata, defaultProvidersPerReq, ModuleType, ModuleWithOptions } from './decorators/module';
import { Controller } from './decorators/controller';
import { Route } from './decorators/route';
import { Router, RouteConfig } from './types/router';
import { defaultProvidersPerApp, RootModule } from './decorators/root-module';
import { Column } from './modules/orm/decorators/column';

describe('ModuleFactory', () => {
  @Injectable()
  class MockModuleFactory extends ModuleFactory {
    routesPrefixPerApp: string;
    routesPrefixPerMod: string;
    moduleName = 'MockModule';
    opts = new ModuleMetadata();
    router: Router;
    injectorPerMod: ReflectiveInjector;

    initProvidersPerReq() {
      return super.initProvidersPerReq();
    }

    quickCheckImports(moduleMetadata: ModuleMetadata) {
      return super.quickCheckImports(moduleMetadata);
    }

    getRawModuleMetadata(typeOrObject: Type<any> | ModuleWithOptions<any>) {
      return super.getRawModuleMetadata(typeOrObject);
    }

    mergeMetadata(mod: ModuleType) {
      return super.mergeMetadata(mod);
    }

    exportProvidersToImporter(mod: ModuleType, soughtProvider?: NormalizedProvider) {
      return super.exportProvidersToImporter(mod, soughtProvider);
    }

    loadRoutesConfig(prefix: string, configs: RouteConfig[]) {
      return super.loadRoutesConfig(prefix, configs);
    }
  }

  let mock: MockModuleFactory;
  beforeEach(() => {
    mock = new MockModuleFactory(null, null, null);
  });

  class ClassWithoutDecorators {}

  describe('mergeMetadata()', () => {
    it('should set default metatada', () => {
      @Module()
      class ClassWithDecorators {}
      const metadata = mock.mergeMetadata(ClassWithDecorators);
      expect(metadata.controllers).toEqual([]);
      expect(metadata.exports).toEqual([]);
      expect(metadata.imports).toEqual([]);
      expect(metadata.routesPerMod).toEqual([]);
      expect(metadata.providersPerMod).toEqual([]);
      expect(metadata.providersPerReq).toEqual(defaultProvidersPerReq);
      expect((metadata as any).ngMetadataName).toBe('Module');
    });

    it('should merge default metatada with ClassWithDecorators metadata', () => {
      class SomeControllerClass {}
      class C1 {}
      class PerMod {}

      const routesPerMod = [{ path: '1', controller: C1 }];

      @Module({
        controllers: [SomeControllerClass],
        providersPerReq: [ClassWithoutDecorators],
        providersPerMod: [PerMod],
        routesPerMod
      })
      class ClassWithDecorators {}
      const metadata = mock.mergeMetadata(ClassWithDecorators);
      expect(metadata.controllers).toEqual([SomeControllerClass]);
      expect(metadata.exports).toEqual([]);
      expect(metadata.imports).toEqual([]);
      expect(metadata.routesPerMod).toEqual(routesPerMod);
      expect(metadata.providersPerMod).toEqual([PerMod]);
      expect(metadata.providersPerReq).toEqual([...defaultProvidersPerReq, ClassWithoutDecorators]);
    });

    it('ClassWithoutDecorators should not have metatada', () => {
      const msg = `Module build failed: module "ClassWithoutDecorators" does not have the "@Module()" decorator`;
      expect(() => mock.mergeMetadata(ClassWithoutDecorators)).toThrowError(msg);
    });
  });

  describe('quickCheckImports()', () => {
    it('should throw an error, when no export and no controllers', () => {
      class Provider11 {}
      class Provider12 {}

      @Module({
        providersPerMod: [Provider11, Provider12]
      })
      class Module1 {}

      const moduleMetadata = mock.mergeMetadata(Module1);
      expect(() => mock.quickCheckImports(moduleMetadata)).toThrow(
        `Import MockModule failed: this module should have some controllers or "exports" array with elements.`
      );
    });

    it('should throw an error, when no export and no controllers', () => {
      class Provider11 {}
      class Provider12 {}

      @Module({
        providersPerMod: [Provider11, Provider12]
      })
      class Module1 {}

      @Module({
        imports: [Module1]
      })
      class Module2 {}

      const moduleMetadata = mock.mergeMetadata(Module2);
      expect(() => mock.quickCheckImports(moduleMetadata)).toThrow(
        `Import MockModule failed: this module should have some controllers or "exports" array with elements.`
      );
    });

    it('should not throw an error, when export some provider', () => {
      class Provider11 {}
      class Provider12 {}

      @Module({
        exports: [Provider11],
        providersPerMod: [Provider11, Provider12]
      })
      class Module1 {}

      const moduleMetadata = mock.mergeMetadata(Module1);
      expect(() => mock.quickCheckImports(moduleMetadata)).not.toThrow();
    });

    it('should not throw an error, when export some controller', () => {
      class Provider11 {}
      class Provider12 {}

      @Module({
        controllers: [Provider11],
        providersPerMod: [Provider11, Provider12]
      })
      class Module1 {}

      const moduleMetadata = mock.mergeMetadata(Module1);
      expect(() => mock.quickCheckImports(moduleMetadata)).not.toThrow();
    });
  });

  describe('getRawModuleMetadata()', () => {
    class SomeControllerClass {}

    it('should returns ClassWithDecorators metadata', () => {
      @Module({ controllers: [SomeControllerClass] })
      class ClassWithDecorators {}
      const metadata = mock.getRawModuleMetadata(ClassWithDecorators);
      expect(metadata).toEqual(new Module({ controllers: [SomeControllerClass] }));
    });

    it('should not returns any metadata', () => {
      const metadata = mock.getRawModuleMetadata(ClassWithoutDecorators);
      expect(metadata).toBeUndefined();
    });
  });

  describe('exportProvidersToImporter() and findAndSetProvider()', () => {
    it('should import Provider11 and Provider12 from current module', () => {
      class Provider11 {}
      class Provider12 {}

      @Module({
        exports: [Provider11, Provider12],
        providersPerMod: [Provider11, Provider12]
      })
      class Module1 {}

      mock.exportProvidersToImporter(Module1);
      expect(mock.opts.providersPerMod).toEqual([Provider11, Provider12]);
    });

    it('should import Provider11 and Provider12 from Module1', () => {
      class Provider11 {}
      class Provider12 {}
      class Provider21 {}
      class Provider22 {}
      class Provider23 {}
      class Provider24 {}

      @Module({
        exports: [Provider11, Provider12],
        providersPerMod: [Provider11, Provider12]
      })
      class Module1 {}

      @Module({
        imports: [Module1],
        exports: [Module1],
        providersPerMod: [Provider21, Provider22, Provider23],
        providersPerReq: [Provider24]
      })
      class Module2 {}

      mock.exportProvidersToImporter(Module2);
      expect(mock.opts.providersPerMod).toEqual([Provider11, Provider12]);
      expect(mock.opts.providersPerReq).toEqual(defaultProvidersPerReq);
    });

    it('should import only Provider11', () => {
      class Provider11 {}
      class Provider12 {}
      class Provider21 {}
      class Provider22 {}
      class Provider23 {}
      class Provider24 {}
      class Provider31 {}

      @Module({
        exports: [Provider11, Provider12],
        providersPerMod: [Provider11, Provider12]
      })
      class Module1 {}

      @Module({
        imports: [Module1],
        exports: [Provider12],
        providersPerMod: [Provider21, Provider22, Provider23],
        providersPerReq: [Provider24]
      })
      class Module2 {}

      @Module({
        imports: [Module2],
        exports: [Module2],
        providersPerReq: [Provider31]
      })
      class Module3 {}

      mock.exportProvidersToImporter(Module3);
      expect(mock.opts.providersPerMod).toEqual([Provider12]);
      expect(mock.opts.providersPerReq).toEqual(defaultProvidersPerReq);
    });
  });

  describe('loadRoutesConfig() and setRoutes()', () => {
    @Controller()
    class C1 {
      @Column() // <----- It's just to mix `@Route()` with another decorators.
      @Route('GET')
      method() {}
    }
    @Controller()
    class C11 {
      @Route('GET')
      @Column() // <----- It's just to mix `@Route()` with another decorators.
      method() {}
    }
    @Controller()
    class C12 {
      @Route('GET')
      method() {}
    }
    @Controller()
    class C13 {
      @Route('GET')
      method() {}
    }
    @Controller()
    class C121 {
      @Route('GET')
      method() {}
    }
    @Controller()
    class C122 {
      @Route('POST')
      method() {}
    }
    @Controller()
    class C131 {
      @Route('GET')
      method() {}
    }
    @Controller()
    class C21 {
      @Route('GET')
      method() {}
    }
    @Controller()
    class C3 {
      @Route('GET')
      method() {}
    }

    const routesPerMod: RouteConfig[] = [
      {
        path: '1',
        controller: C1,
        children: [
          { path: '11', controller: C11 },
          {
            path: '12',
            controller: C12,
            children: [
              { path: '121', controller: C121 },
              { path: '122', controller: C122 }
            ]
          },
          {
            path: '13',
            controller: C13,
            children: [{ path: '131', controller: C131 }]
          }
        ]
      },
      {
        path: '2',
        children: [{ path: '21', controller: C21 }]
      },
      {
        path: '3',
        controller: C3
      }
    ];

    it('router should includes the routes from routes configs', () => {
      const injectorPerApp = ReflectiveInjector.resolveAndCreate(defaultProvidersPerApp);

      mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
      mock.injectorPerMod = injectorPerApp;
      mock.loadRoutesConfig('api', routesPerMod);
      expect(mock.router.find('GET', '').handle).toBeNull();
      expect(mock.router.find('GET', '/api').handle).toBeNull();
      expect(mock.router.find('GET', '/api/1').handle().controller).toBe(C1);
      expect(mock.router.find('GET', '/api/1/12').handle().controller).toBe(C12);
      expect(mock.router.find('GET', '/api/1/12/121').handle().controller).toBe(C121);
      expect(mock.router.find('POST', '/api/1/12/122').handle().controller).toBe(C122);
      expect(mock.router.find('GET', '/api/1/13').handle().controller).toBe(C13);
      expect(mock.router.find('GET', '/api/1/13/131').handle().controller).toBe(C131);
      expect(mock.router.find('GET', '/api/2/21').handle().controller).toBe(C21);
      expect(mock.router.find('GET', '/api/3').handle().controller).toBe(C3);
      expect(mock.router.find('GET', '/api/4').handle).toBeNull();
    });
  });

  describe('bootstrap()', () => {
    class Provider1 {}
    class Provider2 {}
    class Provider3 {}
    class Provider4 {}
    class Provider5 {}
    class Provider6 {}
    class Provider7 {}
    class Provider8 {}
    class Provider9 {}

    @Module({
      exports: [Provider1, Provider2, Provider3],
      providersPerMod: [Provider1, Provider2, Provider3]
    })
    class Module1 {}

    @Module({
      imports: [Module1],
      exports: [Provider1, Provider3, Provider5, Provider9],
      providersPerMod: [Provider4, Provider5, Provider6],
      providersPerReq: [Provider7, Provider9]
    })
    class Module2 {}

    @Controller()
    class Ctrl {
      @Route('GET')
      method() {}
    }

    @Module({
      imports: [Module2],
      exports: [Module2],
      providersPerReq: [Provider8],
      controllers: [Ctrl]
    })
    class Module3 {}

    it(`Module3 should have Provider1, Provider3, Provider5 in providersPerMod and Provider31 in providersPerReq`, () => {
      const injectorPerApp = ReflectiveInjector.resolveAndCreate(defaultProvidersPerApp);
      mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
      mock.injectorPerMod = injectorPerApp;
      mock.bootstrap('api', '', Module3);
      expect(mock.routesPrefixPerApp).toBe('api');
      expect(mock.opts.providersPerMod).toEqual([Provider1, Provider3, Provider5]);
      expect(mock.opts.providersPerReq).toEqual([Ctrl, ...defaultProvidersPerReq, Provider8, Provider9]);
      expect((mock.opts as any).ngMetadataName).toBe('Module');
    });

    @RootModule({
      imports: [Module3]
    })
    class Module4 {}

    it(`Module4 should have Provider1, Provider3, Provider5 in providersPerMod`, () => {
      const injectorPerApp = ReflectiveInjector.resolveAndCreate(defaultProvidersPerApp);
      mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
      mock.injectorPerMod = injectorPerApp;
      mock.bootstrap('some', 'other', Module4);
      expect(mock.routesPrefixPerApp).toBe('some');
      expect(mock.routesPrefixPerMod).toBe('other');
      expect(mock.router.find('GET', '/some/other').handle().controller).toBe(Ctrl);
      expect(mock.opts.providersPerMod).toEqual([Provider1, Provider3, Provider5]);
      expect(mock.opts.providersPerReq).toEqual([...defaultProvidersPerReq, Provider9]);
      expect((mock.opts as any).ngMetadataName).toBe('RootModule');
    });

    @Module({
      imports: [Module3]
    })
    class Module5 {}

    it(`should throw an error regarding the provider's absence`, () => {
      const injectorPerApp = ReflectiveInjector.resolveAndCreate(defaultProvidersPerApp);
      mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
      mock.injectorPerMod = injectorPerApp;
      const errMsg = `Import Module5 failed: this module should have some controllers or "exports" array with elements.`;
      expect(() => mock.bootstrap('api', '', Module5)).toThrow(errMsg);
    });

    @Module({
      exports: [Provider1, Provider2, Provider3],
      providersPerMod: [Provider1, Provider3]
    })
    class Module6 {}

    @Module({
      imports: [Module6]
    })
    class Module7 {}

    it(`should throw an error about not proper provider exports`, () => {
      const injectorPerApp = ReflectiveInjector.resolveAndCreate(defaultProvidersPerApp);
      mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
      mock.injectorPerMod = injectorPerApp;
      const errMsg = `Exported Provider2 from Module6 should includes in "providersPerMod" or "providersPerReq", or in some "exports" of imported modules.`;
      expect(() => mock.bootstrap('api', '', Module7)).toThrow(errMsg);
    });
  });
});
