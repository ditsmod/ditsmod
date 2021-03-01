import 'reflect-metadata';
import { ReflectiveInjector, Injectable, Provider } from '@ts-stack/di';
import { DefaultRouter } from '@ts-stack/router';

import { ModuleFactory } from './module-factory';
import { Module, ModuleMetadata, ModuleType, ProvidersMetadata, defaultProvidersPerReq } from './decorators/module';
import { Controller, ControllerDecorator, MethodDecoratorObject } from './decorators/controller';
import { Route, RouteMetadata } from './decorators/route';
import { NormalizedGuard, Router } from './types/router';
import { defaultProvidersPerApp, RootModule } from './decorators/root-module';
import { Logger } from './types/logger';
import { Extension, ExtensionMetadata } from './types/types';
import { Counter } from './services/counter';

describe('ModuleFactory', () => {
  (defaultProvidersPerApp as Provider[]).push({ provide: Router, useClass: DefaultRouter });

  @Injectable()
  class MockModuleFactory extends ModuleFactory {
    prefixPerMod: string;
    moduleName = 'MockModule';
    opts = new ModuleMetadata();
    injectorPerMod: ReflectiveInjector;
    extensionMetadataMap = new Map<ModuleType, ExtensionMetadata>();
    allExportedProvidersPerMod: Provider[] = [];
    allExportedProvidersPerReq: Provider[] = [];
    guardsPerMod: NormalizedGuard[] = [];

    quickCheckMetadata(moduleMetadata: ModuleMetadata) {
      return super.quickCheckMetadata(moduleMetadata);
    }

    normalizeMetadata(mod: ModuleType) {
      return super.normalizeMetadata(mod);
    }

    getControllersMetadata() {
      return super.getControllersMetadata();
    }
  }

  class MyLogger extends Logger {
    debug = (...args: any[]): any => {
      console.log(`debug:\n ${'*'.repeat(50)}\n`, ...args);
    };
  }

  let mock: MockModuleFactory;

  beforeEach(() => {
    const counter = new Counter();
    mock = new MockModuleFactory(null, counter);
  });

  describe('importGlobalProviders()', () => {
    it('forbidden reexports providers', () => {
      class Provider1 {}

      @Module({
        providersPerReq: [Provider1],
      })
      class Module1 {}

      @Module({
        imports: [Module1],
        exports: [Provider1],
      })
      class Module2 {}

      @RootModule({
        exports: [Module2],
      })
      class AppModule {}

      const metadata = new ModuleMetadata();
      const msg = /Exported Provider1 from Module2 should includes in/;
      expect(() => mock.importGlobalProviders(AppModule, metadata)).toThrow(msg);
    });

    it('allow reexports module', () => {
      class Provider1 {}

      @Module({
        providersPerReq: [Provider1],
        exports: [Provider1],
      })
      class Module1 {}

      @Module({
        imports: [Module1],
        exports: [Module1],
      })
      class Module2 {}

      @RootModule({
        exports: [Module2],
      })
      class AppModule {}

      const metadata = new ModuleMetadata();
      expect(() => mock.importGlobalProviders(AppModule, metadata)).not.toThrow();
      expect(mock.allExportedProvidersPerMod).toEqual([]);
      expect(mock.allExportedProvidersPerReq).toEqual([Provider1]);
    });

    it('merge providers from reexported modules', () => {
      class Provider1 {}
      class Provider2 {}

      @Module({
        providersPerReq: [Provider2],
        exports: [Provider2],
      })
      class Module1 {}

      @Module({
        providersPerMod: [Provider1],
        imports: [Module1],
        exports: [Provider1, Module1],
      })
      class Module2 {}

      @RootModule({
        exports: [Module2],
      })
      class AppModule {}

      const metadata = new ModuleMetadata();
      expect(() => mock.importGlobalProviders(AppModule, metadata)).not.toThrow();
      expect(mock.allExportedProvidersPerMod).toEqual([Provider1]);
      expect(mock.allExportedProvidersPerReq).toEqual([Provider2]);
    });

    it('exported providers order', () => {
      class Provider1 {}
      class Provider2 {}
      class Provider3 {}
      class Provider4 {}

      @Module({
        providersPerMod: [Provider1, Provider2],
        exports: [Provider1, Provider2],
      })
      class Module1 {}

      @Module({
        imports: [Module1],
        providersPerMod: [Provider3, Provider4],
        exports: [Module1, Provider3, Provider4],
      })
      class Module2 {}

      @RootModule({
        exports: [Module2],
      })
      class AppModule {}

      const metadata = new ModuleMetadata();
      expect(() => mock.importGlobalProviders(AppModule, metadata)).not.toThrow();
      expect(mock.allExportedProvidersPerMod).toEqual([Provider1, Provider2, Provider3, Provider4]);
      expect(mock.allExportedProvidersPerReq).toEqual([]);
    });

    it('collision with exported providers', () => {
      class Provider1 {}

      @Module({
        providersPerMod: [Provider1],
        exports: [{ provide: Provider1, useValue: 'one' }],
      })
      class Module1 {}

      @Module({
        imports: [Module1],
        providersPerMod: [Provider1],
        exports: [Module1, Provider1],
      })
      class Module2 {}

      @RootModule({
        exports: [Module2],
      })
      class AppModule {}

      const metadata = new ModuleMetadata();
      const msg = /Exporting providers to AppModule was failed: found collision for: Provider1/;
      expect(() => mock.importGlobalProviders(AppModule, metadata)).toThrow(msg);
    });

    it('collision with exported provider, but they are redeclared in root module', () => {
      class Provider1 {}

      @Module({
        providersPerMod: [Provider1],
        exports: [{ provide: Provider1, useValue: 'one' }],
      })
      class Module1 {}

      @Module({
        imports: [Module1],
        providersPerMod: [Provider1],
        exports: [Module1, Provider1],
      })
      class Module2 {}

      @RootModule({
        exports: [Module2, Provider1],
        providersPerMod: [Provider1],
      })
      class AppModule {}

      const metadata = new ModuleMetadata();
      expect(() => mock.importGlobalProviders(AppModule, metadata)).not.toThrow();
      const providers = [{ provide: Provider1, useValue: 'one' }, Provider1, Provider1];
      expect(mock.allExportedProvidersPerMod).toEqual(providers);
    });

    it('identical duplicates but not collision with exported providers', () => {
      class Provider1 {}

      @Module({
        providersPerMod: [Provider1],
        exports: [{ provide: Provider1, useValue: 'one' }],
      })
      class Module1 {}

      @Module({
        imports: [Module1],
        providersPerMod: [Provider1],
        exports: [Module1, { provide: Provider1, useValue: 'one' }],
      })
      class Module2 {}

      @RootModule({
        exports: [Module2],
      })
      class AppModule {}

      const metadata = new ModuleMetadata();
      expect(() => mock.importGlobalProviders(AppModule, metadata)).not.toThrow();
    });
  });

  describe('normalizeMetadata()', () => {
    it('should set default metatada', () => {
      @Module()
      class AppModule {}
      const metadata = mock.normalizeMetadata(AppModule);
      expect(metadata.controllers).toEqual([]);
      expect(metadata.exports).toEqual([]);
      expect(metadata.imports).toEqual([]);
      expect(metadata.providersPerMod).toEqual([]);
      expect(metadata.providersPerReq).toEqual([]);
      expect((metadata as any).ngMetadataName).toBe('Module');
    });

    it('should merge default metatada with AppModule metadata', () => {
      class Provider1 {}
      class Provider2 {}
      class Controller1 {}

      @Module({
        controllers: [Controller1],
        providersPerReq: [Provider1],
        providersPerMod: [Provider2],
      })
      class AppModule {}
      const metadata = mock.normalizeMetadata(AppModule);
      expect(metadata.controllers).toEqual([Controller1]);
      expect(metadata.exports).toEqual([]);
      expect(metadata.imports).toEqual([]);
      expect(metadata.providersPerMod).toEqual([Provider2]);
      expect(metadata.providersPerReq).toEqual([Provider1]);
    });

    it('Provider1 should not have metatada', () => {
      class Module1 {}
      const msg = 'Module build failed: module "Module1" does not have the "@Module()" decorator';
      expect(() => mock.normalizeMetadata(Module1)).toThrowError(msg);
    });
  });

  describe('quickCheckMetadata()', () => {
    it('extension without init() method', () => {
      @Module({
        extensions: [class Ext {} as any],
      })
      class Module1 {}

      const moduleMetadata = mock.normalizeMetadata(Module1);
      expect(() => mock.quickCheckMetadata(moduleMetadata)).toThrow(/must be a class with init/);
    });

    it('extension in providersPerReq', () => {
      class Ext implements Extension {
        init() {}
      }
      @Module({
        providersPerReq: [Ext],
        extensions: [Ext as any],
      })
      class Module1 {}

      const moduleMetadata = mock.normalizeMetadata(Module1);
      expect(() => mock.quickCheckMetadata(moduleMetadata)).toThrow(/cannot be includes in the "providersPerReq"/);
    });

    it('extension in providersPerApp', () => {
      class Ext implements Extension {
        init() {}
      }
      @Module({
        providersPerApp: [Ext],
        extensions: [Ext],
      })
      class Module1 {}

      const moduleMetadata = mock.normalizeMetadata(Module1);
      expect(() => mock.quickCheckMetadata(moduleMetadata)).not.toThrow();
    });

    it('extension in providersPerMod', () => {
      class Ext implements Extension {
        init() {}
      }
      @Module({
        providersPerMod: [Ext],
        extensions: [Ext],
      })
      class Module1 {}

      const moduleMetadata = mock.normalizeMetadata(Module1);
      expect(() => mock.quickCheckMetadata(moduleMetadata)).not.toThrow();
    });

    it('should throw an error, when no export and no controllers', () => {
      class Provider1 {}
      class Provider2 {}

      @Module({
        providersPerMod: [Provider1, Provider2],
      })
      class Module1 {}

      const moduleMetadata = mock.normalizeMetadata(Module1);
      expect(() => mock.quickCheckMetadata(moduleMetadata)).toThrow(
        /Importing MockModule failed: this module should have/
      );
    });

    it('should throw an error, during imports module without export and without controllers', () => {
      class Provider1 {}
      class Provider2 {}

      @Module({
        providersPerMod: [Provider1, Provider2],
      })
      class Module1 {}

      @Module({
        imports: [Module1],
      })
      class Module2 {}

      const moduleMetadata = mock.normalizeMetadata(Module2);
      expect(() => mock.quickCheckMetadata(moduleMetadata)).toThrow(
        /Importing MockModule failed: this module should have/
      );
    });

    it('should not throw an error, when export some provider', () => {
      class Provider1 {}
      class Provider2 {}

      @Module({
        exports: [Provider1],
        providersPerMod: [Provider1, Provider2],
      })
      class Module1 {}

      const moduleMetadata = mock.normalizeMetadata(Module1);
      expect(() => mock.quickCheckMetadata(moduleMetadata)).not.toThrow();
    });

    it('should not throw an error, when declare some controller', () => {
      class Provider1 {}
      class Provider2 {}

      @Module({
        controllers: [Provider1],
        providersPerMod: [Provider1, Provider2],
      })
      class Module1 {}

      const moduleMetadata = mock.normalizeMetadata(Module1);
      expect(() => mock.quickCheckMetadata(moduleMetadata)).not.toThrow();
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
    const overriddenProvider8 = { provide: Provider8, useValue: 'overridden' };
    class Provider9 {}

    describe('exporting providers order', () => {
      @Module({
        exports: [Provider0],
        providersPerMod: [Provider0],
      })
      class Module0 {}

      @Module({
        imports: [Module0],
        exports: [Module0, Provider1, Provider2, Provider3],
        providersPerMod: [Provider1, Provider2, Provider3],
      })
      class Module1 {}

      @Module({
        imports: [Module1],
        exports: [Module1, Provider5, Provider8],
        providersPerMod: [Provider4, Provider5, Provider6],
        providersPerReq: [Provider7, Provider8],
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
        providersPerReq: [Provider9, overriddenProvider8],
        controllers: [Ctrl],
      })
      class Module3 {}

      it('case 1', () => {
        const injectorPerApp = ReflectiveInjector.resolveAndCreate([
          ...defaultProvidersPerApp,
          { provide: Logger, useClass: MyLogger },
        ]);

        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;
        mock.bootstrap(new ProvidersMetadata(), '', Module3);

        const mod0 = mock.extensionMetadataMap.get(Module0);
        expect(mod0.moduleMetadata.providersPerMod).toEqual([Provider0]);
        expect(mod0.moduleMetadata.providersPerReq).toEqual([]);
        expect((mod0 as any).moduleMetadata.ngMetadataName).toBe('Module');

        const mod1 = mock.extensionMetadataMap.get(Module1);
        expect(mod1.moduleMetadata.providersPerMod).toEqual([Provider0, Provider1, Provider2, Provider3]);
        expect(mod1.moduleMetadata.providersPerReq).toEqual([]);
        expect((mod1 as any).moduleMetadata.ngMetadataName).toBe('Module');

        const mod2 = mock.extensionMetadataMap.get(Module2);
        expect(mod2.moduleMetadata.providersPerMod).toEqual([
          Provider0,
          Provider1,
          Provider2,
          Provider3,
          Provider4,
          Provider5,
          Provider6,
        ]);
        expect(mod2.moduleMetadata.providersPerReq).toEqual([Provider7, Provider8]);
        expect((mod2 as any).moduleMetadata.ngMetadataName).toBe('Module');

        const mod3 = mock.extensionMetadataMap.get(Module3);
        expect(mod3.moduleMetadata.providersPerMod).toEqual([Provider0, Provider1, Provider2, Provider3, Provider5]);
        // expect(mod3.providersPerReq).toEqual([Ctrl, [], Provider8, Provider9, overriddenProvider8]);
        expect(mod3.moduleMetadata.controllers).toEqual([Ctrl]);
        expect((mod3 as any).moduleMetadata.ngMetadataName).toBe('Module');
      });

      it('case 2', () => {
        @RootModule({
          imports: [Module3],
        })
        class Module4 {}
        const providers: Provider[] = [...defaultProvidersPerApp, { provide: Router, useClass: DefaultRouter }];
        const injectorPerApp = ReflectiveInjector.resolveAndCreate(providers);
        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;
        mock.bootstrap(new ProvidersMetadata(), 'other', Module4);

        expect(mock.prefixPerMod).toBe('other');
        // expect(mock.router.find('GET', '/some/other').handle().controller).toBe(Ctrl);
        expect(mock.opts.providersPerMod).toEqual([Provider0, Provider1, Provider2, Provider3, Provider5]);
        expect(mock.opts.providersPerReq).toEqual([...defaultProvidersPerReq, Provider8]);
        expect((mock.opts as any).ngMetadataName).toBe('RootModule');
      });

      it("should throw an error regarding the provider's absence", () => {
        @Module({
          imports: [Module3],
        })
        class Module5 {}
        const injectorPerApp = ReflectiveInjector.resolveAndCreate(defaultProvidersPerApp as Provider[]);
        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;
        const errMsg = /Importing Module5 failed: this module should have/;
        expect(() => mock.bootstrap(new ProvidersMetadata(), '', Module5)).toThrow(errMsg);
      });

      it('should throw an error about not proper provider exports', () => {
        @Module({
          exports: [Provider1, Provider2, Provider3],
          providersPerMod: [Provider1, Provider3],
        })
        class Module6 {}

        @RootModule({
          imports: [Module6],
        })
        class Module7 {}
        const injectorPerApp = ReflectiveInjector.resolveAndCreate(defaultProvidersPerApp as Provider[]);
        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;
        const errMsg =
          'Exported Provider2 from Module6 ' +
          'should includes in "providersPerMod" or "providersPerReq", ' +
          'or in some "exports" of imported modules. ' +
          'Tip: "providersPerApp" no need exports, they are automatically exported.';
        expect(() => mock.bootstrap(new ProvidersMetadata(), '', Module7)).toThrow(errMsg);
      });
    });

    describe('Providers collisions', () => {
      it('for non-root module', () => {
        const injectorPerApp = ReflectiveInjector.resolveAndCreate([
          ...defaultProvidersPerApp,
          { provide: Logger, useClass: MyLogger },
        ]);

        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;

        @Controller()
        class SomeController {}

        @Module({
          providersPerMod: [Provider1],
          exports: [Provider1],
        })
        class Module1 {}

        @Module({
          providersPerMod: [Provider1],
          exports: [{ provide: Provider1, useValue: 'one' }],
        })
        class Module2 {}

        @Module({
          imports: [Module1, Module2],
          controllers: [SomeController],
        })
        class Module3 {}

        @RootModule({
          imports: [Module3],
        })
        class AppModule {}

        const msg = /Exporting providers to Module3 was failed: found collision for: Provider1/;
        expect(() => mock.bootstrap(new ProvidersMetadata(), '', AppModule)).toThrow(msg);
      });

      it('resolved collision for non-root module', () => {
        const injectorPerApp = ReflectiveInjector.resolveAndCreate([
          ...defaultProvidersPerApp,
          { provide: Logger, useClass: MyLogger },
        ]);

        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;

        @Controller()
        class SomeController {}

        @Module({
          providersPerMod: [Provider1],
          exports: [Provider1],
        })
        class Module1 {}

        @Module({
          providersPerMod: [Provider1],
          exports: [{ provide: Provider1, useValue: 'one' }],
        })
        class Module2 {}

        @Module({
          imports: [Module1, Module2],
          controllers: [SomeController],
          providersPerMod: [{ provide: Provider1, useValue: 'two' }],
        })
        class Module3 {}

        @RootModule({
          imports: [Module3],
        })
        class AppModule {}

        expect(() => mock.bootstrap(new ProvidersMetadata(), '', AppModule)).not.toThrow();
      });
    });
  });

  describe('getControllersMetadata()', () => {
    it('without @Controller decorator', () => {
      mock.opts.controllers = [class Controller1 {}];
      expect(() => mock.getControllersMetadata()).toThrowError(/Collecting controller's metadata failed: class/);
    });

    it('controller with multiple @Route on single method', () => {
      const ctrlMetadata = { providersPerReq: [] } as ControllerDecorator;
      @Controller(ctrlMetadata)
      class Controller1 {
        @Route('GET', 'url1')
        method1() {}

        @Route('POST', 'url2')
        @Route('GET', 'url3')
        method2() {}
      }
      mock.opts.controllers = [Controller1];
      const metadata = mock.getControllersMetadata();
      const methods: { [methodName: string]: MethodDecoratorObject<RouteMetadata>[] } = {
        method1: [
          {
            methodId: 1,
            decoratorId: 1,
            value: {
              httpMethod: 'GET',
              path: 'url1',
              guards: [],
            },
          },
        ],
        method2: [
          {
            methodId: 2,
            decoratorId: 2,
            value: {
              httpMethod: 'POST',
              path: 'url2',
              guards: [],
            },
          },
          {
            methodId: 2,
            decoratorId: 3,
            value: {
              httpMethod: 'GET',
              path: 'url3',
              guards: [],
            },
          },
        ],
      };
      expect(metadata.length).toBe(1);
      expect(metadata[0].controller === Controller1).toBe(true);
      expect(metadata[0].ctrlDecorValues).toEqual([ctrlMetadata]);
      expect(metadata[0].methods).toEqual(methods);
    });
  });
});
