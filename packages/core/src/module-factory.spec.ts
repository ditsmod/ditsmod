import 'reflect-metadata';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { Injectable, ReflectiveInjector } from '@ts-stack/di';

import { NODE_REQ } from './constans';
import { Controller, ControllerMetadata } from './decorators/controller';
import { Module } from './decorators/module';
import { RootModule } from './decorators/root-module';
import { Route, RouteMetadata } from './decorators/route';
import { ModuleExtract } from './models/module-extract';
import { NormalizedModuleMetadata } from './models/normalized-module-metadata';
import { ModuleFactory } from './module-factory';
import { defaultProvidersPerApp } from './services/default-providers-per-app';
import { LogMediator } from './services/log-mediator';
import { ModuleManager } from './services/module-manager';
import { Req } from './services/request';
import { Logger } from './types/logger';
import { GlobalProviders, ImportObj, MetadataPerMod1 } from './types/metadata-per-mod';
import {
  DecoratorMetadata,
  ExtensionProvider,
  ModuleType,
  ModuleWithParams,
  NormalizedGuard,
  ServiceProvider,
} from './types/mix';
import { Router } from './types/router';
import { getImportedProviders, getImportedTokens } from './utils/get-imports';

type AnyModule = ModuleType | ModuleWithParams;

describe('ModuleFactory', () => {
  @Injectable()
  class MockModuleFactory extends ModuleFactory {
    injectorPerMod: ReflectiveInjector;
    override prefixPerMod: string;
    override moduleName = 'MockModule';
    override meta = new NormalizedModuleMetadata();
    override appMetadataMap = new Map<ModuleType, MetadataPerMod1>();
    override importedProvidersPerMod = new Map<any, ImportObj>();
    override importedProvidersPerRou = new Map<any, ImportObj>();
    override importedProvidersPerReq = new Map<any, ImportObj>();
    override importedMultiProvidersPerMod = new Map<AnyModule, ServiceProvider[]>();
    override importedMultiProvidersPerRou = new Map<AnyModule, ServiceProvider[]>();
    override importedMultiProvidersPerReq = new Map<AnyModule, ServiceProvider[]>();
    override importedExtensions = new Map<AnyModule, ExtensionProvider[]>();
    override guardsPerMod: NormalizedGuard[] = [];

    override exportGlobalProviders(moduleManager: ModuleManager, providersPerApp: ServiceProvider[]) {
      return super.exportGlobalProviders(moduleManager, providersPerApp);
    }

    override getControllersMetadata() {
      return super.getControllersMetadata();
    }
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
      MockModuleFactory,
    ]);
    mock = injectorPerApp.get(MockModuleFactory);
    moduleManager = new ModuleManager(new LogMediator({ moduleName: 'fakeName' }));
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
        imports: [Module2],
        exports: [Module2],
      })
      class AppModule {}

      const msg = 'Module2 failed: if "Provider1" is a provider,';
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
        imports: [Module2],
        exports: [Module2],
      })
      class AppModule {}

      moduleManager.scanRootModule(AppModule);
      expect(() => mock.exportGlobalProviders(moduleManager, [])).not.toThrow();
      expect(getImportedProviders(mock.importedProvidersPerMod)).toEqual([]);
      expect(getImportedProviders(mock.importedProvidersPerReq)).toEqual([Provider1]);
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
        imports: [Module2],
        exports: [Module2],
      })
      class AppModule {}

      moduleManager.scanRootModule(AppModule);
      expect(() => mock.exportGlobalProviders(moduleManager, [])).not.toThrow();
      expect(getImportedProviders(mock.importedProvidersPerMod)).toEqual([Provider2]);
      expect(getImportedProviders(mock.importedProvidersPerReq)).toEqual([Provider1]);
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
        imports: [Module2],
        exports: [Module2],
      })
      class AppModule {}

      moduleManager.scanRootModule(AppModule);
      expect(() => mock.exportGlobalProviders(moduleManager, [])).not.toThrow();
      expect(getImportedProviders(mock.importedProvidersPerMod)).toEqual([Provider1, Provider2, Provider3, Provider4]);
      expect(getImportedProviders(mock.importedProvidersPerReq)).toEqual([]);
    });

    it('import dependencies of global imported providers', () => {
      @Injectable()
      class Provider1 {}

      @Injectable()
      class Provider2 {
        constructor(provider1: Provider1) {}
      }

      @Injectable()
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
        imports: [Module2],
        providersPerReq: [Provider3],
        exports: [Module2, Provider3],
      })
      class AppModule {}

      moduleManager.scanRootModule(AppModule);
      expect(() => mock.exportGlobalProviders(moduleManager, [])).not.toThrow();
      expect(getImportedProviders(mock.importedProvidersPerMod)).toEqual([]);
      expect(getImportedProviders(mock.importedProvidersPerReq)).toEqual([Provider1, Provider2, Provider3]);

      const importObj = new ImportObj();
      importObj.module = Module1;
      importObj.providers = [Provider1];
      expect(mock?.importedProvidersPerReq.get(Provider1)).toEqual(importObj);
      importObj.module = Module2;
      importObj.providers = [Provider2];
      expect(mock?.importedProvidersPerReq.get(Provider2)).toEqual(importObj);
      importObj.module = AppModule;
      importObj.providers = [Provider3];
      expect(mock?.importedProvidersPerReq.get(Provider3)).toEqual(importObj);
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
        expect(meta.providersPerReq).toEqual(meta.exportedProvidersPerReq);
        expect(meta.providersPerReq).toEqual([]);

        mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set());
        expect(mock.appMetadataMap.get(AppModule)?.meta.exportedProvidersPerReq).toEqual([]);
      });

      it('case 1', () => {
        const injectorPerApp = ReflectiveInjector.resolveAndCreate([
          ...defaultProvidersPerApp,
          { provide: Logger, useClass: MyLogger },
        ]);

        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;
        moduleManager.scanModule(Module3);
        mock.bootstrap([], new GlobalProviders(), '', Module3, moduleManager, new Set());

        const mod0 = mock.appMetadataMap.get(Module0);
        const providerPerMod0: ServiceProvider = {
          provide: ModuleExtract,
          useValue: { path: '', moduleName: 'Module0' },
        };
        expect(mod0?.meta.providersPerMod).toEqual([providerPerMod0, Provider0]);
        expect(mod0?.meta.providersPerReq).toEqual([]);
        expect(mod0?.meta.ngMetadataName).toBe('Module');

        const mod1 = mock.appMetadataMap.get(Module1);
        const providerPerMod1: ServiceProvider = {
          provide: ModuleExtract,
          useValue: { path: '', moduleName: 'Module1' },
        };
        expect(mod1?.meta.providersPerMod).toEqual([providerPerMod1, Provider1, Provider2, Provider3]);

        const tokensPerMod = getImportedTokens(mod1?.importedTokensMap.perMod);
        expect(tokensPerMod).toEqual([Provider0]);

        expect(mod1?.meta.providersPerReq).toEqual([]);
        expect(mod1?.meta.ngMetadataName).toBe('Module');

        const mod2 = mock.appMetadataMap.get(Module2);
        const providerPerMod2: ServiceProvider = {
          provide: ModuleExtract,
          useValue: { path: '', moduleName: 'Module2' },
        };
        expect(mod2?.meta.providersPerMod).toEqual([providerPerMod2, Provider4, Provider5, Provider6]);

        const tokensPerMod2 = getImportedTokens(mod2?.importedTokensMap.perMod);
        expect(tokensPerMod2).toEqual([Provider0, Provider1, Provider2, Provider3]);

        expect(mod2?.meta.providersPerReq).toEqual([Provider7, Provider8]);
        expect(mod2?.meta.ngMetadataName).toBe('Module');

        const mod3 = mock.appMetadataMap.get(Module3);
        const providerPerMod3: ServiceProvider = {
          provide: ModuleExtract,
          useValue: { path: '', moduleName: 'Module3' },
        };
        expect(mod3?.meta.providersPerMod).toEqual([providerPerMod3]);

        // expect(mod3.providersPerReq).toEqual([Ctrl, [], Provider8, Provider9, overriddenProvider8]);
        expect(mod3?.meta.controllers).toEqual([Ctrl]);
        expect(mod3?.meta.ngMetadataName).toBe('Module');
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
        mock.bootstrap([], new GlobalProviders(), 'other', Module4, moduleManager, new Set());

        expect(mock.prefixPerMod).toBe('other');
        // expect(mock.router.find('GET', '/some/other').handle().controller).toBe(Ctrl);
        const providerPerMod: ServiceProvider = {
          provide: ModuleExtract,
          useValue: { path: 'other', moduleName: 'Module4' },
        };
        expect(mock.meta.providersPerMod).toEqual([providerPerMod]);

        expect(mock?.importedProvidersPerMod).toBeDefined();
        const importObj = new ImportObj();
        importObj.module = Module0;
        importObj.providers = [Provider0];
        expect(mock?.importedProvidersPerMod.get(Provider0)).toEqual(importObj);

        importObj.module = Module1;
        importObj.providers = [Provider1];
        expect(mock?.importedProvidersPerMod.get(Provider1)).toEqual(importObj);
        importObj.providers = [Provider2];
        expect(mock?.importedProvidersPerMod.get(Provider2)).toEqual(importObj);
        importObj.providers = [Provider3];
        expect(mock?.importedProvidersPerMod.get(Provider3)).toEqual(importObj);

        importObj.module = Module2;
        importObj.providers = [Provider5];
        expect(mock?.importedProvidersPerMod.get(Provider5)).toEqual(importObj);

        expect(mock.meta.providersPerReq).toEqual([]);

        importObj.module = Module2;
        importObj.providers = [Provider8];
        expect(mock?.importedProvidersPerReq.get(Provider8)).toEqual(importObj);
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
        ]);

        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;
        moduleManager.scanModule(Module3);
        mock.bootstrap([], new GlobalProviders(), '', Module3, moduleManager, new Set());

        const mod3 = mock.appMetadataMap.get(Module3);
        expect(mod3?.meta.providersPerReq).toEqual([Provider3]);

        expect(mock?.importedProvidersPerReq).toBeDefined();
        const importObj = new ImportObj();
        importObj.module = Module2;
        importObj.providers = [Provider2];
        expect(mock?.importedProvidersPerReq.get(Provider2)).toEqual(importObj);
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
        })
        class Module7 {}
        const providers = [...defaultProvidersPerApp] as ServiceProvider[];
        const injectorPerApp = ReflectiveInjector.resolveAndCreate(providers);
        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;
        const msg = 'Module6 failed: if "Provider2" is a provider';
        expect(() => moduleManager.scanModule(Module7)).toThrow(msg);
      });
    });

    describe('Providers collisions', () => {
      describe('per a module', () => {
        it('in global providers', () => {
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
            imports: [Module2],
            exports: [Module2],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          const msg = 'AppModule failed: exports from Module1, Module2 causes collision with Provider1.';
          expect(() => mock.exportGlobalProviders(moduleManager, [])).toThrow(msg);
        });

        it('in AppModule with exported provider, but it has resolvedCollisionsPerMod array', () => {
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
            imports: [Module2],
            resolvedCollisionsPerMod: [[Provider1, Module1]],
            exports: [Module2],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          expect(() => mock.exportGlobalProviders(moduleManager, [])).not.toThrow();
          expect([...mock.importedProvidersPerMod]).toEqual([
            [Provider1, { module: Module1, providers: [{ provide: Provider1, useValue: 'one' }] }],
          ]);
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
            imports: [Module2],
            exports: [Module2],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          expect(() => mock.exportGlobalProviders(moduleManager, [])).not.toThrow();
        });

        it('import Module2 and reexport Module1 with collision - Provider2', () => {
          class Provider1 {}
          class Provider2 {}
          class Provider3 {}

          @Module({
            providersPerMod: [Provider1, { provide: Provider2, useFactory: () => {} }],
            exports: [Provider1, Provider2],
          })
          class Module1 {}

          @Module({
            imports: [Module1],
            providersPerMod: [Provider2, Provider3],
            exports: [Module1, Provider2, Provider3],
          })
          class Module2 {}

          @RootModule({
            imports: [Module2],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          const msg = 'AppModule failed: exports from Module1, Module2 causes collision with Provider2.';
          expect(() => mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())).toThrow(msg);
        });

        it('import Module2 and Module1 with collision - Provider1', () => {
          class Provider1 {}
          class Provider2 {}

          @Module({
            exports: [Provider1],
            providersPerMod: [{ provide: Provider1, useClass: Provider1 }, Provider2],
          })
          class Module1 {}

          @Module({
            exports: [Provider1, Provider2],
            providersPerMod: [Provider1, { provide: Provider2, useFactory: () => {} }],
          })
          class Module2 {}

          @RootModule({ imports: [Module1, Module2] })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          const msg = 'AppModule failed: exports from Module1, Module2 causes collision with Provider1.';
          expect(() => mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())).toThrow(msg);
        });

        it('import multi providers that has token Provider1', () => {
          class Provider1 {}
          class Provider2 {}

          @Module({
            exports: [Provider1],
            providersPerMod: [
              { provide: Provider1, useValue: 'value1 of module1', multi: true },
              { provide: Provider1, useValue: 'value2 of module1', multi: true },
              Provider2,
            ],
          })
          class Module1 {}

          @Module({
            exports: [Provider1, Provider2],
            providersPerMod: [
              { provide: Provider1, useValue: 'value1 of module2', multi: true },
              { provide: Provider1, useValue: 'value2 of module2', multi: true },
              { provide: Provider1, useValue: 'value3 of module2', multi: true },
              { provide: Provider2, useValue: 'value100' },
            ],
          })
          class Module2 {}

          @RootModule({ imports: [Module1, Module2] })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          const callback = () => mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set());
          expect(callback).not.toThrow();
          expect([...mock.importedProvidersPerMod]).toEqual([
            [
              Provider2,
              {
                module: Module2,
                providers: [{ provide: Provider2, useValue: 'value100' }],
              },
            ],
          ]);
          expect([...mock.importedMultiProvidersPerMod]).toEqual([
            [
              Module1,
              [
                { provide: Provider1, useValue: 'value1 of module1', multi: true },
                { provide: Provider1, useValue: 'value2 of module1', multi: true },
              ],
            ],
            [
              Module2,
              [
                { provide: Provider1, useValue: 'value1 of module2', multi: true },
                { provide: Provider1, useValue: 'value2 of module2', multi: true },
                { provide: Provider1, useValue: 'value3 of module2', multi: true },
              ],
            ],
          ]);
        });

        it('should throw an error when resolving multi providers duplicates', () => {
          class Provider1 {}

          @Module({
            exports: [Provider1],
            providersPerMod: [{ provide: Provider1, useValue: 'value1 of module1', multi: true }],
          })
          class Module1 {}

          @Module({
            exports: [Provider1],
            providersPerMod: [{ provide: Provider1, useValue: 'value1 of module2', multi: true }],
          })
          class Module2 {}

          @RootModule({
            imports: [Module1, Module2],
            resolvedCollisionsPerMod: [[Provider1, Module1]],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          const msg = 'but Provider1 is a token of the multi providers,';
          expect(() => mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())).toThrow(msg);
        });

        it('exporting duplicates with "multi == true" not to throw', () => {
          class Provider1 {}
          class Provider2 {}

          @Module({
            exports: [Provider1],
            providersPerMod: [{ provide: Provider1, useClass: Provider1, multi: true }, Provider2],
          })
          class Module1 {}

          @Module({
            exports: [Provider1],
            providersPerMod: [{ provide: Provider1, useClass: Provider1, multi: true }],
          })
          class Module2 {}

          @RootModule({
            imports: [Module1, Module2],
            providersPerApp: [{ provide: Router, useValue: 'fake' }],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          expect(() =>
            mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())
          ).not.toThrow();
        });

        it('exporting duplicates of Provider2, declared in resolvedCollisionsPerMod of root module', () => {
          class Provider1 {}
          class Provider2 {}
          class Provider3 {}
          const useFactoryProvider2 = { provide: Provider2, useFactory: () => {} };

          @Module({
            providersPerMod: [Provider1, useFactoryProvider2],
            exports: [Provider1, Provider2],
          })
          class Module1 {}

          @Module({
            imports: [Module1],
            providersPerMod: [Provider2, Provider3],
            exports: [Module1, Provider2, Provider3],
          })
          class Module2 {}

          @RootModule({
            imports: [Module2],
            resolvedCollisionsPerMod: [[Provider2, Module1]],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          expect(() =>
            mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())
          ).not.toThrow();
          expect([...mock.importedProvidersPerMod]).toEqual([
            [Provider1, { module: Module1, providers: [Provider1] }],
            [Provider2, { module: Module1, providers: [useFactoryProvider2] }],
            [Provider3, { module: Module2, providers: [Provider3] }],
          ]);
        });

        it('exporting duplicates in Module2 (with params), but declared in resolvedCollisionsPerMod of root module', () => {
          class Provider1 {}
          class Provider2 {}

          @Module({
            exports: [Provider1],
            providersPerMod: [Provider1, Provider2],
          })
          class Module1 {}

          @Module({
            exports: [Provider1, Provider2],
            providersPerMod: [{ provide: Provider1, useClass: Provider1 }, Provider2],
          })
          class Module2 {
            static withParams() {
              return { module: Module2 };
            }
          }

          const moduleWithParams = Module2.withParams();

          @RootModule({
            imports: [Module1, moduleWithParams],
            resolvedCollisionsPerMod: [[Provider1, Module1]],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          expect(() =>
            mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())
          ).not.toThrow();
          expect([...mock.importedProvidersPerMod]).toEqual([
            [Provider1, { module: Module1, providers: [Provider1] }],
            [Provider2, { module: moduleWithParams, providers: [Provider2] }],
          ]);
        });

        it('resolved collision for non-root module', () => {
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
            resolvedCollisionsPerMod: [[Provider1, Module1]],
            exports: [Module1, Module2],
          })
          class Module3 {}

          @RootModule({
            imports: [Module3],
            resolvedCollisionsPerMod: [[Provider1, Module2]],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          expect(() =>
            mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())
          ).not.toThrow();
          const mod3 = mock.appMetadataMap.get(Module3)!;
          expect([...mod3.importedTokensMap.perMod]).toEqual([
            [Provider1, { module: Module1, providers: [Provider1] }],
          ]);
          expect([...mock.importedProvidersPerMod]).toEqual([
            [Provider1, { module: Module2, providers: [{ provide: Provider1, useValue: 'one' }] }],
          ]);
        });

        it('for non-root module', () => {
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
          })
          class AppModule {}

          moduleManager.scanModule(AppModule);
          const msg = 'Module3 failed: exports from Module1, Module2 causes collision with Provider1.';
          expect(() => mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())).toThrow(msg);
        });
      });

      describe('per a req', () => {
        it('exporting duplicates of Provider2', () => {
          class Provider1 {}
          class Provider2 {}
          class Provider3 {}

          @Module({
            exports: [Provider1, Provider2],
            providersPerReq: [{ provide: Provider1, useExisting: Provider1 }, Provider2],
          })
          class Module1 {}

          @Module({
            imports: [Module1],
            exports: [Module1, Provider2, Provider3],
            providersPerReq: [{ provide: Provider2, useClass: Provider2 }, Provider3],
          })
          class Module2 {}

          @RootModule({
            imports: [Module2],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          const msg = 'AppModule failed: exports from Module1, Module2 causes collision with Provider2.';
          expect(() => mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())).toThrow(msg);
        });

        it('exporting duplicates of Provider2, but declared in resolvedCollisionsPerReq of root module', () => {
          class Provider1 {}
          class Provider2 {}
          class Provider3 {}

          @Module({
            exports: [Provider1, Provider2],
            providersPerReq: [{ provide: Provider1, useExisting: Provider1 }, Provider2],
          })
          class Module1 {}

          @Module({
            imports: [Module1],
            exports: [Module1, Provider2, Provider3],
            providersPerReq: [{ provide: Provider2, useClass: Provider2 }, Provider3],
          })
          class Module2 {}

          @RootModule({
            imports: [Module2],
            resolvedCollisionsPerReq: [[Provider2, Module2]],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          expect(() =>
            mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())
          ).not.toThrow();
          expect([...mock.importedProvidersPerReq]).toEqual([
            [Provider1, { module: Module1, providers: [{ provide: Provider1, useExisting: Provider1 }] }],
            [Provider2, { module: Module2, providers: [{ provide: Provider2, useClass: Provider2 }] }],
            [Provider3, { module: Module2, providers: [Provider3] }],
          ]);
        });

        it('exporting duplicates of Provider1 from Module1 and Module2', () => {
          class Provider1 {}
          class Provider2 {}

          @Module({
            exports: [Provider1],
            providersPerReq: [{ provide: Provider1, useClass: Provider1 }, Provider2],
          })
          class Module0 {}

          @Module({
            exports: [Provider1, Provider2],
            providersPerReq: [{ provide: Provider1, useExisting: Provider1 }, Provider2],
          })
          class Module1 {}

          @RootModule({
            imports: [Module0, Module1],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          const msg = 'AppModule failed: exports from Module0, Module1 causes collision with Provider1.';
          expect(() => mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())).toThrow(msg);
        });

        it('exporting duplicates of Provider1 from Module1 and Module2, but declared in providersPerReq of root module', () => {
          class Provider1 {}
          class Provider2 {}

          @Module({
            exports: [Provider1, Provider2],
            providersPerReq: [{ provide: Provider1, useClass: Provider2 }, Provider2],
          })
          class Module1 {}

          @Module({
            exports: [Provider1, Provider2],
            providersPerReq: [
              { provide: Provider1, useExisting: Provider1 },
              { provide: Provider2, useExisting: Provider1 },
            ],
          })
          class Module2 {}

          @RootModule({
            imports: [Module1, Module2],
            resolvedCollisionsPerReq: [
              [Provider1, Module2],
              [Provider2, Module1],
            ],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          expect(() =>
            mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())
          ).not.toThrow();
          expect([...mock.importedProvidersPerReq]).toEqual([
            [Provider1, { module: Module2, providers: [{ provide: Provider1, useExisting: Provider1 }] }],
            [Provider2, { module: Module1, providers: [Provider2] }],
          ]);
        });
      });

      describe('mix per app, per mod or per req', () => {
        class Provider0 {}
        class Provider1 {}

        it('case 1', () => {
          @Module({
            exports: [Provider0],
            providersPerMod: [Provider0],
          })
          class Module0 {}

          @RootModule({
            imports: [Module0],
            providersPerApp: [Provider0],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          const msg = 'AppModule failed: exports from Module0 causes collision with Provider0.';
          expect(() =>
            mock.bootstrap([Provider0], new GlobalProviders(), '', AppModule, moduleManager, new Set())
          ).toThrow(msg);
        });

        it('resolved case 1', () => {
          @Module({
            exports: [Provider1],
            providersPerMod: [{ provide: Provider1, useValue: 'fake' }],
          })
          class Module1 {}

          @RootModule({
            imports: [Module1],
            providersPerApp: [Provider1],
            resolvedCollisionsPerMod: [[Provider1, Module1]],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          const callback = () =>
            mock.bootstrap([Provider1], new GlobalProviders(), '', AppModule, moduleManager, new Set());
          expect(callback).not.toThrow();
          expect([...mock.importedProvidersPerMod]).toEqual([
            [Provider1, { module: Module1, providers: [{ provide: Provider1, useValue: 'fake' }] }],
          ]);
        });

        it('case 2', () => {
          @Module({
            exports: [Provider1],
            providersPerReq: [{ provide: Provider1, useClass: Provider1 }],
          })
          class Module0 {}

          @RootModule({
            imports: [Module0],
            providersPerMod: [Provider1],
            providersPerReq: [],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          const msg = 'AppModule failed: exports from Module0 causes collision with Provider1.';
          expect(() => mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())).toThrow(msg);
        });

        it('resolved case 2', () => {
          @Module({
            exports: [Provider1],
            providersPerReq: [{ provide: Provider1, useClass: Provider1 }],
          })
          class Module1 {}

          @RootModule({
            imports: [Module1],
            providersPerMod: [Provider1],
            resolvedCollisionsPerReq: [[Provider1, Module1]],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          expect(() =>
            mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())
          ).not.toThrow();
          expect([...mock.importedProvidersPerReq]).toEqual([
            [Provider1, { module: Module1, providers: [{ provide: Provider1, useClass: Provider1 }] }],
          ]);
        });

        it('double resolve', () => {
          @Module({
            exports: [Provider1],
            providersPerReq: [Provider1],
          })
          class Module1 {}

          @Module({
            exports: [Provider1],
            providersPerMod: [{ provide: Provider1, useClass: Provider2 }],
          })
          class Module2 {}

          @RootModule({
            imports: [Module1, Module2],
            providersPerApp: [Provider1],
            resolvedCollisionsPerMod: [[Provider1, AppModule]],
            resolvedCollisionsPerReq: [[Provider1, Module1]],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          expect(() => {
            mock.bootstrap([Provider1], new GlobalProviders(), '', AppModule, moduleManager, new Set());
          }).not.toThrow();
          expect([...mock.importedProvidersPerMod]).toEqual([]);
          expect([...mock.importedProvidersPerReq]).toEqual([[Provider1, { module: Module1, providers: [Provider1] }]]);
        });

        it('point to current module to increase scope and to resolve case 2', () => {
          @Module({
            exports: [Provider1],
            providersPerReq: [{ provide: Provider1, useClass: Provider1 }],
          })
          class Module1 {}

          @RootModule({
            imports: [Module1],
            providersPerMod: [Provider1],
            resolvedCollisionsPerReq: [[Provider1, AppModule]],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          expect(() =>
            mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())
          ).not.toThrow();
          expect([...mock.importedProvidersPerReq]).toEqual([]);
        });

        it('wrong point to current module', () => {
          @Module({
            exports: [Provider2],
            providersPerReq: [{ provide: Provider2, useClass: Provider1 }],
          })
          class Module1 {}

          @RootModule({
            imports: [Module1],
            providersPerMod: [Provider1],
            resolvedCollisionsPerReq: [[Provider1, AppModule]],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          const msg =
            'AppModule failed: Provider1 mapped with AppModule, but providersPerReq does not imports Provider1';
          expect(() => mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())).toThrow(msg);
        });

        it('case 3', () => {
          @Module({
            exports: [Req],
            providersPerReq: [{ provide: Req, useClass: Req }],
          })
          class Module0 {}

          @RootModule({
            imports: [Module0],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          const msg = 'AppModule failed: exports from Module0 causes collision with Req.';
          expect(() => mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())).toThrow(msg);
        });

        it('resolve case 3', () => {
          @Module({
            exports: [Req],
            providersPerReq: [{ provide: Req, useClass: Req }],
          })
          class Module0 {}

          @RootModule({
            imports: [Module0],
            resolvedCollisionsPerReq: [[Req, AppModule]],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          expect(() =>
            mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())
          ).not.toThrow();
          expect([...mock.importedProvidersPerReq]).toEqual([]);
        });

        it('resolve 2 case 3', () => {
          @Module({
            exports: [Req],
            providersPerReq: [{ provide: Req, useClass: Req }],
          })
          class Module1 {}

          @RootModule({
            imports: [Module1],
            resolvedCollisionsPerReq: [[Req, Module1]],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          expect(() =>
            mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())
          ).not.toThrow();
          expect([...mock.importedProvidersPerReq]).toEqual([
            [Req, { module: Module1, providers: [{ provide: Req, useClass: Req }] }],
          ]);
        });

        it('case 4', () => {
          @Module({
            exports: [NODE_REQ],
            providersPerReq: [{ provide: NODE_REQ, useValue: '' }],
          })
          class Module0 {}

          @RootModule({
            imports: [Module0],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          const msg = 'AppModule failed: exports from Module0 causes collision with InjectionToken NODE_REQ.';
          expect(() => mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())).toThrow(msg);
        });

        it('resolve case 4', () => {
          @Module({
            exports: [NODE_REQ],
            providersPerReq: [{ provide: NODE_REQ, useValue: '' }],
          })
          class Module0 {}

          @RootModule({
            imports: [Module0],
            resolvedCollisionsPerReq: [[NODE_REQ, AppModule]],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          expect(() =>
            mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())
          ).not.toThrow();
          expect([...mock.importedProvidersPerReq]).toEqual([]);
        });

        it('resolved case 4', () => {
          @Module({
            exports: [NODE_REQ],
            providersPerReq: [{ provide: NODE_REQ, useValue: '' }],
          })
          class Module1 {}

          @RootModule({
            imports: [Module1],
            resolvedCollisionsPerReq: [[NODE_REQ, Module1]],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          expect(() =>
            mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())
          ).not.toThrow();
          expect([...mock.importedProvidersPerReq]).toEqual([
            [NODE_REQ, { module: Module1, providers: [{ provide: NODE_REQ, useValue: '' }] }],
          ]);
        });
      });
    });
  });

  describe('getControllersMetadata()', () => {
    it('without @Controller decorator', () => {
      mock.meta.controllers = [class Controller1 {}];
      const msg = 'Collecting controller\'s metadata in MockModule failed: class "Controller1"';
      expect(() => mock.getControllersMetadata()).toThrowError(msg);
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
