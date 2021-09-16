import 'reflect-metadata';
import { ReflectiveInjector, Injectable, InjectionToken } from '@ts-stack/di';

import { ModuleFactory } from './module-factory';
import { Module } from './decorators/module';
import { Controller, ControllerMetadata } from './decorators/controller';
import { Route, RouteMetadata } from './decorators/route';
import { RootModule } from './decorators/root-module';
import { Logger, LoggerConfig } from './types/logger';
import { defaultProvidersPerApp } from './services/default-providers-per-app';
import { MetadataPerMod } from './types/metadata-per-mod';
import { ModuleType, ServiceProvider, NormalizedGuard, DecoratorMetadata, Extension } from './types/mix';
import { NormalizedModuleMetadata } from './models/normalized-module-metadata';
import { ModuleManager } from './services/module-manager';
import { ProvidersMetadata } from './models/providers-metadata';
import { DefaultLogger } from './services/default-logger';
import { defaultProvidersPerReq } from './services/default-providers-per-req';
import { ModConfig } from './models/mod-config';
import { Log } from './services/log';
import { Router } from './types/router';

describe('ModuleFactory', () => {
  @Injectable()
  class MockModuleFactory extends ModuleFactory {
    prefixPerMod: string;
    moduleName = 'MockModule';
    meta = new NormalizedModuleMetadata();
    injectorPerMod: ReflectiveInjector;
    appMetadataMap = new Map<ModuleType, MetadataPerMod>();
    importedProvidersPerMod: ServiceProvider[] = [];
    importedProvidersPerRou: ServiceProvider[] = [];
    importedProvidersPerReq: ServiceProvider[] = [];
    guardsPerMod: NormalizedGuard[] = [];

    exportGlobalProviders(moduleManager: ModuleManager, globalProviders: ProvidersMetadata) {
      return super.exportGlobalProviders(moduleManager, globalProviders);
    }

    quickCheckMetadata(meta: NormalizedModuleMetadata) {
      return super.quickCheckMetadata(meta);
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
  let moduleManager: ModuleManager;

  beforeEach(() => {
    mock = new MockModuleFactory(null as any, null as any);
    const config = new LoggerConfig();
    const log = new DefaultLogger(config);
    moduleManager = new ModuleManager(new Log(log));
  });

  describe('exportGlobalProviders()', () => {
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

      const globalProviders = new ProvidersMetadata();
      moduleManager.scanRootModule(AppModule);
      const msg =
        'Importing Provider1 from Module2 should includes in "providersPerMod" or "providersPerRou", or "providersPerReq", ' +
        'or in some "exports" of imported modules. Tip: "providersPerApp" no need exports, they are automatically exported.';
      expect(() => mock.exportGlobalProviders(moduleManager, globalProviders)).toThrow(msg);
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

      const globalProviders = new ProvidersMetadata();
      moduleManager.scanRootModule(AppModule);
      expect(() => mock.exportGlobalProviders(moduleManager, globalProviders)).not.toThrow();
      expect(mock.importedProvidersPerMod).toEqual([]);
      expect(mock.importedProvidersPerReq).toEqual([Provider1]);
    });

    it('merge providers from reexported modules', () => {
      class Provider1 {}
      class Provider2 {}

      @Module({
        providersPerReq: [Provider1],
        exports: [Provider1],
      })
      class Module1 {}

      @Module({
        providersPerMod: [Provider2],
        imports: [Module1],
        exports: [Provider2, Module1],
      })
      class Module2 {}

      @RootModule({
        exports: [Module2],
      })
      class AppModule {}

      const globalProviders = new ProvidersMetadata();
      moduleManager.scanRootModule(AppModule);
      expect(() => mock.exportGlobalProviders(moduleManager, globalProviders)).not.toThrow();
      expect(mock.importedProvidersPerReq).toEqual([Provider1]);
      expect(mock.importedProvidersPerMod).toEqual([Provider2]);
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

      const globalProviders = new ProvidersMetadata();
      moduleManager.scanRootModule(AppModule);
      expect(() => mock.exportGlobalProviders(moduleManager, globalProviders)).not.toThrow();
      expect(mock.importedProvidersPerMod).toEqual([Provider1, Provider2, Provider3, Provider4]);
      expect(mock.importedProvidersPerReq).toEqual([]);
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

      const globalProviders = new ProvidersMetadata();
      moduleManager.scanRootModule(AppModule);
      const msg = /Exporting providers to AppModule was failed: found collision for: Provider1/;
      expect(() => mock.exportGlobalProviders(moduleManager, globalProviders)).toThrow(msg);
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

      const globalProviders = new ProvidersMetadata();
      moduleManager.scanRootModule(AppModule);
      expect(() => mock.exportGlobalProviders(moduleManager, globalProviders)).not.toThrow();
      const providers = [{ provide: Provider1, useValue: 'one' }, Provider1, Provider1];
      expect(mock.importedProvidersPerMod).toEqual(providers);
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

      const globalProviders = new ProvidersMetadata();
      moduleManager.scanRootModule(AppModule);
      expect(() => mock.exportGlobalProviders(moduleManager, globalProviders)).not.toThrow();
    });

    xit('import dependencies of global imported providers', () => {
      class Provider1 {}

      @Injectable()
      class Provider2 {
        constructor(provider1: Provider1) {}
      }

      class Provider3 {}

      @Module({
        providersPerReq: [Provider1],
        exports: [Provider1],
      })
      class Module1 {}

      @Module({
        imports: [Module1],
        providersPerReq: [Provider2],
        exports: [Provider2],
      })
      class Module2 {}

      @RootModule({
        exports: [Module2, Provider3],
        providersPerReq: [Provider3]
      })
      class AppModule {}

      const globalProviders = new ProvidersMetadata();
      moduleManager.scanRootModule(AppModule);
      expect(() => mock.exportGlobalProviders(moduleManager, globalProviders)).not.toThrow();
      expect(mock.importedProvidersPerMod).toEqual([]);
      expect(mock.importedProvidersPerReq).toEqual([Provider2, Provider3, Provider1]);
    });
  });

  describe('quickCheckMetadata()', () => {
    it('extension without init() method', () => {
      @Module({
        extensions: [class Ext {} as any],
      })
      class Module1 {}

      moduleManager.scanModule(Module1);
      const meta = moduleManager.getMetadata(Module1);
      expect(() => mock.quickCheckMetadata(meta)).toThrow(/must be includes in/);
    });

    it('extension in providersPerReq', () => {
      class Ext implements Extension<any> {
        async init() {}
      }
      const GROUP1_EXTENSIONS = new InjectionToken('GROUP1_EXTENSIONS');
      @Module({
        providersPerApp: [{ provide: GROUP1_EXTENSIONS, useClass: Ext, multi: true }],
        providersPerReq: [{ provide: GROUP1_EXTENSIONS, useClass: Ext, multi: true }],
        extensions: [GROUP1_EXTENSIONS],
      })
      class Module1 {}

      moduleManager.scanModule(Module1);
      const meta = moduleManager.getMetadata(Module1);
      expect(() => mock.quickCheckMetadata(meta)).toThrow(/can be includes in the "providersPerApp"/);
    });

    it('extension in providersPerApp', () => {
      class Ext implements Extension<any> {
        async init() {}
      }
      const GROUP1_EXTENSIONS = new InjectionToken('GROUP1_EXTENSIONS');
      @Module({
        providersPerApp: [{ provide: GROUP1_EXTENSIONS, useClass: Ext, multi: true }],
        extensions: [GROUP1_EXTENSIONS],
      })
      class Module1 {}

      moduleManager.scanModule(Module1);
      const meta = moduleManager.getMetadata(Module1);
      expect(() => mock.quickCheckMetadata(meta)).not.toThrow();
    });

    it('extension in providersPerMod', () => {
      class Ext implements Extension<any> {
        async init() {}
      }
      const GROUP1_EXTENSIONS = new InjectionToken('GROUP1_EXTENSIONS');
      @Module({
        providersPerApp: [{ provide: GROUP1_EXTENSIONS, useClass: Ext, multi: true }],
        providersPerMod: [{ provide: GROUP1_EXTENSIONS, useClass: Ext, multi: true }],
        extensions: [GROUP1_EXTENSIONS],
      })
      class Module1 {}

      moduleManager.scanModule(Module1);
      const meta = moduleManager.getMetadata(Module1);
      expect(() => mock.quickCheckMetadata(meta)).toThrow(/can be includes in the "providersPerApp"/);
    });

    it('should throw an error, when no export and no controllers', () => {
      class Provider1 {}
      class Provider2 {}

      @Module({
        providersPerMod: [Provider1, Provider2],
      })
      class Module1 {}

      moduleManager.scanModule(Module1);
      const meta = moduleManager.getMetadata(Module1);
      expect(() => mock.quickCheckMetadata(meta)).toThrow(/Importing MockModule failed: this module should have/);
    });

    it('should works with extension only', () => {
      class Ext implements Extension<any> {
        async init() {}
      }
      const GROUP1_EXTENSIONS = new InjectionToken('GROUP1_EXTENSIONS');

      @Module({
        providersPerApp: [{ provide: GROUP1_EXTENSIONS, useClass: Ext, multi: true }],
        extensions: [GROUP1_EXTENSIONS],
      })
      class Module1 {}

      moduleManager.scanModule(Module1);
      const meta = moduleManager.getMetadata(Module1);
      expect(() => mock.quickCheckMetadata(meta)).not.toThrow();
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

      moduleManager.scanModule(Module2);
      const meta = moduleManager.getMetadata(Module2);
      expect(() => mock.quickCheckMetadata(meta)).toThrow(/Importing MockModule failed: this module should have/);
    });

    it('should not throw an error, when exports some provider', () => {
      class Provider1 {}
      class Provider2 {}

      @Module({
        exports: [Provider1],
        providersPerMod: [Provider1, Provider2],
      })
      class Module1 {}

      moduleManager.scanModule(Module1);
      const meta = moduleManager.getMetadata(Module1);
      expect(() => mock.quickCheckMetadata(meta)).not.toThrow();
    });

    it('should not throw an error, when declare some controller', () => {
      class Provider1 {}
      class Provider2 {}

      @Module({
        controllers: [Provider1],
        providersPerMod: [Provider1, Provider2],
      })
      class Module1 {}

      moduleManager.scanModule(Module1);
      const meta = moduleManager.getMetadata(Module1);
      expect(() => mock.quickCheckMetadata(meta)).not.toThrow();
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
        moduleManager.scanModule(Module3);
        mock.bootstrap(new ProvidersMetadata(), '', Module3, moduleManager);

        const mod0 = mock.appMetadataMap.get(Module0);
        const providerPerMod0: ServiceProvider = { provide: ModConfig, useValue: { prefixPerMod: '' } };
        expect(mod0?.moduleMetadata.providersPerMod).toEqual([providerPerMod0, Provider0]);
        expect(mod0?.moduleMetadata.providersPerReq).toEqual(defaultProvidersPerReq);
        expect((mod0 as any).moduleMetadata.ngMetadataName).toBe('Module');

        const mod1 = mock.appMetadataMap.get(Module1);
        const providerPerMod1: ServiceProvider = { provide: ModConfig, useValue: { prefixPerMod: '' } };
        expect(mod1?.moduleMetadata.providersPerMod).toEqual([
          providerPerMod1,
          Provider0,
          Provider1,
          Provider2,
          Provider3,
        ]);
        expect(mod1?.moduleMetadata.providersPerReq).toEqual(defaultProvidersPerReq);
        expect((mod1 as any).moduleMetadata.ngMetadataName).toBe('Module');

        const mod2 = mock.appMetadataMap.get(Module2);
        const providerPerMod2: ServiceProvider = { provide: ModConfig, useValue: { prefixPerMod: '' } };
        expect(mod2?.moduleMetadata.providersPerMod).toEqual([
          providerPerMod2,
          Provider0,
          Provider1,
          Provider2,
          Provider3,
          Provider4,
          Provider5,
          Provider6,
        ]);
        expect(mod2?.moduleMetadata.providersPerReq).toEqual([...defaultProvidersPerReq, Provider7, Provider8]);
        expect((mod2 as any).moduleMetadata.ngMetadataName).toBe('Module');

        const mod3 = mock.appMetadataMap.get(Module3);
        const providerPerMod3: ServiceProvider = { provide: ModConfig, useValue: { prefixPerMod: '' } };
        expect(mod3?.moduleMetadata.providersPerMod).toEqual([
          providerPerMod3,
          Provider0,
          Provider1,
          Provider2,
          Provider3,
          Provider5,
        ]);
        // expect(mod3.providersPerReq).toEqual([Ctrl, [], Provider8, Provider9, overriddenProvider8]);
        expect(mod3?.moduleMetadata.controllers).toEqual([Ctrl]);
        expect((mod3 as any).moduleMetadata.ngMetadataName).toBe('Module');
      });

      it('case 2', () => {
        @RootModule({
          imports: [Module3],
        })
        class Module4 {}
        const providers: ServiceProvider[] = [...defaultProvidersPerApp, { provide: Router, useValue: 'fake' }];
        const injectorPerApp = ReflectiveInjector.resolveAndCreate(providers);
        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;
        moduleManager.scanModule(Module4);
        mock.bootstrap(new ProvidersMetadata(), 'other', Module4, moduleManager);

        expect(mock.prefixPerMod).toBe('other');
        // expect(mock.router.find('GET', '/some/other').handle().controller).toBe(Ctrl);
        const providerPerMod: ServiceProvider = { provide: ModConfig, useValue: { prefixPerMod: 'other' } };
        expect(mock.meta.providersPerMod).toEqual([
          providerPerMod,
          Provider0,
          Provider1,
          Provider2,
          Provider3,
          Provider5,
        ]);
        expect(mock.meta.providersPerReq).toEqual([...defaultProvidersPerReq, Provider8]);
        expect((mock.meta as any).ngMetadataName).toBe('RootModule');
      });

      xit('importDependenciesOfImportedProviders() case 1', () => {
        class Provider1 {}

        @Injectable()
        class Provider2 {
          constructor(provider1: Provider1) {}
        }

        class Provider3 {}

        @Module({
          providersPerReq: [Provider1],
          exports: [Provider1],
        })
        class Module1 {}

        @Module({
          imports: [Module1],
          providersPerReq: [Provider2],
          exports: [Provider2],
        })
        class Module2 {}

        @Module({
          imports: [Module2],
          providersPerReq: [Provider3],
          controllers: [Ctrl],
        })
        class Module3 {}

        const injectorPerApp = ReflectiveInjector.resolveAndCreate([
          ...defaultProvidersPerApp,
          { provide: Logger, useClass: MyLogger },
        ]);

        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;
        moduleManager.scanModule(Module3);
        mock.bootstrap(new ProvidersMetadata(), '', Module3, moduleManager);

        const mod3 = mock.appMetadataMap.get(Module3);
        expect(mod3?.moduleMetadata.providersPerReq).toEqual([
          ...defaultProvidersPerReq,
          Provider2,
          Provider1,
          Provider3,
        ]);
        expect((mod3 as any).moduleMetadata.ngMetadataName).toBe('Module');
      });

      it("should throw an error regarding the provider's absence", () => {
        @Module({
          imports: [Module3],
        })
        class Module5 {}
        const injectorPerApp = ReflectiveInjector.resolveAndCreate(defaultProvidersPerApp as ServiceProvider[]);
        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;
        moduleManager.scanModule(Module5);
        const errMsg = /Importing Module5 failed: this module should have/;
        expect(() => mock.bootstrap(new ProvidersMetadata(), '', Module5, moduleManager)).toThrow(errMsg);
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
        const injectorPerApp = ReflectiveInjector.resolveAndCreate(defaultProvidersPerApp as ServiceProvider[]);
        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;
        moduleManager.scanModule(Module7);
        const errMsg =
          'Importing Provider2 from Module6 ' +
          'should includes in "providersPerMod" or "providersPerRou", or "providersPerReq", ' +
          'or in some "exports" of imported modules. ' +
          'Tip: "providersPerApp" no need exports, they are automatically exported.';
        expect(() => mock.bootstrap(new ProvidersMetadata(), '', Module7, moduleManager)).toThrow(errMsg);
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

        moduleManager.scanModule(AppModule);
        const msg = /Exporting providers to Module3 was failed: found collision for: Provider1/;
        expect(() => mock.bootstrap(new ProvidersMetadata(), '', AppModule, moduleManager)).toThrow(msg);
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

        moduleManager.scanRootModule(AppModule);
        expect(() => mock.bootstrap(new ProvidersMetadata(), '', AppModule, moduleManager)).not.toThrow();
      });
    });
  });

  describe('getControllersMetadata()', () => {
    it('without @Controller decorator', () => {
      mock.meta.controllers = [class Controller1 {}];
      expect(() => mock.getControllersMetadata()).toThrowError(/Collecting controller's metadata failed: class/);
    });

    it('controller with multiple @Route on single method', () => {
      const ctrlMetadata = { providersPerReq: [] } as ControllerMetadata;
      @Controller(ctrlMetadata)
      class Controller1 {
        @Route('GET', 'url1')
        method1() {}

        @Route('POST', 'url2')
        @Route('GET', 'url3')
        method2() {}
      }
      mock.meta.controllers = [Controller1];
      const metadata = mock.getControllersMetadata();
      const routeMeta2: RouteMetadata = {
        httpMethod: 'POST',
        path: 'url2',
        guards: [],
      };
      const routeMeta3: RouteMetadata = {
        httpMethod: 'GET',
        path: 'url3',
        guards: [],
      };
      const methods: { [methodName: string]: DecoratorMetadata<RouteMetadata>[] } = {
        method1: [
          {
            otherDecorators: [],
            value: {
              httpMethod: 'GET',
              path: 'url1',
              guards: [],
            },
          },
        ],
        method2: [
          {
            otherDecorators: [routeMeta3],
            value: routeMeta2,
          },
          {
            otherDecorators: [routeMeta2],
            value: routeMeta3,
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
