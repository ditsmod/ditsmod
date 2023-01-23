import 'reflect-metadata';
import { FactoryProvider, injectable, Provider, Injector } from './di';

import { controller, ControllerMetadata } from './decorators/controller';
import { featureModule } from './decorators/module';
import { rootModule } from './decorators/root-module';
import { route, RouteMetadata } from './decorators/route';
import { ModuleExtract } from './models/module-extract';
import { NormalizedModuleMetadata } from './models/normalized-module-metadata';
import { ModuleFactory } from './module-factory';
import { defaultProvidersPerApp } from './services/default-providers-per-app';
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
import { SystemLogMediator } from './log-mediator/system-log-mediator';
import { makePropDecorator } from './di';
import { transformControllersMetadata } from './utils/transform-controllers-metadata';
import { HttpBackend } from './types/http-interceptor';

type AnyModule = ModuleType | ModuleWithParams;

describe('ModuleFactory', () => {
  @injectable()
  class MockModuleFactory extends ModuleFactory {
    injectorPerMod: Injector;
    declare prefixPerMod: string;
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
  }

  class MyLogger extends Logger {
    override debug = (...args: any[]): any => {
      console.log(`debug:\n ${'*'.repeat(50)}\n`, ...args);
    };
  }

  let mock: MockModuleFactory;
  let moduleManager: ModuleManager;

  beforeEach(() => {
    const injectorPerApp = Injector.resolveAndCreate([
      ...defaultProvidersPerApp,
      { token: Logger, useClass: MyLogger },
      MockModuleFactory,
    ]);
    mock = injectorPerApp.get(MockModuleFactory);
    moduleManager = new ModuleManager(new SystemLogMediator({ moduleName: 'fakeName' }));
  });

  describe('appending modules', () => {
    function bootstrap(mod: ModuleType) {
      expect(() => moduleManager.scanModule(mod)).not.toThrow();
      mock.bootstrap([], new GlobalProviders(), '', mod, moduleManager, new Set());
    }

    it('should not throw an error during appending modules', () => {
      @controller()
      class Controller1 {}

      @featureModule({ controllers: [Controller1] })
      class Module1 {}

      @featureModule({ controllers: [Controller1] })
      class Module2 {}

      @featureModule({
        appends: [Module1, { path: '', module: Module2 }],
        controllers: [Controller1],
      })
      class Module3 {}

      expect(() => bootstrap(Module3)).not.toThrow();
    });

    xit('should throw an error during importing and appending same module', () => {
      @controller()
      class Controller1 {}

      @featureModule({ controllers: [Controller1] })
      class Module1 {}

      @featureModule({
        imports: [Module1],
        appends: [Module1],
        controllers: [Controller1],
      })
      class Module2 {}

      const msg = 'Appends to "Module2" failed: "Module1" includes in both: imports and appends arrays';
      expect(() => bootstrap(Module2)).toThrow(msg);
    });

    it('should throw an error during appending module without controllers (common module)', () => {
      class Provider1 {}
      class Provider2 {}
      @controller()
      class Controller1 {}

      @featureModule({
        providersPerMod: [Provider1, Provider2],
        exports: [Provider1, Provider2],
      })
      class Module1 {}

      @featureModule({
        appends: [Module1],
        controllers: [Controller1],
      })
      class Module2 {}

      const msg = 'Appends to "Module2" failed: "Module1" must have controllers';
      expect(() => bootstrap(Module2)).toThrow(msg);
    });

    it('should throw an error during appending module without controllers (AppendsWithParams)', () => {
      class Provider1 {}
      class Provider2 {}
      @controller()
      class Controller1 {}

      @featureModule({
        providersPerMod: [Provider1, Provider2],
        exports: [Provider1, Provider2],
      })
      class Module1 {}

      @featureModule({
        appends: [{ path: '', module: Module1 }],
        controllers: [Controller1],
      })
      class Module2 {}

      const msg = 'Appends to "Module2" failed: "Module1" must have controllers';
      expect(() => bootstrap(Module2)).toThrow('Appends to "Module2" failed: "Module1" must have controllers');
    });

    it('should not throw an error during appending module with controllers', () => {
      class Provider1 {}
      class Provider2 {}
      @controller()
      class Controller1 {}

      @featureModule({
        providersPerMod: [Provider1, Provider2],
        exports: [Provider1, Provider2],
        controllers: [Controller1],
      })
      class Module1 {}

      @featureModule({
        appends: [Module1],
        controllers: [Controller1],
      })
      class Module2 {}

      expect(() => bootstrap(Module2)).not.toThrow();
    });
  });

  describe('exportGlobalProviders()', () => {
    it('forbidden reexports providers', () => {
      class Provider1 {}

      @featureModule({
        providersPerReq: [Provider1],
      })
      class Module1 {}

      @featureModule({
        imports: [Module1],
        exports: [Provider1],
      })
      class Module2 {}

      @rootModule({
        imports: [Module2],
        exports: [Module2],
      })
      class AppModule {}

      const msg = 'Module2 failed: if "Provider1" is a provider,';
      expect(() => moduleManager.scanRootModule(AppModule)).toThrow(msg);
    });

    it('allow reexports module', () => {
      class Provider1 {}

      @featureModule({
        providersPerReq: [Provider1],
        exports: [Provider1],
      })
      class Module1 {}

      @featureModule({
        imports: [Module1],
        exports: [Module1],
      })
      class Module2 {}

      @rootModule({
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

      @featureModule({
        providersPerReq: [Provider1],
        exports: [Provider1],
      })
      class Module1 {}

      @featureModule({
        providersPerMod: [Provider2],
        imports: [Module1],
        exports: [Provider2, Module1],
      })
      class Module2 {}

      @rootModule({
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

      @featureModule({
        providersPerMod: [Provider1, Provider2],
        exports: [Provider1, Provider2],
      })
      class Module1 {}

      @featureModule({
        imports: [Module1],
        providersPerMod: [Provider3, Provider4],
        exports: [Module1, Provider3, Provider4],
      })
      class Module2 {}

      @rootModule({
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
      @injectable()
      class Provider1 {}

      @injectable()
      class Provider2 {
        constructor(provider1: Provider1) {}
      }

      @injectable()
      class Provider3 {}

      @featureModule({
        providersPerReq: [Provider1],
        exports: [Provider1],
      })
      class Module1 {}

      @featureModule({
        imports: [Module1],
        providersPerReq: [Provider2],
        exports: [Provider2, Module1],
      })
      class Module2 {}

      @rootModule({
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
    const overriddenProvider8: Provider = { token: Provider8, useValue: 'overridden' };
    class Provider9 {}

    describe('exporting providers order', () => {
      @featureModule({
        exports: [Provider0],
        providersPerMod: [Provider0],
      })
      class Module0 {}

      @featureModule({
        imports: [Module0],
        exports: [Module0, Provider1, Provider2, Provider3],
        providersPerMod: [Provider1, Provider2, Provider3],
      })
      class Module1 {}

      @featureModule({
        imports: [Module1],
        exports: [Module1, Provider5, Provider8],
        providersPerMod: [Provider4, Provider5, Provider6],
        providersPerReq: [Provider7, Provider8],
      })
      class Module2 {}

      @controller()
      class Ctrl {
        @route('GET')
        method() {}
      }

      @featureModule({
        imports: [Module2],
        exports: [Module2],
        providersPerReq: [Provider9, overriddenProvider8],
        controllers: [Ctrl],
      })
      class Module3 {}

      it('case 0', () => {
        @featureModule({ controllers: [Ctrl] })
        class Module1 {}

        @rootModule({
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
        const injectorPerApp = Injector.resolveAndCreate([
          ...defaultProvidersPerApp,
          { token: Logger, useClass: MyLogger },
        ]);

        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;
        moduleManager.scanModule(Module3);
        mock.bootstrap([], new GlobalProviders(), '', Module3, moduleManager, new Set());

        const mod0 = mock.appMetadataMap.get(Module0);
        const providerPerMod0: ServiceProvider = {
          token: ModuleExtract,
          useValue: { path: '', moduleName: 'Module0' },
        };
        expect(mod0?.meta.providersPerMod).toEqual([providerPerMod0, Provider0]);
        expect(mod0?.meta.providersPerReq).toEqual([]);
        expect(mod0?.meta.decoratorFactory).toBe(featureModule);

        const mod1 = mock.appMetadataMap.get(Module1);
        const providerPerMod1: ServiceProvider = {
          token: ModuleExtract,
          useValue: { path: '', moduleName: 'Module1' },
        };
        expect(mod1?.meta.providersPerMod).toEqual([providerPerMod1, Provider1, Provider2, Provider3]);

        const tokensPerMod = getImportedTokens(mod1?.importedTokensMap.perMod);
        expect(tokensPerMod).toEqual([Provider0]);

        expect(mod1?.meta.providersPerReq).toEqual([]);
        expect(mod1?.meta.decoratorFactory).toBe(featureModule);

        const mod2 = mock.appMetadataMap.get(Module2);
        const providerPerMod2: ServiceProvider = {
          token: ModuleExtract,
          useValue: { path: '', moduleName: 'Module2' },
        };
        expect(mod2?.meta.providersPerMod).toEqual([providerPerMod2, Provider4, Provider5, Provider6]);

        const tokensPerMod2 = getImportedTokens(mod2?.importedTokensMap.perMod);
        expect(tokensPerMod2).toEqual([Provider0, Provider1, Provider2, Provider3]);

        expect(mod2?.meta.providersPerReq).toEqual([Provider7, Provider8]);
        expect(mod2?.meta.decoratorFactory).toBe(featureModule);

        const mod3 = mock.appMetadataMap.get(Module3);
        const providerPerMod3: ServiceProvider = {
          token: ModuleExtract,
          useValue: { path: '', moduleName: 'Module3' },
        };
        expect(mod3?.meta.providersPerMod).toEqual([providerPerMod3]);

        // expect(mod3.providersPerReq).toEqual([Ctrl, [], Provider8, Provider9, overriddenProvider8]);
        expect(mod3?.meta.controllers).toEqual([Ctrl]);
        expect(mod3?.meta.decoratorFactory).toBe(featureModule);
      });

      it('case 2', () => {
        @rootModule({
          imports: [Module3],
        })
        class Module4 {}
        const providers: ServiceProvider[] = [...defaultProvidersPerApp, { token: Router, useValue: 'fake' }];
        const injectorPerApp = Injector.resolveAndCreate(providers);
        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;
        moduleManager.scanModule(Module4);
        mock.bootstrap([], new GlobalProviders(), 'other', Module4, moduleManager, new Set());

        expect(mock.prefixPerMod).toBe('other');
        // expect(mock.router.find('GET', '/some/other').handle().controller).toBe(Ctrl);
        const providerPerMod: ServiceProvider = {
          token: ModuleExtract,
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
        expect(mock.meta.decoratorFactory).toBe(rootModule);
      });

      it('importDependenciesOfImportedProviders() case 1', () => {
        class Provider1 {}

        @injectable()
        class Provider2 {
          constructor(provider1: Provider1) {}
        }

        class Provider3 {}

        @featureModule({
          providersPerReq: [Provider1],
          exports: [Provider1],
        })
        class Module1 {}

        @featureModule({
          imports: [Module1],
          providersPerReq: [Provider2],
          exports: [Provider2],
        })
        class Module2 {}

        @featureModule({
          imports: [Module2],
          providersPerReq: [Provider3],
          controllers: [Ctrl],
        })
        class Module3 {}

        const injectorPerApp = Injector.resolveAndCreate([
          ...defaultProvidersPerApp,
          { token: Logger, useClass: MyLogger },
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
        expect(mod3?.meta.decoratorFactory).toBe(featureModule);
      });

      it('should throw an error about not proper provider exports', () => {
        @featureModule({
          exports: [Provider1, Provider2, Provider3],
          providersPerMod: [Provider1, Provider3],
        })
        class Module6 {}

        @rootModule({
          imports: [Module6],
        })
        class Module7 {}
        const providers = [...defaultProvidersPerApp] as ServiceProvider[];
        const injectorPerApp = Injector.resolveAndCreate(providers);
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

          @featureModule({
            providersPerMod: [{ token: Provider1, useValue: 'one' }],
            exports: [Provider1],
          })
          class Module1 {}

          @featureModule({
            imports: [Module1],
            providersPerMod: [Provider1],
            exports: [Module1, Provider1],
          })
          class Module2 {}

          @rootModule({
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

          @featureModule({
            providersPerMod: [{ token: Provider1, useValue: 'one' }],
            exports: [Provider1],
          })
          class Module1 {}

          @featureModule({
            imports: [Module1],
            providersPerMod: [Provider1],
            exports: [Module1, Provider1],
          })
          class Module2 {}

          @rootModule({
            imports: [Module2],
            resolvedCollisionsPerMod: [[Provider1, Module1]],
            exports: [Module2],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          expect(() => mock.exportGlobalProviders(moduleManager, [])).not.toThrow();
          expect([...mock.importedProvidersPerMod]).toEqual([
            [Provider1, { module: Module1, providers: [{ token: Provider1, useValue: 'one' }] }],
          ]);
        });

        it('identical duplicates but not collision with exported providers', () => {
          class Provider1 {}

          @featureModule({
            providersPerMod: [{ token: Provider1, useValue: 'one' }],
            exports: [Provider1],
          })
          class Module1 {}

          @featureModule({
            imports: [Module1],
            providersPerMod: [{ token: Provider1, useValue: 'one' }],
            exports: [Module1, Provider1],
          })
          class Module2 {}

          @rootModule({
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
          const factory = makePropDecorator();

          class ClassWithFactory {
            @factory()
            method1() {}
          }

          @featureModule({
            providersPerMod: [
              Provider1,
              { token: Provider2, useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] },
            ],
            exports: [Provider1, Provider2],
          })
          class Module1 {}

          @featureModule({
            imports: [Module1],
            providersPerMod: [Provider2, Provider3],
            exports: [Module1, Provider2, Provider3],
          })
          class Module2 {}

          @rootModule({
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
          const factory = makePropDecorator();

          class ClassWithFactory {
            @factory()
            method1() {}
          }

          @featureModule({
            exports: [Provider1],
            providersPerMod: [{ token: Provider1, useClass: Provider1 }, Provider2],
          })
          class Module1 {}

          @featureModule({
            exports: [Provider1, Provider2],
            providersPerMod: [
              Provider1,
              { token: Provider2, useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] },
            ],
          })
          class Module2 {}

          @rootModule({ imports: [Module1, Module2] })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          const msg = 'AppModule failed: exports from Module1, Module2 causes collision with Provider1.';
          expect(() => mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())).toThrow(msg);
        });

        it('import multi providers that has token Provider1', () => {
          class Provider1 {}
          class Provider2 {}

          @featureModule({
            exports: [Provider1],
            providersPerMod: [
              { token: Provider1, useValue: 'value1 of module1', multi: true },
              { token: Provider1, useValue: 'value2 of module1', multi: true },
              Provider2,
            ],
          })
          class Module1 {}

          @featureModule({
            exports: [Provider1, Provider2],
            providersPerMod: [
              { token: Provider1, useValue: 'value1 of module2', multi: true },
              { token: Provider1, useValue: 'value2 of module2', multi: true },
              { token: Provider1, useValue: 'value3 of module2', multi: true },
              { token: Provider2, useValue: 'value100' },
            ],
          })
          class Module2 {}

          @rootModule({ imports: [Module1, Module2] })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          const callback = () => mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set());
          expect(callback).not.toThrow();
          expect([...mock.importedProvidersPerMod]).toEqual([
            [
              Provider2,
              {
                module: Module2,
                providers: [{ token: Provider2, useValue: 'value100' }],
              },
            ],
          ]);
          expect([...mock.importedMultiProvidersPerMod]).toEqual([
            [
              Module1,
              [
                { token: Provider1, useValue: 'value1 of module1', multi: true },
                { token: Provider1, useValue: 'value2 of module1', multi: true },
              ],
            ],
            [
              Module2,
              [
                { token: Provider1, useValue: 'value1 of module2', multi: true },
                { token: Provider1, useValue: 'value2 of module2', multi: true },
                { token: Provider1, useValue: 'value3 of module2', multi: true },
              ],
            ],
          ]);
        });

        it('should throw an error when resolving multi providers duplicates', () => {
          class Provider1 {}

          @featureModule({
            exports: [Provider1],
            providersPerMod: [{ token: Provider1, useValue: 'value1 of module1', multi: true }],
          })
          class Module1 {}

          @featureModule({
            exports: [Provider1],
            providersPerMod: [{ token: Provider1, useValue: 'value1 of module2', multi: true }],
          })
          class Module2 {}

          @rootModule({
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

          @featureModule({
            exports: [Provider1],
            providersPerMod: [{ token: Provider1, useClass: Provider1, multi: true }, Provider2],
          })
          class Module1 {}

          @featureModule({
            exports: [Provider1],
            providersPerMod: [{ token: Provider1, useClass: Provider1, multi: true }],
          })
          class Module2 {}

          @rootModule({
            imports: [Module1, Module2],
            providersPerApp: [{ token: Router, useValue: 'fake' }],
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
          const factory = makePropDecorator();

          class ClassWithFactory {
            @factory()
            method1() {}
          }
          const useFactoryProvider2: FactoryProvider = {
            token: Provider2,
            useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1],
          };

          @featureModule({
            providersPerMod: [Provider1, useFactoryProvider2],
            exports: [Provider1, Provider2],
          })
          class Module1 {}

          @featureModule({
            imports: [Module1],
            providersPerMod: [Provider2, Provider3],
            exports: [Module1, Provider2, Provider3],
          })
          class Module2 {}

          @rootModule({
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

          @featureModule({
            exports: [Provider1],
            providersPerMod: [Provider1, Provider2],
          })
          class Module1 {}

          @featureModule({
            exports: [Provider1, Provider2],
            providersPerMod: [{ token: Provider1, useClass: Provider1 }, Provider2],
          })
          class Module2 {
            static withParams() {
              return { module: Module2 };
            }
          }

          const moduleWithParams = Module2.withParams();

          @rootModule({
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
          @controller()
          class SomeController {}

          @featureModule({
            providersPerMod: [Provider1],
            exports: [Provider1],
          })
          class Module1 {}

          @featureModule({
            providersPerMod: [{ token: Provider1, useValue: 'one' }],
            exports: [Provider1],
          })
          class Module2 {}

          @featureModule({
            imports: [Module1, Module2],
            controllers: [SomeController],
            resolvedCollisionsPerMod: [[Provider1, Module1]],
            exports: [Module1, Module2],
          })
          class Module3 {}

          @rootModule({
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
            [Provider1, { module: Module2, providers: [{ token: Provider1, useValue: 'one' }] }],
          ]);
        });

        it('for non-root module', () => {
          @controller()
          class SomeController {}

          @featureModule({
            providersPerMod: [Provider1],
            exports: [Provider1],
          })
          class Module1 {}

          @featureModule({
            providersPerMod: [{ token: Provider1, useValue: 'one' }],
            exports: [Provider1],
          })
          class Module2 {}

          @featureModule({
            imports: [Module1, Module2],
            controllers: [SomeController],
          })
          class Module3 {}

          @rootModule({
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

          @featureModule({
            exports: [Provider1, Provider2],
            providersPerReq: [{ token: Provider1, useToken: Provider1 }, Provider2],
          })
          class Module1 {}

          @featureModule({
            imports: [Module1],
            exports: [Module1, Provider2, Provider3],
            providersPerReq: [{ token: Provider2, useClass: Provider2 }, Provider3],
          })
          class Module2 {}

          @rootModule({
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

          @featureModule({
            exports: [Provider1, Provider2],
            providersPerReq: [{ token: Provider1, useToken: Provider1 }, Provider2],
          })
          class Module1 {}

          @featureModule({
            imports: [Module1],
            exports: [Module1, Provider2, Provider3],
            providersPerReq: [{ token: Provider2, useClass: Provider2 }, Provider3],
          })
          class Module2 {}

          @rootModule({
            imports: [Module2],
            resolvedCollisionsPerReq: [[Provider2, Module2]],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          expect(() =>
            mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())
          ).not.toThrow();
          expect([...mock.importedProvidersPerReq]).toEqual([
            [Provider1, { module: Module1, providers: [{ token: Provider1, useToken: Provider1 }] }],
            [Provider2, { module: Module2, providers: [{ token: Provider2, useClass: Provider2 }] }],
            [Provider3, { module: Module2, providers: [Provider3] }],
          ]);
        });

        it('exporting duplicates of Provider1 from Module1 and Module2', () => {
          class Provider1 {}
          class Provider2 {}

          @featureModule({
            exports: [Provider1],
            providersPerReq: [{ token: Provider1, useClass: Provider1 }, Provider2],
          })
          class Module0 {}

          @featureModule({
            exports: [Provider1, Provider2],
            providersPerReq: [{ token: Provider1, useToken: Provider1 }, Provider2],
          })
          class Module1 {}

          @rootModule({
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

          @featureModule({
            exports: [Provider1, Provider2],
            providersPerReq: [{ token: Provider1, useClass: Provider2 }, Provider2],
          })
          class Module1 {}

          @featureModule({
            exports: [Provider1, Provider2],
            providersPerReq: [
              { token: Provider1, useToken: Provider1 },
              { token: Provider2, useToken: Provider1 },
            ],
          })
          class Module2 {}

          @rootModule({
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
            [Provider1, { module: Module2, providers: [{ token: Provider1, useToken: Provider1 }] }],
            [Provider2, { module: Module1, providers: [Provider2] }],
          ]);
        });
      });

      describe('mix per app, per mod or per req', () => {
        class Provider0 {}
        class Provider1 {}

        it('case 1', () => {
          @featureModule({
            exports: [Provider0],
            providersPerMod: [Provider0],
          })
          class Module0 {}

          @rootModule({
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
          @featureModule({
            exports: [Provider1],
            providersPerMod: [{ token: Provider1, useValue: 'fake' }],
          })
          class Module1 {}

          @rootModule({
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
            [Provider1, { module: Module1, providers: [{ token: Provider1, useValue: 'fake' }] }],
          ]);
        });

        it('case 2', () => {
          @featureModule({
            exports: [Provider1],
            providersPerReq: [{ token: Provider1, useClass: Provider1 }],
          })
          class Module0 {}

          @rootModule({
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
          @featureModule({
            exports: [Provider1],
            providersPerReq: [{ token: Provider1, useClass: Provider1 }],
          })
          class Module1 {}

          @rootModule({
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
            [Provider1, { module: Module1, providers: [{ token: Provider1, useClass: Provider1 }] }],
          ]);
        });

        it('double resolve', () => {
          @featureModule({
            exports: [Provider1],
            providersPerReq: [Provider1],
          })
          class Module1 {}

          @featureModule({
            exports: [Provider1],
            providersPerMod: [{ token: Provider1, useClass: Provider2 }],
          })
          class Module2 {}

          @rootModule({
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
          @featureModule({
            exports: [Provider1],
            providersPerReq: [{ token: Provider1, useClass: Provider1 }],
          })
          class Module1 {}

          @rootModule({
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
          @featureModule({
            exports: [Provider2],
            providersPerReq: [{ token: Provider2, useClass: Provider1 }],
          })
          class Module1 {}

          @rootModule({
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

        it('resolve case 3', () => {
          @featureModule({
            exports: [HttpBackend],
            providersPerReq: [{ token: HttpBackend, useValue: '' }],
          })
          class Module0 {}

          @rootModule({
            imports: [Module0],
            resolvedCollisionsPerReq: [[HttpBackend, AppModule]],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          expect(() =>
            mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())
          ).not.toThrow();
          expect([...mock.importedProvidersPerReq]).toEqual([]);
        });

        it('resolve 2 case 3', () => {
          @featureModule({
            exports: [Req],
            providersPerReq: [{ token: Req, useClass: Req }],
          })
          class Module1 {}

          @rootModule({
            imports: [Module1],
            resolvedCollisionsPerReq: [[Req, Module1]],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          expect(() =>
            mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())
          ).not.toThrow();
          expect([...mock.importedProvidersPerReq]).toEqual([
            [Req, { module: Module1, providers: [{ token: Req, useClass: Req }] }],
          ]);
        });

        it('case 4', () => {
          @featureModule({
            exports: [HttpBackend],
            providersPerReq: [{ token: HttpBackend, useValue: '' }],
          })
          class Module0 {}

          @rootModule({
            imports: [Module0],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          const msg = 'AppModule failed: exports from Module0 causes collision with HttpBackend.';
          expect(() => mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())).toThrow(msg);
        });

        it('resolve case 4', () => {
          @featureModule({
            exports: [HttpBackend],
            providersPerReq: [{ token: HttpBackend, useValue: '' }],
          })
          class Module0 {}

          @rootModule({
            imports: [Module0],
            resolvedCollisionsPerReq: [[HttpBackend, AppModule]],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          expect(() =>
            mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())
          ).not.toThrow();
          expect([...mock.importedProvidersPerReq]).toEqual([]);
        });

        it('resolved case 4', () => {
          @featureModule({
            exports: [HttpBackend],
            providersPerReq: [{ token: HttpBackend, useValue: '' }],
          })
          class Module1 {}

          @rootModule({
            imports: [Module1],
            resolvedCollisionsPerReq: [[HttpBackend, Module1]],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          expect(() =>
            mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())
          ).not.toThrow();
          expect([...mock.importedProvidersPerReq]).toEqual([
            [HttpBackend, { module: Module1, providers: [{ token: HttpBackend, useValue: '' }] }],
          ]);
        });
      });
    });
  });

  describe('getControllersMetadata()', () => {
    it('without @Controller decorator', () => {
      mock.meta.controllers = [class Controller1 {}];
      const msg = 'Collecting controller\'s metadata in MockModule failed: class "Controller1"';
      expect(() => transformControllersMetadata(mock.meta.controllers, 'MockModule')).toThrowError(msg);
    });

    it('controller with multiple @Route on single method', () => {
      const ctrlMetadata = { providersPerReq: [] } as ControllerMetadata;
      @controller(ctrlMetadata)
      class Controller1 {
        @route('GET', 'url1')
        method1() {}

        @route('POST', 'url2')
        @route('GET', 'url3')
        method2() {}
      }
      mock.meta.controllers = [Controller1];
      const metadata = transformControllersMetadata(mock.meta.controllers, 'MockModule');
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
            decorator: route,
            value: {
              httpMethod: 'GET',
              path: 'url1',
              guards: []
            },
            otherDecorators: [],
          },
        ],
        method2: [
          {
            decorator: route,
            value: routeMeta2,
            otherDecorators: [{ decorator: route, value: routeMeta3 }],
          },
          {
            decorator: route,
            value: routeMeta3,
            otherDecorators: [{ decorator: route, value: routeMeta2 }],
          },
        ],
      };
      expect(metadata.length).toBe(1);
      expect(metadata[0].controller === Controller1).toBe(true);
      expect(metadata[0].decoratorsAndValues).toEqual([{ decorator: controller, value: ctrlMetadata }]);
      expect(metadata[0].properties).toEqual(methods);
    });
  });
});
