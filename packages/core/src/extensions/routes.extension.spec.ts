import 'reflect-metadata';
import { injectable, ReflectiveInjector } from '@ts-stack/di';
import { it, describe, beforeEach, xdescribe } from '@jest/globals';

import { controller, ControllerMetadata } from '../decorators/controller';
import { route } from '../decorators/route';
import { rootModule } from '../decorators/root-module';
import { CanActivate } from '../types/mix';
import { defaultProvidersPerApp } from '../services/default-providers-per-app';
import { RootMetadata } from '../models/root-metadata';
import { ModuleManager } from '../services/module-manager';
import { AppInitializer } from '../app-initializer';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { PerAppService } from '../services/per-app.service';
import { SystemLogMediator } from '../log-mediator/system-log-mediator';

xdescribe('RoutesExtension', () => {
  @injectable()
  class MockAppInitializer extends AppInitializer {
    override moduleManager: ModuleManager;
    override perAppService = new PerAppService();
    override meta = new NormalizedModuleMetadata();

    override bootstrapModuleFactory(moduleManager: ModuleManager) {
      return super.bootstrapModuleFactory(moduleManager);
    }
  }

  let mockAppInitializer: MockAppInitializer;
  let moduleManager: ModuleManager;

  beforeEach(() => {
    const log = new SystemLogMediator({ moduleName: 'fakeName' });
    moduleManager = new ModuleManager(log);
    const injectorPerApp = ReflectiveInjector.resolveAndCreate([
      ...defaultProvidersPerApp,
      { token: ModuleManager, useValue: moduleManager },
      { token: RootMetadata, useValue: new RootMetadata() },
      MockAppInitializer,
    ]);
    mockAppInitializer = injectorPerApp.get(MockAppInitializer);
    // mockPreRoutes = new MockPreRoutes(injectorPerApp);
  });

  // describe('getPath', () => {
  //   it('case 1', () => {
  //     const path1 = mock.getPath('/api/posts/:postId', ':postId');
  //     const path2 = mock.getPath('/api/posts', ':postId');
  //     expect(path1).toBe('/api/posts/:postId');
  //     expect(path2).toBe('/api/posts/:postId');
  //   });
  // });

  describe('getRoutesData()', () => {
    it('bad guard', () => {
      const ctrlMetadata = { providersPerReq: [] } as ControllerMetadata;
      class MyGuard {}
      @controller(ctrlMetadata)
      class Controller1 {
        @route('GET', 'url1', [MyGuard as any])
        method1() {}
      }

      @rootModule({
        controllers: [Controller1],
      })
      class AppModule {}

      moduleManager.scanRootModule(AppModule);
      const metadataMap = mockAppInitializer.bootstrapModuleFactory(moduleManager);
      const extensionMeta = metadataMap.get(AppModule);
      // expect(() => mockPreRoutes.getRoutesData(extensionMeta)).toThrowError(/must have canActivate method/);
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
      @controller(ctrlMetadata)
      class Controller1 {
        @route('GET', 'url1', [MyGuard1, [MyGuard2, 'one', 2]])
        method1() {}

        @route('POST', 'url2')
        @route('GET', 'url3')
        method2() {}
      }

      @rootModule({
        controllers: [Controller1],
      })
      class AppModule {}

      moduleManager.scanRootModule(AppModule);
      const metadataMap = mockAppInitializer.bootstrapModuleFactory(moduleManager);
      const metadata = metadataMap.get(AppModule);
      // const routesMetadata = mockPreRoutes.getRoutesData(metadata);
      // expect(routesMetadata.length).toBe(3);
      // expect(routesMetadata[0].decoratorMetadata.otherDecorators).toEqual([]);
      // expect(routesMetadata[0].decoratorMetadata.otherDecorators.map(d => d.decoratorFactory)).toEqual([]);
      // expect(routesMetadata[0].controller).toBe(Controller1);
      // expect(routesMetadata[0].methodName).toBe('method1');
      // expect(routesMetadata[0].route.httpMethod).toBe('GET');
      // expect(routesMetadata[0].route.path).toBe('url1');
      // expect(routesMetadata[0].route.guards.length).toBeGreaterThan(0);
      // expect(routesMetadata[0].providers.length).toBeGreaterThan(0);
      // expect(routesMetadata[0].injector).toBeDefined();
      // expect(routesMetadata[0].parseBody).toBe(false);
      // expect(routesMetadata[0].guards).toEqual([{ guard: MyGuard1 }, { guard: MyGuard2, params: ['one', 2] }]);

      // expect(routesMetadata[1].decoratorMetadata.otherDecorators).toEqual([{ guards: [], httpMethod: 'GET', path: 'url3' }]);
      // expect(routesMetadata[1].decoratorMetadata.otherDecorators.map(d => d.decoratorFactory)).toEqual(['Route']);
      // expect(routesMetadata[1].controller).toBe(Controller1);
      // expect(routesMetadata[1].methodName).toBe('method2');
      // expect(routesMetadata[1].route.httpMethod).toBe('POST');
      // expect(routesMetadata[1].route.path).toBe('url2');
      // expect(routesMetadata[1].route.guards).toEqual([]);
      // expect(routesMetadata[1].providers.length).toBeGreaterThan(0);
      // expect(routesMetadata[1].injector).toBeDefined();
      // expect(routesMetadata[1].parseBody).toBe(true);
      // expect(routesMetadata[1].guards).toEqual([]);

      // expect(routesMetadata[2].decoratorMetadata.otherDecorators).toEqual([{ guards: [], httpMethod: 'POST', path: 'url2' }]);
      // expect(routesMetadata[2].decoratorMetadata.otherDecorators.map(d => d.decoratorFactory)).toEqual(['Route']);
      // expect(routesMetadata[2].controller).toBe(Controller1);
      // expect(routesMetadata[2].methodName).toBe('method2');
      // expect(routesMetadata[2].route.httpMethod).toBe('GET');
      // expect(routesMetadata[2].route.path).toBe('url3');
      // expect(routesMetadata[2].route.guards).toEqual([]);
      // expect(routesMetadata[2].providers.length).toBeGreaterThan(0);
      // expect(routesMetadata[2].injector).toBeDefined();
      // expect(routesMetadata[2].parseBody).toBe(false);
      // expect(routesMetadata[2].guards).toEqual([]);
    });
  });
});
