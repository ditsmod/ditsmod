import { describe, beforeEach, expect, it } from 'vitest';

import { injectable, Provider, Injector } from '#di';
import { featureModule } from '#decorators/module.js';
import { rootModule } from '#decorators/root-module.js';
import { NormalizedMeta } from '#types/normalized-meta.js';
import { ModuleFactory } from '#init/module-factory.js';
import { defaultProvidersPerApp } from './default-providers-per-app.js';
import { ModuleManager } from '#init/module-manager.js';
import { GlobalProviders, ImportObj, MetadataPerMod1 } from '#types/metadata-per-mod.js';
import { ModuleType, Level } from '#types/mix.js';
import { ModuleMetadata, BaseModuleWithParams } from '#types/module-metadata.js';
import { getImportedProviders } from '#utils/get-imports.js';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { clearDebugClassNames } from '#utils/get-debug-class-name.js';
import { RootModuleMetadata } from '#types/root-module-metadata.js';

type ModRefId = ModuleType | BaseModuleWithParams;

describe('ModuleFactory', () => {
  class Provider1 {}
  class Provider2 {}
  class Provider3 {}
  class Provider4 {}

  @injectable()
  class MockModuleFactory extends ModuleFactory {
    injectorPerMod: Injector;
    declare prefixPerMod: string;
    override moduleName = 'MockModule';
    override meta = new NormalizedMeta();
    override appMetadataMap = new Map<ModuleType, MetadataPerMod1>();
    override importedProvidersPerMod = new Map<any, ImportObj>();
    override importedMultiProvidersPerMod = new Map<ModRefId, Provider[]>();
    override importedExtensions = new Map<ModRefId, Provider[]>();
    // override guardsPerMod1: GuardPerMod1[] = [];

    override exportGlobalProviders(moduleManager: ModuleManager, providersPerApp: Provider[]) {
      return super.exportGlobalProviders(moduleManager, providersPerApp);
    }

    override getResolvedCollisionsPerLevel(level: Level, token1: any) {
      return super.getResolvedCollisionsPerLevel(level, token1);
    }
  }

  let mock: MockModuleFactory;
  let moduleManager: ModuleManager;

  beforeEach(() => {
    clearDebugClassNames();
    const injectorPerApp = Injector.resolveAndCreate([...defaultProvidersPerApp, MockModuleFactory]);
    mock = injectorPerApp.get(MockModuleFactory);
    moduleManager = new ModuleManager(new SystemLogMediator({ moduleName: 'fakeName' }));
  });

  describe('exportGlobalProviders()', () => {
    it('forbidden reexports providers', () => {
      @featureModule({
        providersPerMod: [Provider1],
      })
      class Module1 {}

      @featureModule({
        imports: [Module1],
        exports: [Provider1],
      })
      class Module2 {}

      @rootModule({ imports: [Module2] })
      class AppModule {}

      const msg = 'Module2 failed: if "Provider1" is a provider,';
      expect(() => moduleManager.scanRootModule(AppModule)).toThrow(msg);
    });

    it('allow reexports module', () => {
      @featureModule({
        providersPerMod: [Provider1],
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
      expect(getImportedProviders(mock.importedProvidersPerMod)).toEqual([Provider1]);
    });

    it('merge providers from reexported modules', () => {
      @featureModule({
        providersPerMod: [Provider1],
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
      expect(getImportedProviders(mock.importedProvidersPerMod)).toEqual([Provider1, Provider2]);
    });

    it('exported providers order', () => {
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
    });

    it('import dependencies of global imported providers', () => {
      @injectable()
      class Provider2 {
        constructor(provider1: Provider1) {}
      }

      @featureModule({
        providersPerMod: [Provider1],
        exports: [Provider1],
      })
      class Module1 {}

      @featureModule({
        imports: [Module1],
        providersPerMod: [Provider2],
        exports: [Provider2, Module1],
      })
      class Module2 {}

      @rootModule({
        imports: [Module2],
        providersPerMod: [Provider3],
        exports: [Module2, Provider3],
      })
      class AppModule {}

      moduleManager.scanRootModule(AppModule);
      expect(() => mock.exportGlobalProviders(moduleManager, [])).not.toThrow();
      expect(getImportedProviders(mock.importedProvidersPerMod)).toEqual([Provider1, Provider2, Provider3]);

      const importObj = new ImportObj();
      importObj.modRefId = Module1;
      importObj.providers = [Provider1];
      // expect(mock?.importedProvidersPerMod.get(Provider1)).toEqual(importObj);
      importObj.modRefId = Module2;
      importObj.providers = [Provider2];
      // expect(mock?.importedProvidersPerMod.get(Provider2)).toEqual(importObj);
      importObj.modRefId = AppModule;
      importObj.providers = [Provider3];
      // expect(mock?.importedProvidersPerMod.get(Provider3)).toEqual(importObj);
    });
  });

  describe('bootstrap()', () => {
    class Provider8 {}
    const overriddenProvider8: Provider = { token: Provider8, useValue: 'overridden' };
    class Provider9 {}

    // describe('exporting providers order', () => {
    //   @featureModule({
    //     exports: [Provider0],
    //     providersPerMod: [Provider0],
    //   })
    //   class Module0 {}

    //   @featureModule({
    //     imports: [Module0],
    //     exports: [Module0, Provider1, Provider2, Provider3],
    //     providersPerMod: [Provider1, Provider2, Provider3],
    //   })
    //   class Module1 {}

    //   @featureModule({
    //     imports: [Module1],
    //     exports: [Module1, Provider5, Provider8],
    //     providersPerMod: [Provider4, Provider5, Provider6],
    //     providersPerMod: [Provider7, Provider8],
    //   })
    //   class Module2 {}

    //   @controller()
    //   class Ctrl {
    //     method() {}
    //   }

    //   @featureModule({
    //     imports: [Module2],
    //     exports: [Module2],
    //     providersPerMod: [Provider9, overriddenProvider8],
    //     controllers: [Ctrl],
    //   })
    //   class Module3 {}

    //   it('case 0', () => {
    //     @featureModule({ controllers: [Ctrl] })
    //     class Module1 {}

    //     @rootModule({
    //       imports: [Module1],
    //     })
    //     class AppModule {}

    //     const meta = moduleManager.scanRootModule(AppModule);
    //     expect(meta.providersPerMod).toEqual(meta.exportedProvidersPerMod);
    //     expect(meta.providersPerMod).toEqual([]);

    //     mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set());
    //     expect(mock.appMetadataMap.get(AppModule)?.meta.exportedProvidersPerMod).toEqual([]);
    //   });

    //   it('case 1', () => {
    //     const injectorPerApp = Injector.resolveAndCreate([...defaultProvidersPerApp]);

    //     mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
    //     mock.injectorPerMod = injectorPerApp;
    //     moduleManager.scanModule(Module3);
    //     mock.bootstrap([], new GlobalProviders(), '', Module3, moduleManager, new Set());

    //     const mod0 = mock.appMetadataMap.get(Module0);
    //     const moduleExtract: ModuleExtract = { path: '', moduleName: 'Module0', isExternal: false };
    //     const providerPerMod0: Provider = {
    //       token: ModuleExtract,
    //       useValue: moduleExtract,
    //     };
    //     expect(mod0?.meta.providersPerMod).toEqual([providerPerMod0, Provider0]);
    //     expect(mod0?.meta.providersPerMod).toEqual([]);
    //     expect(mod0?.meta.decorator).toBe(featureModule);

    //     const mod1 = mock.appMetadataMap.get(Module1);
    //     const moduleExtract2: ModuleExtract = { path: '', moduleName: 'Module1', isExternal: false };
    //     const providerPerMod1: Provider = {
    //       token: ModuleExtract,
    //       useValue: moduleExtract2,
    //     };
    //     expect(mod1?.meta.providersPerMod).toEqual([providerPerMod1, Provider1, Provider2, Provider3]);

    //     const tokensPerMod = getImportedTokens(mod1?.importedTokensMap.perMod);
    //     expect(tokensPerMod).toEqual([Provider0]);

    //     expect(mod1?.meta.providersPerMod).toEqual([]);
    //     expect(mod1?.meta.decorator).toBe(featureModule);

    //     const mod2 = mock.appMetadataMap.get(Module2);
    //     const moduleExtract3: ModuleExtract = { path: '', moduleName: 'Module2', isExternal: false };
    //     const providerPerMod2: Provider = {
    //       token: ModuleExtract,
    //       useValue: moduleExtract3,
    //     };
    //     expect(mod2?.meta.providersPerMod).toEqual([providerPerMod2, Provider4, Provider5, Provider6]);

    //     const tokensPerMod2 = getImportedTokens(mod2?.importedTokensMap.perMod);
    //     expect(tokensPerMod2).toEqual([Provider0, Provider1, Provider2, Provider3]);

    //     expect(mod2?.meta.providersPerMod).toEqual([Provider7, Provider8]);
    //     expect(mod2?.meta.decorator).toBe(featureModule);

    //     const mod3 = mock.appMetadataMap.get(Module3);
    //     const moduleExtract4: ModuleExtract = { path: '', moduleName: 'Module3', isExternal: false };
    //     const providerPerMod3: Provider = {
    //       token: ModuleExtract,
    //       useValue: moduleExtract4,
    //     };
    //     expect(mod3?.meta.providersPerMod).toEqual([providerPerMod3]);

    //     // expect(mod3.providersPerMod).toEqual([Ctrl, [], Provider8, Provider9, overriddenProvider8]);
    //     expect(mod3?.meta.controllers).toEqual([Ctrl]);
    //     expect(mod3?.meta.decorator).toBe(featureModule);
    //   });

    //   it('case 2', () => {
    //     @rootModule({
    //       imports: [Module3],
    //     })
    //     class Module4 {}
    //     const providers: Provider[] = [...defaultProvidersPerApp, { token: Router, useValue: 'fake' }];
    //     const injectorPerApp = Injector.resolveAndCreate(providers);
    //     mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
    //     mock.injectorPerMod = injectorPerApp;
    //     moduleManager.scanModule(Module4);
    //     mock.bootstrap([], new GlobalProviders(), 'other', Module4, moduleManager, new Set());

    //     expect(mock.prefixPerMod).toBe('other');
    //     // expect(mock.router.find('GET', '/some/other').handle().controller).toBe(Ctrl);
    //     const moduleExtract: ModuleExtract = { path: 'other', moduleName: 'Module4', isExternal: false };
    //     const providerPerMod: Provider = {
    //       token: ModuleExtract,
    //       useValue: moduleExtract,
    //     };
    //     expect(mock.meta.providersPerMod).toEqual([providerPerMod]);

    //     expect(mock?.importedProvidersPerMod).toBeDefined();
    //     const importObj = new ImportObj();
    //     importObj.modRefId = Module0;
    //     importObj.providers = [Provider0];
    //     expect(mock?.importedProvidersPerMod.get(Provider0)).toEqual(importObj);

    //     importObj.modRefId = Module1;
    //     importObj.providers = [Provider1];
    //     expect(mock?.importedProvidersPerMod.get(Provider1)).toEqual(importObj);
    //     importObj.providers = [Provider2];
    //     expect(mock?.importedProvidersPerMod.get(Provider2)).toEqual(importObj);
    //     importObj.providers = [Provider3];
    //     expect(mock?.importedProvidersPerMod.get(Provider3)).toEqual(importObj);

    //     importObj.modRefId = Module2;
    //     importObj.providers = [Provider5];
    //     expect(mock?.importedProvidersPerMod.get(Provider5)).toEqual(importObj);

    //     expect(mock.meta.providersPerMod).toEqual([]);

    //     importObj.modRefId = Module2;
    //     importObj.providers = [Provider8];
    //     expect(mock?.importedProvidersPerMod.get(Provider8)).toEqual(importObj);
    //     expect(mock.meta.decorator).toBe(rootModule);
    //   });

    //   it('importDependenciesOfImportedProviders() case 1', () => {
    //     class Provider1 {}

    //     @injectable()
    //     class Provider2 {
    //       constructor(provider1: Provider1) {}
    //     }

    //     class Provider3 {}

    //     @featureModule({
    //       providersPerMod: [Provider1],
    //       exports: [Provider1],
    //     })
    //     class Module1 {}

    //     @featureModule({
    //       imports: [Module1],
    //       providersPerMod: [Provider2],
    //       exports: [Provider2],
    //     })
    //     class Module2 {}

    //     @featureModule({
    //       imports: [Module2],
    //       providersPerMod: [Provider3],
    //       controllers: [Ctrl],
    //     })
    //     class Module3 {}

    //     const injectorPerApp = Injector.resolveAndCreate([...defaultProvidersPerApp]);

    //     mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
    //     mock.injectorPerMod = injectorPerApp;
    //     moduleManager.scanModule(Module3);
    //     mock.bootstrap([], new GlobalProviders(), '', Module3, moduleManager, new Set());

    //     const mod3 = mock.appMetadataMap.get(Module3);
    //     expect(mod3?.meta.providersPerMod).toEqual([Provider3]);

    //     expect(mock?.importedProvidersPerMod).toBeDefined();
    //     const importObj = new ImportObj();
    //     importObj.modRefId = Module2;
    //     importObj.providers = [Provider2];
    //     expect(mock?.importedProvidersPerMod.get(Provider2)).toEqual(importObj);
    //     expect(mod3?.meta.decorator).toBe(featureModule);
    //   });

    //   it('should throw an error about not proper provider exports', () => {
    //     @featureModule({
    //       exports: [Provider1, Provider2, Provider3],
    //       providersPerMod: [Provider1, Provider3],
    //     })
    //     class Module6 {}

    //     @rootModule({
    //       imports: [Module6],
    //     })
    //     class Module7 {}
    //     const providers = [...defaultProvidersPerApp] as Provider[];
    //     const injectorPerApp = Injector.resolveAndCreate(providers);
    //     mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
    //     mock.injectorPerMod = injectorPerApp;
    //     const msg = 'Module6 failed: if "Provider2" is a provider';
    //     expect(() => moduleManager.scanModule(Module7)).toThrow(msg);
    //   });
    // });

    describe('Providers collisions', () => {
      // describe('per a module', () => {
      //   it('in global providers', () => {
      //     class Provider1 {}

      //     @featureModule({
      //       providersPerMod: [{ token: Provider1, useValue: 'one' }],
      //       exports: [Provider1],
      //     })
      //     class Module1 {}

      //     @featureModule({
      //       imports: [Module1],
      //       providersPerMod: [Provider1],
      //       exports: [Module1, Provider1],
      //     })
      //     class Module2 {}

      //     @rootModule({
      //       imports: [Module2],
      //       exports: [Module2],
      //     })
      //     class AppModule {}

      //     moduleManager.scanRootModule(AppModule);
      //     const msg = 'AppModule failed: exports from Module1, Module2 causes collision with Provider1.';
      //     expect(() => mock.exportGlobalProviders(moduleManager, [])).toThrow(msg);
      //   });

      //   it('in AppModule with exported provider, but it has resolvedCollisionsPerMod array', () => {
      //     class Provider1 {}

      //     @featureModule({
      //       providersPerMod: [{ token: Provider1, useValue: 'one' }],
      //       exports: [Provider1],
      //     })
      //     class Module1 {}

      //     @featureModule({
      //       imports: [Module1],
      //       providersPerMod: [Provider1],
      //       exports: [Module1, Provider1],
      //     })
      //     class Module2 {}

      //     @rootModule({
      //       imports: [Module2],
      //       resolvedCollisionsPerMod: [[Provider1, Module1]],
      //       exports: [Module2],
      //     })
      //     class AppModule {}

      //     moduleManager.scanRootModule(AppModule);
      //     expect(() => mock.exportGlobalProviders(moduleManager, [])).not.toThrow();
      //     expect([...mock.importedProvidersPerMod]).toEqual([
      //       [Provider1, { modRefId: Module1, providers: [{ token: Provider1, useValue: 'one' }] }],
      //     ]);
      //   });

      //   it('identical duplicates but not collision with exported providers', () => {
      //     class Provider1 {}

      //     @featureModule({
      //       providersPerMod: [{ token: Provider1, useValue: 'one' }],
      //       exports: [Provider1],
      //     })
      //     class Module1 {}

      //     @featureModule({
      //       imports: [Module1],
      //       providersPerMod: [{ token: Provider1, useValue: 'one' }],
      //       exports: [Module1, Provider1],
      //     })
      //     class Module2 {}

      //     @rootModule({
      //       imports: [Module2],
      //       exports: [Module2],
      //     })
      //     class AppModule {}

      //     moduleManager.scanRootModule(AppModule);
      //     expect(() => mock.exportGlobalProviders(moduleManager, [])).not.toThrow();
      //   });

      //   it('import Module2 and reexport Module1 with collision - Provider2', () => {
      //     class Provider1 {}
      //     class Provider2 {}
      //     class Provider3 {}
      //     const factory = makePropDecorator();

      //     class ClassWithFactory {
      //       @factory()
      //       method1() {}
      //     }

      //     @featureModule({
      //       providersPerMod: [
      //         Provider1,
      //         { token: Provider2, useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] },
      //       ],
      //       exports: [Provider1, Provider2],
      //     })
      //     class Module1 {}

      //     @featureModule({
      //       imports: [Module1],
      //       providersPerMod: [Provider2, Provider3],
      //       exports: [Module1, Provider2, Provider3],
      //     })
      //     class Module2 {}

      //     @rootModule({
      //       imports: [Module2],
      //     })
      //     class AppModule {}

      //     moduleManager.scanRootModule(AppModule);
      //     const msg = 'AppModule failed: exports from Module1, Module2 causes collision with Provider2.';
      //     expect(() => mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())).toThrow(msg);
      //   });

      //   it('import Module2 and Module1 with collision - Provider1', () => {
      //     class Provider1 {}
      //     class Provider2 {}
      //     const factory = makePropDecorator();

      //     class ClassWithFactory {
      //       @factory()
      //       method1() {}
      //     }

      //     @featureModule({
      //       exports: [Provider1],
      //       providersPerMod: [{ token: Provider1, useClass: Provider1 }, Provider2],
      //     })
      //     class Module1 {}

      //     @featureModule({
      //       exports: [Provider1, Provider2],
      //       providersPerMod: [
      //         Provider1,
      //         { token: Provider2, useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] },
      //       ],
      //     })
      //     class Module2 {}

      //     @rootModule({ imports: [Module1, Module2] })
      //     class AppModule {}

      //     moduleManager.scanRootModule(AppModule);
      //     const msg = 'AppModule failed: exports from Module1, Module2 causes collision with Provider1.';
      //     expect(() => mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())).toThrow(msg);
      //   });

      //   it('import multi providers that has token Provider1', () => {
      //     class Provider1 {}
      //     class Provider2 {}

      //     @featureModule({
      //       exports: [Provider1],
      //       providersPerMod: [
      //         { token: Provider1, useValue: 'value1 of module1', multi: true },
      //         { token: Provider1, useValue: 'value2 of module1', multi: true },
      //         Provider2,
      //       ],
      //     })
      //     class Module1 {}

      //     @featureModule({
      //       exports: [Provider1, Provider2],
      //       providersPerMod: [
      //         { token: Provider1, useValue: 'value1 of module2', multi: true },
      //         { token: Provider1, useValue: 'value2 of module2', multi: true },
      //         { token: Provider1, useValue: 'value3 of module2', multi: true },
      //         { token: Provider2, useValue: 'value100' },
      //       ],
      //     })
      //     class Module2 {}

      //     @rootModule({ imports: [Module1, Module2] })
      //     class AppModule {}

      //     moduleManager.scanRootModule(AppModule);
      //     const callback = () => mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set());
      //     expect(callback).not.toThrow();
      //     expect([...mock.importedProvidersPerMod]).toEqual([
      //       [
      //         Provider2,
      //         {
      //           modRefId: Module2,
      //           providers: [{ token: Provider2, useValue: 'value100' }],
      //         },
      //       ],
      //     ]);
      //     expect([...mock.importedMultiProvidersPerMod]).toEqual([
      //       [
      //         Module1,
      //         [
      //           { token: Provider1, useValue: 'value1 of module1', multi: true },
      //           { token: Provider1, useValue: 'value2 of module1', multi: true },
      //         ],
      //       ],
      //       [
      //         Module2,
      //         [
      //           { token: Provider1, useValue: 'value1 of module2', multi: true },
      //           { token: Provider1, useValue: 'value2 of module2', multi: true },
      //           { token: Provider1, useValue: 'value3 of module2', multi: true },
      //         ],
      //       ],
      //     ]);
      //   });

      //   it('should throw an error when resolving multi providers duplicates', () => {
      //     class Provider1 {}

      //     @featureModule({
      //       exports: [Provider1],
      //       providersPerMod: [{ token: Provider1, useValue: 'value1 of module1', multi: true }],
      //     })
      //     class Module1 {}

      //     @featureModule({
      //       exports: [Provider1],
      //       providersPerMod: [{ token: Provider1, useValue: 'value1 of module2', multi: true }],
      //     })
      //     class Module2 {}

      //     @rootModule({
      //       imports: [Module1, Module2],
      //       resolvedCollisionsPerMod: [[Provider1, Module1]],
      //     })
      //     class AppModule {}

      //     moduleManager.scanRootModule(AppModule);
      //     const msg = 'but Provider1 is a token of the multi providers,';
      //     expect(() => mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())).toThrow(msg);
      //   });

      //   it('exporting duplicates with "multi == true" not to throw', () => {
      //     class Provider1 {}
      //     class Provider2 {}

      //     @featureModule({
      //       exports: [Provider1],
      //       providersPerMod: [{ token: Provider1, useClass: Provider1, multi: true }, Provider2],
      //     })
      //     class Module1 {}

      //     @featureModule({
      //       exports: [Provider1],
      //       providersPerMod: [{ token: Provider1, useClass: Provider1, multi: true }],
      //     })
      //     class Module2 {}

      //     @rootModule({
      //       imports: [Module1, Module2],
      //       providersPerApp: [{ token: Router, useValue: 'fake' }],
      //     })
      //     class AppModule {}

      //     moduleManager.scanRootModule(AppModule);
      //     expect(() =>
      //       mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set()),
      //     ).not.toThrow();
      //   });

      //   it('exporting duplicates of Provider2, declared in resolvedCollisionsPerMod of root module', () => {
      //     class Provider1 {}
      //     class Provider2 {}
      //     class Provider3 {}
      //     const factory = makePropDecorator();

      //     class ClassWithFactory {
      //       @factory()
      //       method1() {}
      //     }
      //     const useFactoryProvider2: FactoryProvider = {
      //       token: Provider2,
      //       useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1],
      //     };

      //     @featureModule({
      //       providersPerMod: [Provider1, useFactoryProvider2],
      //       exports: [Provider1, Provider2],
      //     })
      //     class Module1 {}

      //     @featureModule({
      //       imports: [Module1],
      //       providersPerMod: [Provider2, Provider3],
      //       exports: [Module1, Provider2, Provider3],
      //     })
      //     class Module2 {}

      //     @rootModule({
      //       imports: [Module2],
      //       resolvedCollisionsPerMod: [[Provider2, Module1]],
      //     })
      //     class AppModule {}

      //     moduleManager.scanRootModule(AppModule);
      //     expect(() =>
      //       mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set()),
      //     ).not.toThrow();
      //     expect([...mock.importedProvidersPerMod]).toEqual([
      //       [Provider1, { modRefId: Module1, providers: [Provider1] }],
      //       [Provider2, { modRefId: Module1, providers: [useFactoryProvider2] }],
      //       [Provider3, { modRefId: Module2, providers: [Provider3] }],
      //     ]);
      //   });

      //   it('exporting duplicates in Module2 (with params), but declared in resolvedCollisionsPerMod of root module', () => {
      //     class Provider1 {}
      //     class Provider2 {}

      //     @featureModule({
      //       exports: [Provider1],
      //       providersPerMod: [Provider1, Provider2],
      //     })
      //     class Module1 {}

      //     @featureModule({
      //       exports: [Provider1, Provider2],
      //       providersPerMod: [{ token: Provider1, useClass: Provider1 }, Provider2],
      //     })
      //     class Module2 {
      //       static withParams() {
      //         return { module: Module2 };
      //       }
      //     }

      //     const baseModuleWithParams = Module2.withParams();

      //     @rootModule({
      //       imports: [Module1, baseModuleWithParams],
      //       resolvedCollisionsPerMod: [[Provider1, Module1]],
      //     })
      //     class AppModule {}

      //     moduleManager.scanRootModule(AppModule);
      //     expect(() =>
      //       mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set()),
      //     ).not.toThrow();
      //     expect([...mock.importedProvidersPerMod]).toEqual([
      //       [Provider1, { modRefId: Module1, providers: [Provider1] }],
      //       [Provider2, { modRefId: baseModuleWithParams, providers: [Provider2] }],
      //     ]);
      //   });

      //   it('resolved collision for feature module', () => {
      //     @controller()
      //     class SomeController {}

      //     @featureModule({
      //       providersPerMod: [Provider1],
      //       exports: [Provider1],
      //     })
      //     class Module1 {}

      //     @featureModule({
      //       providersPerMod: [{ token: Provider1, useValue: 'one' }],
      //       exports: [Provider1],
      //     })
      //     class Module2 {}

      //     @featureModule({
      //       imports: [Module1, Module2],
      //       controllers: [SomeController],
      //       resolvedCollisionsPerMod: [[Provider1, Module1]],
      //       exports: [Module1, Module2],
      //     })
      //     class Module3 {}

      //     @rootModule({
      //       imports: [Module3],
      //       resolvedCollisionsPerMod: [[Provider1, Module2]],
      //     })
      //     class AppModule {}

      //     moduleManager.scanRootModule(AppModule);
      //     expect(() =>
      //       mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set()),
      //     ).not.toThrow();
      //     const mod3 = mock.appMetadataMap.get(Module3)!;
      //     expect([...mod3.importedTokensMap.perMod]).toEqual([
      //       [Provider1, { modRefId: Module1, providers: [Provider1] }],
      //     ]);
      //     expect([...mock.importedProvidersPerMod]).toEqual([
      //       [Provider1, { modRefId: Module2, providers: [{ token: Provider1, useValue: 'one' }] }],
      //     ]);
      //   });

      //   it('for feature module', () => {
      //     @controller()
      //     class SomeController {}

      //     @featureModule({
      //       providersPerMod: [Provider1],
      //       exports: [Provider1],
      //     })
      //     class Module1 {}

      //     @featureModule({
      //       providersPerMod: [{ token: Provider1, useValue: 'one' }],
      //       exports: [Provider1],
      //     })
      //     class Module2 {}

      //     @featureModule({
      //       imports: [Module1, Module2],
      //       controllers: [SomeController],
      //     })
      //     class Module3 {}

      //     @rootModule({
      //       imports: [Module3],
      //     })
      //     class AppModule {}

      //     moduleManager.scanModule(AppModule);
      //     const msg = 'Module3 failed: exports from Module1, Module2 causes collision with Provider1.';
      //     expect(() => mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set())).toThrow(msg);
      //   });
      // });

      describe('per a req', () => {
        it('exporting duplicates of Provider2', () => {
          @featureModule({
            exports: [Provider1, Provider2],
            providersPerMod: [{ token: Provider1, useToken: Provider1 }, Provider2],
          })
          class Module1 {}

          @featureModule({
            imports: [Module1],
            exports: [Module1, Provider2, Provider3],
            providersPerMod: [{ token: Provider2, useClass: Provider2 }, Provider3],
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

        it('exporting duplicates of Provider2, but declared in resolvedCollisionsPerMod of root module', () => {
          @featureModule({
            exports: [Provider1, Provider2],
            providersPerMod: [{ token: Provider1, useToken: Provider1 }, Provider2],
          })
          class Module1 {}

          @featureModule({
            imports: [Module1],
            exports: [Module1, Provider2, Provider3],
            providersPerMod: [{ token: Provider2, useClass: Provider2 }, Provider3],
          })
          class Module2 {}

          @rootModule({
            imports: [Module2],
            resolvedCollisionsPerMod: [[Provider2, Module2]],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          expect(() =>
            mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set()),
          ).not.toThrow();
          expect([...mock.importedProvidersPerMod]).toEqual([
            [Provider1, { modRefId: Module1, providers: [{ token: Provider1, useToken: Provider1 }] }],
            [Provider2, { modRefId: Module2, providers: [{ token: Provider2, useClass: Provider2 }] }],
            [Provider3, { modRefId: Module2, providers: [Provider3] }],
          ]);
        });

        it('exporting duplicates of Provider1 from Module1 and Module2', () => {
          @featureModule({
            exports: [Provider1],
            providersPerMod: [{ token: Provider1, useClass: Provider1 }, Provider2],
          })
          class Module0 {}

          @featureModule({
            exports: [Provider1, Provider2],
            providersPerMod: [{ token: Provider1, useToken: Provider1 }, Provider2],
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

        it('exporting duplicates of Provider1 from Module1 and Module2, but also includes in resolvedCollisionsPerMod of root module', () => {
          @featureModule({
            exports: [Provider1, Provider2],
            providersPerMod: [{ token: Provider1, useClass: Provider2 }, Provider2],
          })
          class Module1 {}

          @featureModule({
            exports: [Provider1, Provider2],
            providersPerMod: [
              { token: Provider1, useToken: Provider1 },
              { token: Provider2, useToken: Provider1 },
            ],
          })
          class Module2 {}

          @rootModule({
            imports: [Module1, Module2],
            resolvedCollisionsPerMod: [
              [Provider1, Module2],
              [Provider2, Module1],
            ],
          })
          class AppModule {}

          moduleManager.scanRootModule(AppModule);
          expect(() =>
            mock.bootstrap([], new GlobalProviders(), '', AppModule, moduleManager, new Set()),
          ).not.toThrow();
          expect([...mock.importedProvidersPerMod]).toEqual([
            [Provider1, { modRefId: Module2, providers: [{ token: Provider1, useToken: Provider1 }] }],
            [Provider2, { modRefId: Module1, providers: [Provider2] }],
          ]);
        });
      });
    });
  });
});
