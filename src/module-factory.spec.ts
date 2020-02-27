import 'reflect-metadata';
import { ReflectiveInjector, Injectable, Type, Provider } from '@ts-stack/di';

import { ModuleFactory } from './module-factory';
import { NormalizedProvider } from './utils/ng-utils';
import {
  Module,
  ModuleMetadata,
  ModuleType,
  ModuleWithOptions,
  ModuleDecorator,
  ProvidersMetadata,
  defaultProvidersPerReq
} from './decorators/module';
import { Controller } from './decorators/controller';
import { Route } from './decorators/route';
import { Router, RouteConfig } from './types/router';
import { defaultProvidersPerApp, RootModule } from './decorators/root-module';
import { Column } from './modules/orm/decorators/column';
import { Logger } from './types/logger';
import { AppFactory } from './app-factory';
import { NodeReqToken } from './types/injection-tokens';
import { Request } from './request';

describe('ModuleFactory', () => {
  @Injectable()
  class MockModuleFactory extends ModuleFactory {
    log: Logger;
    prefixPerApp: string;
    prefixPerMod: string;
    moduleName = 'MockModule';
    opts = new ModuleMetadata();
    router: Router;
    injectorPerMod: ReflectiveInjector;
    testOptionsMap = new Map<Type<any>, ModuleMetadata>();
    allProvidersPerApp: Provider[];

    initProvidersPerReq() {
      return super.initProvidersPerReq();
    }

    quickCheckImports(moduleMetadata: ModuleMetadata) {
      return super.quickCheckImports(moduleMetadata);
    }

    getRawModuleMetadata<T extends ModuleDecorator>(modOrObject: Type<any> | ModuleWithOptions<any>, isRoot?: boolean) {
      return super.getRawModuleMetadata(modOrObject, isRoot) as T;
    }

    mergeMetadata(mod: ModuleType) {
      return super.mergeMetadata(mod);
    }

    exportProvidersToImporter(
      modOrObject: Type<any> | ModuleWithOptions<any>,
      isStarter: boolean,
      soughtProvider: NormalizedProvider
    ) {
      return super.exportProvidersToImporter(modOrObject, isStarter, soughtProvider);
    }

    loadRoutesConfig(prefix: string, configs: RouteConfig[]) {
      return super.loadRoutesConfig(prefix, configs);
    }
  }

  class MockAppFactory extends AppFactory {
    prepareServerOptions(appModule: ModuleType) {
      return super.prepareServerOptions(appModule);
    }

    bootstrapModuleFactory(appModule: ModuleType) {
      return super.bootstrapModuleFactory(appModule);
    }
  }

  class MyLogger extends Logger {
    debug = (...args: any[]): any => {
      console.log(`debug:\n ${'*'.repeat(50)}\n`, ...args);
    };
  }

  const log = new MyLogger();

  let mock: MockModuleFactory;
  let mockApp: MockAppFactory;

  beforeEach(() => {
    mock = new MockModuleFactory(null, null, log);
    mockApp = new MockAppFactory();
  });

  class ClassWithoutDecorators {}

  describe('mergeMetadata()', () => {
    it('should set default metatada', () => {
      @Module()
      class ClassWithDecorators {}
      const metadata = mock.mergeMetadata(ClassWithDecorators);
      expect(metadata.controllers).toEqual([]);
      expect(metadata.exports).toEqual([]);
      expect(metadata.importsWithPrefix).toEqual([]);
      expect(metadata.routesPerMod).toEqual([]);
      expect(metadata.providersPerMod).toEqual([]);
      expect(metadata.providersPerReq).toEqual([]);
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
      expect(metadata.importsWithPrefix).toEqual([]);
      expect(metadata.routesPerMod).toEqual(routesPerMod);
      expect(metadata.providersPerMod).toEqual([PerMod]);
      expect(metadata.providersPerReq).toEqual([ClassWithoutDecorators]);
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
        `Import MockModule failed: this module should have "providersPerApp" or some controllers or "exports" array with elements.`
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
        `Import MockModule failed: this module should have "providersPerApp" or some controllers or "exports" array with elements.`
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
      const injectorPerApp = ReflectiveInjector.resolveAndCreate(defaultProvidersPerApp as Provider[]);

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
    class Provider0 {}
    class Provider1 {}
    class Provider2 {}
    class Provider3 {}
    class Provider4 {}
    class Provider5 {}
    class Provider6 {}
    class Provider7 {}
    class Provider8 {}
    class Provider9 {}

    describe(`exporting providers order`, () => {
      @Module({
        exports: [Provider0],
        providersPerMod: [Provider0]
      })
      class Module0 {}

      @Module({
        imports: [Module0],
        exports: [Module0, Provider1, Provider2, Provider3],
        providersPerMod: [Provider1, Provider2, Provider3]
      })
      class Module1 {}

      @Module({
        imports: [Module1],
        exports: [Provider1, Provider3, Provider5, Provider8],
        providersPerMod: [Provider4, Provider5, Provider6],
        providersPerReq: [Provider7, Provider8]
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
        providersPerReq: [Provider9],
        controllers: [Ctrl]
      })
      class Module3 {}

      it(`case 1`, () => {
        const injectorPerApp = ReflectiveInjector.resolveAndCreate([
          ...defaultProvidersPerApp,
          { provide: Logger, useClass: MyLogger }
        ]);

        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;
        mock.bootstrap(new ProvidersMetadata(), 'api', '', Module3);
        expect(mock.prefixPerApp).toBe('api');

        const mod0 = mock.testOptionsMap.get(Module0);
        expect(mod0.providersPerMod).toEqual([Provider0]);
        expect(mod0.providersPerReq).toEqual([]);
        expect((mod0 as any).ngMetadataName).toBe('Module');

        const mod1 = mock.testOptionsMap.get(Module1);
        expect(mod1.providersPerMod).toEqual([Provider0, Provider1, Provider2, Provider3]);
        expect(mod1.providersPerReq).toEqual([]);
        expect((mod1 as any).ngMetadataName).toBe('Module');

        const mod2 = mock.testOptionsMap.get(Module2);
        expect(mod2.providersPerMod).toEqual([
          Provider0,
          Provider1,
          Provider2,
          Provider3,
          Provider4,
          Provider5,
          Provider6
        ]);
        expect(mod2.providersPerReq).toEqual([Provider7, Provider8]);
        expect((mod2 as any).ngMetadataName).toBe('Module');

        const mod3 = mock.testOptionsMap.get(Module3);
        expect(mod3.providersPerMod).toEqual([Provider1, Provider3, Provider5]);
        expect(mod3.providersPerReq).toEqual([Ctrl, Provider8, Provider9]);
        expect(mod3.controllers).toEqual([Ctrl]);
        expect((mod3 as any).ngMetadataName).toBe('Module');
      });

      @RootModule({
        imports: [Module3]
      })
      class Module4 {}

      it(`case 2`, () => {
        const injectorPerApp = ReflectiveInjector.resolveAndCreate(defaultProvidersPerApp as Provider[]);
        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;
        mock.bootstrap(new ProvidersMetadata(), 'some', 'other', Module4);

        expect(mock.prefixPerApp).toBe('some');
        expect(mock.prefixPerMod).toBe('other');
        expect(mock.router.find('GET', '/some/other').handle().controller).toBe(Ctrl);
        expect(mock.opts.providersPerMod).toEqual([Provider1, Provider3, Provider5]);
        expect(mock.opts.providersPerReq).toEqual([...defaultProvidersPerReq, Provider8]);
        expect((mock.opts as any).ngMetadataName).toBe('RootModule');
      });

      @Module({
        imports: [Module3]
      })
      class Module5 {}

      it(`should throw an error regarding the provider's absence`, () => {
        const injectorPerApp = ReflectiveInjector.resolveAndCreate(defaultProvidersPerApp as Provider[]);
        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;
        const errMsg = `Import Module5 failed: this module should have "providersPerApp" or some controllers or "exports" array with elements.`;
        expect(() => mock.bootstrap(new ProvidersMetadata(), 'api', '', Module5)).toThrow(errMsg);
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
        const injectorPerApp = ReflectiveInjector.resolveAndCreate(defaultProvidersPerApp as Provider[]);
        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;
        const errMsg =
          `Exported Provider2 from Module6 ` +
          `should includes in "providersPerMod" or "providersPerReq", ` +
          `or in some "exports" of imported modules. ` +
          `Tip: "providersPerApp" no need exports, they are automatically exported.`;
        expect(() => mock.bootstrap(new ProvidersMetadata(), 'api', '', Module7)).toThrow(errMsg);
      });
    });

    describe(`unpredictable priority`, () => {
      describe(`per a module`, () => {
        @Module({
          exports: [Provider1],
          providersPerMod: [{ provide: Provider1, useClass: Provider1 }, Provider2]
        })
        class Module0 {}

        @Module({
          exports: [Provider1, Provider2]
        })
        class Module1 {
          static withOptions() {
            return { module: Module1, providersPerMod: [Provider1, Provider2] };
          }
        }

        @Module({
          imports: [Module1.withOptions()],
          exports: [Module1.withOptions(), Provider2, Provider3],
          providersPerMod: [Provider2, Provider3]
        })
        class Module2 {}

        it(`exporting duplicates of Provider2`, () => {
          @RootModule({
            imports: [Module2]
          })
          class RootModule1 {}

          const msg =
            `Exporting providers in RootModule1 was failed: Unpredictable priority was found for: ` +
            `Provider2. You should manually add these providers to RootModule1.`;
          expect(() => mockApp.prepareServerOptions(RootModule1)).toThrow(msg);
        });

        it(`exporting duplicates of Provider2, but declared in providersPerMod of root module`, () => {
          @RootModule({
            imports: [Module2],
            providersPerMod: [Provider2]
          })
          class RootModule1 {}

          expect(() => mockApp.prepareServerOptions(RootModule1)).not.toThrow();
        });

        it(`exporting duplicates of Provider1 from Module1 and Module2`, () => {
          @RootModule({
            imports: [Module0, Module1.withOptions()]
          })
          class RootModule1 {}

          const msg =
            `Exporting providers in RootModule1 was failed: Unpredictable priority was found for: ` +
            `Provider1. You should manually add these providers to RootModule1.`;
          expect(() => mockApp.prepareServerOptions(RootModule1)).toThrow(msg);
        });

        it(`exporting duplicates of Provider1 from Module1 and Module2, but declared in providersPerMod of root module`, () => {
          @RootModule({
            imports: [Module0, Module1.withOptions()],
            providersPerMod: [Provider1]
          })
          class RootModule1 {}

          expect(() => mockApp.prepareServerOptions(RootModule1)).not.toThrow();
        });
      });

      describe(`per a req`, () => {
        @Module({
          exports: [Provider1],
          providersPerReq: [{ provide: Provider1, useClass: Provider1 }, Provider2]
        })
        class Module0 {}

        @Module({
          exports: [Provider1, Provider2],
          providersPerReq: [Provider1, Provider2]
        })
        class Module1 {}

        @Module({
          imports: [Module1],
          exports: [Module1, Provider2, Provider3],
          providersPerReq: [Provider2, Provider3]
        })
        class Module2 {}

        it(`exporting duplicates of Provider2`, () => {
          @RootModule({
            imports: [Module2]
          })
          class RootModule1 {}

          const msg =
            `Exporting providers in RootModule1 was failed: Unpredictable priority was found for: ` +
            `Provider2. You should manually add these providers to RootModule1.`;
          expect(() => mockApp.prepareServerOptions(RootModule1)).toThrow(msg);
        });

        it(`exporting duplicates of Provider2, but declared in providersPerReq of root module`, () => {
          @RootModule({
            imports: [Module2],
            providersPerReq: [Provider2]
          })
          class RootModule1 {}

          expect(() => mockApp.prepareServerOptions(RootModule1)).not.toThrow();
        });

        it(`exporting duplicates of Provider1 from Module1 and Module2`, () => {
          @RootModule({
            imports: [Module0, Module1]
          })
          class RootModule1 {}

          const msg =
            `Exporting providers in RootModule1 was failed: Unpredictable priority was found for: ` +
            `Provider1. You should manually add these providers to RootModule1.`;
          expect(() => mockApp.prepareServerOptions(RootModule1)).toThrow(msg);
        });

        it(`exporting duplicates of Provider1 from Module1 and Module2, but declared in providersPerReq of root module`, () => {
          @RootModule({
            imports: [Module0, Module1],
            providersPerReq: [Provider1]
          })
          class RootModule1 {}

          expect(() => mockApp.prepareServerOptions(RootModule1)).not.toThrow();
        });
      });

      describe(`mix per app, per mod or per req`, () => {
        it(`case 1`, () => {
          @Module({
            exports: [
              Provider0,
              Provider1,
              { provide: Request, useClass: Request },
              { provide: NodeReqToken, useValue: '' },
              Provider3
            ],
            providersPerMod: [Provider0],
            providersPerReq: [
              { provide: Provider1, useClass: Provider1 },
              Provider2,
              { provide: NodeReqToken, useValue: '' },
              Provider3,
              Request
            ]
          })
          class Module0 {}

          @RootModule({
            imports: [Module0],
            providersPerApp: [Provider0],
            providersPerMod: [Provider1],
            providersPerReq: []
          })
          class RootModule1 {}

          const msg =
            `Exporting providers in RootModule1 was failed: Unpredictable priority was found for: ` +
            `Provider0, Request, Provider1, InjectionToken NodeRequest. You should manually add these providers to RootModule1.`;
          expect(() => mockApp.prepareServerOptions(RootModule1)).toThrow(msg);
        });

        it(`case 2`, () => {
          @Module({
            exports: [Provider0, Provider1],
            providersPerApp: [Router]
          })
          class Module0 {}

          @RootModule({
            imports: [Module0]
          })
          class RootModule1 {}

          const msg =
            `Exporting providers in RootModule1 was failed: Unpredictable priority was found for: ` +
            `Router. You should manually add these providers to RootModule1.`;
          expect(() => mockApp.prepareServerOptions(RootModule1)).toThrow(msg);
        });
      });
    });

    describe(`export from root module`, () => {
      @Controller()
      class Ctrl {}

      @Module({
        exports: [Provider0],
        providersPerMod: [Provider0]
      })
      class Module0 {}

      const obj1 = { provide: Provider1, useClass: Provider1 };
      @Module({
        controllers: [Ctrl],
        exports: [Provider1],
        providersPerMod: [obj1, Provider2]
      })
      class Module1 {}

      @Module({
        exports: [Provider3, Provider4]
      })
      class Module2 {
        static withOptions() {
          return { module: Module2, providersPerMod: [Provider3, Provider4] };
        }
      }

      @Module({
        exports: [Provider5, Provider6, Provider7],
        providersPerReq: [Provider5, Provider6, Provider7]
      })
      class Module3 {}

      @Module({
        exports: [Provider8, Provider9],
        providersPerReq: [Provider8, Provider9]
      })
      class Module4 {}

      @Module({
        providersPerApp: [{ provide: Logger, useClass: MyLogger }]
      })
      class Module5 {}

      @RootModule({
        imports: [Module0, Module1, Module2.withOptions(), Module5],
        exports: [Module0, Module2.withOptions(), Module3],
        importsWithPrefix: [
          { prefix: 'one', module: Module3 },
          { prefix: 'two', module: Module4 }
        ],
        providersPerApp: [Logger]
      })
      class RootModule1 {}

      it(`Module0`, () => {
        const testOptionsMap = mockApp.prepareServerOptions(RootModule1);
        const mod0 = testOptionsMap.get(Module0);
        expect(mod0.providersPerApp).toEqual([]);
        expect(mod0.providersPerMod).toEqual([Provider3, Provider4, Provider0]);
        expect(mod0.providersPerReq).toEqual([...defaultProvidersPerReq, Provider5, Provider6, Provider7]);
      });

      it(`Module1`, () => {
        const testOptionsMap = mockApp.prepareServerOptions(RootModule1);
        const mod1 = testOptionsMap.get(Module1);
        expect(mod1.providersPerApp).toEqual([]);
        expect(mod1.providersPerMod).toEqual([Provider0, Provider3, Provider4, obj1, Provider2]);
        expect(mod1.providersPerReq).toEqual([...defaultProvidersPerReq, Provider5, Provider6, Provider7]);
      });

      it(`Module2`, () => {
        const testOptionsMap = mockApp.prepareServerOptions(RootModule1);
        const mod2 = testOptionsMap.get(Module2);
        expect(mod2.providersPerApp).toEqual([]);
        expect(mod2.providersPerMod).toEqual([Provider0, Provider3, Provider4]);
        expect(mod2.providersPerReq).toEqual([...defaultProvidersPerReq, Provider5, Provider6, Provider7]);
      });

      it(`Module3`, () => {
        const testOptionsMap = mockApp.prepareServerOptions(RootModule1);
        const mod3 = testOptionsMap.get(Module3);
        expect(mod3.providersPerApp).toEqual([]);
        expect(mod3.providersPerMod).toEqual([Provider0, Provider3, Provider4]);
        expect(mod3.providersPerReq).toEqual([...defaultProvidersPerReq, Provider5, Provider6, Provider7]);
      });

      it(`Module4`, () => {
        const testOptionsMap = mockApp.prepareServerOptions(RootModule1);
        const mod4 = testOptionsMap.get(Module4);
        expect(mod4.providersPerApp).toEqual([]);
        expect(mod4.providersPerMod).toEqual([Provider0, Provider3, Provider4]);
        expect(mod4.providersPerReq).toEqual([
          ...defaultProvidersPerReq,
          Provider5,
          Provider6,
          Provider7,
          Provider8,
          Provider9
        ]);
      });

      it(`RootModule1`, () => {
        const testOptionsMap = mockApp.prepareServerOptions(RootModule1);
        const root1 = testOptionsMap.get(RootModule1);
        expect(root1.providersPerApp).toEqual([Logger]);
        expect(root1.providersPerMod).toEqual([Provider0, Provider1, Provider3, Provider4]);
        expect(root1.providersPerReq).toEqual([
          ...defaultProvidersPerReq,
          Provider5,
          Provider6,
          Provider7,
          Provider8,
          Provider9
        ]);
        // console.log(testOptionsMap);
      });
    });
  });
});
