import 'reflect-metadata';
import { ReflectiveInjector, Injectable } from 'ts-di';

import { ModuleFactory } from './module-factory';
import { ModuleType, Router, RouteConfig } from './types/types';
import { NormalizedProvider } from './utils/ng-utils';
import { Module, Controller, Route } from './types/decorators';
import { defaultProvidersPerReq, ModuleMetadata, defaultProvidersPerApp } from './types/default-options';

describe('ModuleFactory', () => {
  @Injectable()
  class MockModuleFactory extends ModuleFactory {
    opts = new ModuleMetadata();
    router: Router;
    injectorPerMod: ReflectiveInjector;

    initProvidersPerReq() {
      return super.initProvidersPerReq();
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

  describe('importProviders()', () => {
    it('should', () => {});
  });

  describe('loadRoutesConfig() and setRoutes()', () => {
    @Controller()
    class C1 {
      @Route('GET')
      method() {}
    }
    @Controller()
    class C11 {
      @Route('GET')
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
