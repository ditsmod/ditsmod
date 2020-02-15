import 'reflect-metadata';
import { ReflectiveInjector, Injectable } from 'ts-di';

import { ModuleFactory } from './module-factory';
import { ModuleType } from './types/types';
import { NormalizedProvider } from './utils/ng-utils';
import { Module, ModuleMetadata } from './decorators/module';
import { Controller } from './decorators/controller';
import { Route } from './decorators/route';
import { defaultProvidersPerReq } from './types/default-providers';
import { Column } from './decorators/column';
import { Router, RouteConfig } from './types/router';
import { defaultProvidersPerApp } from './decorators/root-module';

describe('ModuleFactory', () => {
  @Injectable()
  class MockModuleFactory extends ModuleFactory {
    opts = new ModuleMetadata();
    router: Router;
    injectorPerMod: ReflectiveInjector;

    initProvidersPerReq() {
      return super.initProvidersPerReq();
    }

    quickCheckImports(moduleMetadata: ModuleMetadata, moduleName: string) {
      return super.quickCheckImports(moduleMetadata, moduleName);
    }

    getRawModuleMetadata(mod: ModuleType) {
      return super.getRawModuleMetadata(mod);
    }

    mergeMetadata(mod: ModuleType) {
      return super.mergeMetadata(mod);
    }

    importProviders(mod: ModuleType, soughtProvider?: NormalizedProvider) {
      return super.importProviders(mod, soughtProvider);
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
    });

    it('should merge default metatada with ClassWithDecorators metadata', () => {
      class SomeControllerClass {}
      class C1 {}
      class Other {}

      const routesPerMod = [{ path: '1', controller: C1 }];

      @Module({
        controllers: [SomeControllerClass],
        providersPerReq: [ClassWithoutDecorators],
        providersPerMod: [Other],
        routesPerMod
      })
      class ClassWithDecorators {}
      const metadata = mock.mergeMetadata(ClassWithDecorators);
      expect(metadata.controllers).toEqual([SomeControllerClass]);
      expect(metadata.exports).toEqual([]);
      expect(metadata.imports).toEqual([]);
      expect(metadata.routesPerMod).toEqual(routesPerMod);
      expect(metadata.providersPerMod).toEqual([Other]);
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
      expect(() => mock.quickCheckImports(moduleMetadata, Module1.name)).toThrow(
        `Import Module1 failed: the imported module should have some controllers or "exports" array with elements.`
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
      expect(() => mock.quickCheckImports(moduleMetadata, Module2.name)).toThrow(
        `Import Module2 failed: the imported module should have some controllers or "exports" array with elements.`
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
      expect(() => mock.quickCheckImports(moduleMetadata, Module1.name)).not.toThrow();
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
      expect(() => mock.quickCheckImports(moduleMetadata, Module1.name)).not.toThrow();
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

  describe('importProviders() and findAndSetProvider()', () => {
    it('should import Provider11 and Provider12 from current module', () => {
      class Provider11 {}
      class Provider12 {}

      @Module({
        exports: [Provider11, Provider12],
        providersPerMod: [Provider11, Provider12]
      })
      class Module1 {}

      mock.importProviders(Module1);
      expect(mock.opts.providersPerMod).toEqual([Provider12, Provider11]);
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

      mock.importProviders(Module2);
      expect(mock.opts.providersPerMod).toEqual([Provider12, Provider11]);
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

      mock.importProviders(Module3);
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
});
