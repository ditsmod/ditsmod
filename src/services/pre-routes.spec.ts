import 'reflect-metadata';
import { ReflectiveInjector } from '@ts-stack/di';

import { Logger } from '../types/logger';
import { PreRoutes } from './pre-routes';
import { ExtensionMetadata } from '../types/extension-metadata';
import { Controller, ControllerMetadata } from '../decorators/controller';
import { Route } from '../decorators/route';
import { RootModule } from '../decorators/root-module';
import { CanActivate } from '../types/can-activate';
import { ModuleType } from '../types/module-type';
import { defaultProvidersPerApp } from './default-providers-per-app';
import { NormalizedRootModuleMetadata } from '../models/normalized-root-module-metadata';
import { AppInitializer } from './app-initializer';

describe('PreRoutes', () => {
  class MockPreRoutes extends PreRoutes {
    getPreRoutesData(moduleName: string, metadata: ExtensionMetadata) {
      return super.getPreRoutesData(moduleName, metadata);
    }
  }

  class MockApplication extends AppInitializer {
    opts = new NormalizedRootModuleMetadata();
    injectorPerApp: ReflectiveInjector;
    log = new Logger();
    bootstrapModuleFactory(appModule: ModuleType) {
      return super.bootstrapModuleFactory(appModule);
    }
  }

  let mockApp: MockApplication;
  let mockPreRoutes: MockPreRoutes;

  beforeEach(() => {
    const injectorPerApp = ReflectiveInjector.resolveAndCreate([...defaultProvidersPerApp]);
    mockApp = new MockApplication();
    mockApp.injectorPerApp = injectorPerApp;
    mockPreRoutes = new MockPreRoutes(injectorPerApp);
  });

  describe('getPreRoutesData()', () => {
    it('bad guard', () => {
      const ctrlMetadata = { providersPerReq: [] } as ControllerMetadata;
      class MyGuard {}
      @Controller(ctrlMetadata)
      class Controller1 {
        @Route('GET', 'url1', [MyGuard as any])
        method1() {}
      }

      @RootModule({
        controllers: [Controller1],
      })
      class AppModule {}

      const metadataMap = mockApp.bootstrapModuleFactory(AppModule);
      const metadata = metadataMap.get(AppModule);
      expect(() => mockPreRoutes.getPreRoutesData('SomeModule', metadata)).toThrowError(/must have canActivate method/);
    });

    it('three decorators with two methods', () => {
      const ctrlMetadata = { providersPerReq: [] } as ControllerMetadata;
      class MyGuard1 implements CanActivate {
        canActivate() {
          return true;
        }
      }
      class MyGuard2 implements CanActivate {
        canActivate() {
          return true;
        }
      }
      @Controller(ctrlMetadata)
      class Controller1 {
        @Route('GET', 'url1', [MyGuard1, [MyGuard2, 'one', 2]])
        method1() {}

        @Route('POST', 'url2')
        @Route('GET', 'url3')
        method2() {}
      }

      @RootModule({
        controllers: [Controller1],
      })
      class AppModule {}

      const metadataMap = mockApp.bootstrapModuleFactory(AppModule);
      const metadata = metadataMap.get(AppModule);
      const routesMetadata = mockPreRoutes.getPreRoutesData('SomeModule', metadata);
      expect(routesMetadata.length).toBe(3);
      expect(routesMetadata[0].methodId).toBe(1);
      expect(routesMetadata[0].controller).toBe(Controller1);
      expect(routesMetadata[0].methodName).toBe('method1');
      expect(routesMetadata[0].route.httpMethod).toBe('GET');
      expect(routesMetadata[0].route.path).toBe('url1');
      expect(routesMetadata[0].route.guards.length).toBeGreaterThan(0);
      expect(routesMetadata[0].providers.length).toBeGreaterThan(0);
      expect(routesMetadata[0].injector).toBeDefined();
      expect(routesMetadata[0].parseBody).toBe(false);
      expect(routesMetadata[0].guards).toEqual([{ guard: MyGuard1 }, { guard: MyGuard2, params: ['one', 2] }]);

      expect(routesMetadata[1].methodId).toBe(2);
      expect(routesMetadata[1].controller).toBe(Controller1);
      expect(routesMetadata[1].methodName).toBe('method2');
      expect(routesMetadata[1].route.httpMethod).toBe('POST');
      expect(routesMetadata[1].route.path).toBe('url2');
      expect(routesMetadata[1].route.guards).toEqual([]);
      expect(routesMetadata[1].providers.length).toBeGreaterThan(0);
      expect(routesMetadata[1].injector).toBeDefined();
      expect(routesMetadata[1].parseBody).toBe(true);
      expect(routesMetadata[1].guards).toEqual([]);

      expect(routesMetadata[2].methodId).toBe(2);
      expect(routesMetadata[2].controller).toBe(Controller1);
      expect(routesMetadata[2].methodName).toBe('method2');
      expect(routesMetadata[2].route.httpMethod).toBe('GET');
      expect(routesMetadata[2].route.path).toBe('url3');
      expect(routesMetadata[2].route.guards).toEqual([]);
      expect(routesMetadata[2].providers.length).toBeGreaterThan(0);
      expect(routesMetadata[2].injector).toBeDefined();
      expect(routesMetadata[2].parseBody).toBe(false);
      expect(routesMetadata[2].guards).toEqual([]);
    });
  });
});
