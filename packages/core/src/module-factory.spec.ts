import 'reflect-metadata';
import { Injectable, ReflectiveInjector } from '@ts-stack/di';

import { Controller, ControllerMetadata } from './decorators/controller';
import { Module } from './decorators/module';
import { RootModule } from './decorators/root-module';
import { Route, RouteMetadata } from './decorators/route';
import { ModConfig } from './models/mod-config';
import { NormalizedModuleMetadata } from './models/normalized-module-metadata';
import { ProvidersMetadata } from './models/providers-metadata';
import { ModuleFactory } from './module-factory';
import { DefaultLogger } from './services/default-logger';
import { defaultProvidersPerApp } from './services/default-providers-per-app';
import { LogManager } from './services/log-manager';
import { LogMediator } from './services/log-mediator';
import { ModuleManager } from './services/module-manager';
import { Logger, LoggerConfig } from './types/logger';
import { ImportObj, ImportsMap, MetadataPerMod1 } from './types/metadata-per-mod';
import { DecoratorMetadata, ExtensionsProvider, ModuleType, NormalizedGuard, ServiceProvider } from './types/mix';
import { Router } from './types/router';

describe('ModuleFactory', () => {
  @Injectable()
  class MockModuleFactory extends ModuleFactory {
    injectorPerMod: ReflectiveInjector;
    override prefixPerMod: string;
    override moduleName = 'MockModule';
    override meta = new NormalizedModuleMetadata();
    override appMetadataMap = new Map<ModuleType, MetadataPerMod1>();
    override importedProvidersPerMod: ServiceProvider[] = [];
    override importedProvidersPerRou: ServiceProvider[] = [];
    override importedProvidersPerReq: ServiceProvider[] = [];
    override importedPerMod = new Map<any, ImportObj>();
    override importedPerRou = new Map<any, ImportObj>();
    override importedPerReq = new Map<any, ImportObj>();
    override importedExtensions = new Map<any, ImportObj<ExtensionsProvider>>();
    override guardsPerMod: NormalizedGuard[] = [];

    override exportGlobalProviders(moduleManager: ModuleManager, globalProviders: ProvidersMetadata & ImportsMap) {
      return super.exportGlobalProviders(moduleManager, globalProviders);
    }

    override getControllersMetadata() {
      return super.getControllersMetadata();
    }
  }

  function getImportedTokens(map: Map<any, ImportObj<ServiceProvider>> | undefined) {
    return [...(map || [])].map(([key]) => key);
  }

  class MyLogger extends Logger {
    override debug = (...args: any[]): any => {
      console.log(`debug:\n ${'*'.repeat(50)}\n`, ...args);
    };
  }

  let mock: MockModuleFactory;
  let moduleManager: ModuleManager;

  beforeEach(() => {
    const injectorPerApp = ReflectiveInjector.resolveAndCreate([
      ...defaultProvidersPerApp,
      { provide: Logger, useClass: MyLogger },
      { provide: LogManager, useValue: new LogManager() },
      MockModuleFactory,
    ]);
    mock = injectorPerApp.get(MockModuleFactory);
    const config = new LoggerConfig();
    const logger = new DefaultLogger(config);
    const logManager = new LogManager();
    moduleManager = new ModuleManager(new LogMediator(logManager, logger));
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
        providersPerApp: [{ provide: LogManager, useValue: new LogManager() }],
      })
      class AppModule {}

      const msg = `Module2 failed: if "Provider1" is a provider,`;
      expect(() => moduleManager.scanRootModule(AppModule)).toThrow(msg);
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
        providersPerApp: [{ provide: LogManager, useValue: new LogManager() }],
      })
      class AppModule {}

      const providers = new ProvidersMetadata();
      const importedProviders = new ImportsMap();
      const globalProviders: ProvidersMetadata & ImportsMap = { ...providers, ...importedProviders };
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
        providersPerApp: [{ provide: LogManager, useValue: new LogManager() }],
      })
      class AppModule {}

      const providers = new ProvidersMetadata();
      const importedProviders = new ImportsMap();
      const globalProviders: ProvidersMetadata & ImportsMap = { ...providers, ...importedProviders };
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
        providersPerApp: [{ provide: LogManager, useValue: new LogManager() }],
      })
      class AppModule {}

      const providers = new ProvidersMetadata();
      const importedProviders = new ImportsMap();
      const globalProviders: ProvidersMetadata & ImportsMap = { ...providers, ...importedProviders };
      moduleManager.scanRootModule(AppModule);
      expect(() => mock.exportGlobalProviders(moduleManager, globalProviders)).not.toThrow();
      expect(mock.importedProvidersPerMod).toEqual([Provider1, Provider2, Provider3, Provider4]);
      expect(mock.importedProvidersPerReq).toEqual([]);
    });

    it('collision with exported providers', () => {
      class Provider1 {}

      @Module({
        providersPerMod: [{ provide: Provider1, useValue: 'one' }],
        exports: [Provider1],
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
        providersPerApp: [{ provide: LogManager, useValue: new LogManager() }],
      })
      class AppModule {}

      const providers = new ProvidersMetadata();
      const importedProviders = new ImportsMap();
      const globalProviders: ProvidersMetadata & ImportsMap = { ...providers, ...importedProviders };
      moduleManager.scanRootModule(AppModule);
      const msg = `AppModule failed: exports from several modules causes collision with Provider1.`;
      expect(() => mock.exportGlobalProviders(moduleManager, globalProviders)).toThrow(msg);
    });

    it('collision with exported provider, but they are redeclared in root module', () => {
      class Provider1 {}

      @Module({
        providersPerMod: [{ provide: Provider1, useValue: 'one' }],
        exports: [Provider1],
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
        providersPerApp: [{ provide: LogManager, useValue: new LogManager() }],
      })
      class AppModule {}

      const providers0 = new ProvidersMetadata();
      const importedProviders = new ImportsMap();
      const globalProviders: ProvidersMetadata & ImportsMap = { ...providers0, ...importedProviders };
      moduleManager.scanRootModule(AppModule);
      expect(() => mock.exportGlobalProviders(moduleManager, globalProviders)).not.toThrow();
      const providers = [{ provide: Provider1, useValue: 'one' }, Provider1, Provider1];
      expect(mock.importedProvidersPerMod).toEqual(providers);
    });

    it('identical duplicates but not collision with exported providers', () => {
      class Provider1 {}

      @Module({
        providersPerMod: [{ provide: Provider1, useValue: 'one' }],
        exports: [Provider1],
      })
      class Module1 {}

      @Module({
        imports: [Module1],
        providersPerMod: [{ provide: Provider1, useValue: 'one' }],
        exports: [Module1, Provider1],
      })
      class Module2 {}

      @RootModule({
        exports: [Module2],
        providersPerApp: [{ provide: LogManager, useValue: new LogManager() }],
      })
      class AppModule {}

      const providers = new ProvidersMetadata();
      const importedProviders = new ImportsMap();
      const globalProviders: ProvidersMetadata & ImportsMap = { ...providers, ...importedProviders };
      moduleManager.scanRootModule(AppModule);
      expect(() => mock.exportGlobalProviders(moduleManager, globalProviders)).not.toThrow();
    });

    it('import dependencies of global imported providers', () => {
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
        exports: [Provider2, Module1],
      })
      class Module2 {}

      @RootModule({
        exports: [Module2, Provider3],
        providersPerReq: [Provider3],
        providersPerApp: [{ provide: LogManager, useValue: new LogManager() }],
      })
      class AppModule {}

      const providers = new ProvidersMetadata();
      const importedProviders = new ImportsMap();
      const globalProviders: ProvidersMetadata & ImportsMap = { ...providers, ...importedProviders };
      moduleManager.scanRootModule(AppModule);
      expect(() => mock.exportGlobalProviders(moduleManager, globalProviders)).not.toThrow();
      expect(mock.importedProvidersPerMod).toEqual([]);
      expect(mock.importedProvidersPerReq).toEqual([Provider1, Provider2, Provider3]);

      const importObj = new ImportObj();
      importObj.module = Module1;
      importObj.providers = [Provider1];
      expect(mock?.importedPerReq.get(Provider1)).toEqual(importObj);
      importObj.module = Module2;
      importObj.providers = [Provider2];
      expect(mock?.importedPerReq.get(Provider2)).toEqual(importObj);
      importObj.module = AppModule;
      importObj.providers = [Provider3];
      expect(mock?.importedPerReq.get(Provider3)).toEqual(importObj);
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

      it('case 0', () => {
        @Module({ controllers: [Ctrl] })
        class Module1 {}

        @RootModule({
          imports: [Module1],
        })
        class AppModule {}

        const meta = moduleManager.scanRootModule(AppModule);
        expect(meta.providersPerReq).toEqual(meta.exportsProvidersPerReq);
        expect(meta.providersPerReq).toEqual([]);

        const providers = new ProvidersMetadata();
        const importedProviders = new ImportsMap();
        const globalProviders: ProvidersMetadata & ImportsMap = { ...providers, ...importedProviders };
        mock.bootstrap(globalProviders, '', AppModule, moduleManager, new Set());
        expect(mock.appMetadataMap.get(AppModule)?.meta.exportsProvidersPerReq).toEqual([]);
      });

      it('case 1', () => {
        const injectorPerApp = ReflectiveInjector.resolveAndCreate([
          ...defaultProvidersPerApp,
          { provide: Logger, useClass: MyLogger },
          { provide: LogManager, useValue: new LogManager() },
        ]);

        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;
        moduleManager.scanModule(Module3);
        const providers = new ProvidersMetadata();
        const importedProviders = new ImportsMap();
        const globalProviders: ProvidersMetadata & ImportsMap = { ...providers, ...importedProviders };
        mock.bootstrap(globalProviders, '', Module3, moduleManager, new Set());

        const mod0 = mock.appMetadataMap.get(Module0);
        const providerPerMod0: ServiceProvider = { provide: ModConfig, useValue: { prefixPerMod: '' } };
        expect(mod0?.meta.providersPerMod).toEqual([providerPerMod0, Provider0]);
        expect(mod0?.meta.providersPerReq).toEqual([]);
        expect(mod0?.meta.ngMetadataName).toBe('Module');

        const mod1 = mock.appMetadataMap.get(Module1);
        const providerPerMod1: ServiceProvider = { provide: ModConfig, useValue: { prefixPerMod: '' } };
        expect(mod1?.meta.providersPerMod).toEqual([providerPerMod1, Provider1, Provider2, Provider3]);

        const tokensPerMod = getImportedTokens(mod1?.importedTokensMap.perMod);
        expect(tokensPerMod).toEqual([Provider0]);

        expect(mod1?.meta.providersPerReq).toEqual([]);
        expect(mod1?.meta.ngMetadataName).toBe('Module');

        const mod2 = mock.appMetadataMap.get(Module2);
        const providerPerMod2: ServiceProvider = { provide: ModConfig, useValue: { prefixPerMod: '' } };
        expect(mod2?.meta.providersPerMod).toEqual([providerPerMod2, Provider4, Provider5, Provider6]);

        const tokensPerMod2 = getImportedTokens(mod2?.importedTokensMap.perMod);
        expect(tokensPerMod2).toEqual([Provider0, Provider1, Provider2, Provider3]);

        expect(mod2?.meta.providersPerReq).toEqual([Provider7, Provider8]);
        expect(mod2?.meta.ngMetadataName).toBe('Module');

        const mod3 = mock.appMetadataMap.get(Module3);
        const providerPerMod3: ServiceProvider = { provide: ModConfig, useValue: { prefixPerMod: '' } };
        expect(mod3?.meta.providersPerMod).toEqual([providerPerMod3]);

        // expect(mod3.providersPerReq).toEqual([Ctrl, [], Provider8, Provider9, overriddenProvider8]);
        expect(mod3?.meta.controllers).toEqual([Ctrl]);
        expect(mod3?.meta.ngMetadataName).toBe('Module');
      });

      it('case 2', () => {
        @RootModule({
          imports: [Module3],
          providersPerApp: [{ provide: LogManager, useValue: new LogManager() }],
        })
        class Module4 {}
        const providers: ServiceProvider[] = [
          ...defaultProvidersPerApp,
          { provide: Router, useValue: 'fake' },
          { provide: LogManager, useValue: new LogManager() },
        ];
        const injectorPerApp = ReflectiveInjector.resolveAndCreate(providers);
        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;
        moduleManager.scanModule(Module4);
        const providers0 = new ProvidersMetadata();
        const importsMap = new ImportsMap();
        const globalProviders: ProvidersMetadata & ImportsMap = { ...providers0, ...importsMap };
        mock.bootstrap(globalProviders, 'other', Module4, moduleManager, new Set());

        expect(mock.prefixPerMod).toBe('other');
        // expect(mock.router.find('GET', '/some/other').handle().controller).toBe(Ctrl);
        const providerPerMod: ServiceProvider = { provide: ModConfig, useValue: { prefixPerMod: 'other' } };
        expect(mock.meta.providersPerMod).toEqual([providerPerMod]);

        expect(mock?.importedPerMod).toBeDefined();
        const importObj = new ImportObj();
        importObj.module = Module0;
        importObj.providers = [Provider0];
        expect(mock?.importedPerMod.get(Provider0)).toEqual(importObj);

        importObj.module = Module1;
        importObj.providers = [Provider1];
        expect(mock?.importedPerMod.get(Provider1)).toEqual(importObj);
        importObj.providers = [Provider2];
        expect(mock?.importedPerMod.get(Provider2)).toEqual(importObj);
        importObj.providers = [Provider3];
        expect(mock?.importedPerMod.get(Provider3)).toEqual(importObj);

        importObj.module = Module2;
        importObj.providers = [Provider5];
        expect(mock?.importedPerMod.get(Provider5)).toEqual(importObj);

        expect(mock.meta.providersPerReq).toEqual([]);

        importObj.module = Module2;
        importObj.providers = [Provider8];
        expect(mock?.importedPerReq.get(Provider8)).toEqual(importObj);
        expect((mock.meta as any).ngMetadataName).toBe('RootModule');
      });

      it('importDependenciesOfImportedProviders() case 1', () => {
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
          LogManager,
        ]);

        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;
        moduleManager.scanModule(Module3);
        const providers0 = new ProvidersMetadata();
        const importsMap = new ImportsMap();
        const globalProviders: ProvidersMetadata & ImportsMap = { ...providers0, ...importsMap };
        mock.bootstrap(globalProviders, '', Module3, moduleManager, new Set());

        const mod3 = mock.appMetadataMap.get(Module3);
        expect(mod3?.meta.providersPerReq).toEqual([Provider3]);

        expect(mock?.importedPerReq).toBeDefined();
        const importObj = new ImportObj();
        importObj.module = Module2;
        importObj.providers = [Provider2];
        expect(mock?.importedPerReq.get(Provider2)).toEqual(importObj);
        expect(mod3?.meta.ngMetadataName).toBe('Module');
      });

      it('should throw an error about not proper provider exports', () => {
        @Module({
          exports: [Provider1, Provider2, Provider3],
          providersPerMod: [Provider1, Provider3],
        })
        class Module6 {}

        @RootModule({
          imports: [Module6],
          providersPerApp: [{ provide: LogManager, useValue: new LogManager() }],
        })
        class Module7 {}
        const providers = [
          ...defaultProvidersPerApp,
          { provide: LogManager, useValue: new LogManager() },
        ] as ServiceProvider[];
        const injectorPerApp = ReflectiveInjector.resolveAndCreate(providers);
        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;
        const msg = `Module6 failed: if "Provider2" is a provider`;
        expect(() => moduleManager.scanModule(Module7)).toThrow(msg);
      });
    });

    describe('Providers collisions', () => {
      it('for non-root module', () => {
        const injectorPerApp = ReflectiveInjector.resolveAndCreate([
          ...defaultProvidersPerApp,
          { provide: Logger, useClass: MyLogger },
          { provide: LogManager, useValue: new LogManager() },
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
          providersPerMod: [{ provide: Provider1, useValue: 'one' }],
          exports: [Provider1],
        })
        class Module2 {}

        @Module({
          imports: [Module1, Module2],
          controllers: [SomeController],
        })
        class Module3 {}

        @RootModule({
          imports: [Module3],
          providersPerApp: [{ provide: LogManager, useValue: new LogManager() }],
        })
        class AppModule {}

        moduleManager.scanModule(AppModule);
        const msg = `Module3 failed: exports from several modules causes collision with Provider1.`;
        const providers0 = new ProvidersMetadata();
        const importsMap = new ImportsMap();
        const globalProviders: ProvidersMetadata & ImportsMap = { ...providers0, ...importsMap };
        expect(() => mock.bootstrap(globalProviders, '', AppModule, moduleManager, new Set())).toThrow(msg);
      });

      it('resolved collision for non-root module', () => {
        const injectorPerApp = ReflectiveInjector.resolveAndCreate([
          ...defaultProvidersPerApp,
          { provide: Logger, useClass: MyLogger },
          { provide: LogManager, useValue: new LogManager() },
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
          providersPerMod: [{ provide: Provider1, useValue: 'one' }],
          exports: [Provider1],
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
          providersPerApp: [{ provide: LogManager, useValue: new LogManager() }],
        })
        class AppModule {}

        moduleManager.scanRootModule(AppModule);
        const providers0 = new ProvidersMetadata();
        const importsMap = new ImportsMap();
        const globalProviders: ProvidersMetadata & ImportsMap = { ...providers0, ...importsMap };
        expect(() => mock.bootstrap(globalProviders, '', AppModule, moduleManager, new Set())).not.toThrow();
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
