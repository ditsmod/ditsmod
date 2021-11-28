import 'reflect-metadata';
import { Injectable } from '@ts-stack/di';

import { Module } from '../decorators/module';
import { RootModule } from '../decorators/root-module';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { RootMetadata } from '../models/root-metadata';
import { Logger, LoggerConfig } from '../types/logger';
import { Router } from '../types/router';
import { AppInitializer } from './app-initializer';
import { LogManager } from './log-manager';
import { FilterConfig, LogMediator } from './log-mediator';
import { ModuleManager } from './module-manager';
import { ModuleType, ModuleWithParams, ServiceProvider } from '../types/mix';
import { Controller } from '../decorators/controller';
import { ModConfig } from '../models/mod-config';
import { ImportObj, MetadataPerMod1 } from '../types/metadata-per-mod';
import { NODE_REQ } from '../constans';
import { Request } from '../services/request';

describe('AppInitializer', () => {
  @Injectable()
  class AppInitializerMock extends AppInitializer {
    override meta = new RootMetadata();

    constructor(public override moduleManager: ModuleManager, public override logMediator: LogMediator) {
      super(moduleManager, logMediator);
    }

    async init() {
      this.bootstrapProvidersPerApp();
      await this.bootstrapModulesAndExtensions();
    }

    override mergeRootMetadata(module: ModuleType | ModuleWithParams) {
      return super.mergeRootMetadata(module);
    }

    override collectProvidersPerApp(meta: NormalizedModuleMetadata, moduleManager: ModuleManager) {
      return super.collectProvidersPerApp(meta, moduleManager);
    }

    override prepareProvidersPerApp(meta: NormalizedModuleMetadata, moduleManager: ModuleManager) {
      return super.prepareProvidersPerApp(meta, moduleManager);
    }

    override bootstrapModuleFactory(moduleManager: ModuleManager) {
      return super.bootstrapModuleFactory(moduleManager);
    }

    override getResolvedProvidersPerApp() {
      return super.getResolvedProvidersPerApp();
    }
  }

  function getImportedTokens(map: Map<any, ImportObj<ServiceProvider>> | undefined) {
    return [...(map || [])].map(([key]) => key);
  }

  let mock: AppInitializerMock;
  let moduleManager: ModuleManager;

  describe('collectProvidersPerApp()', () => {
    class Provider0 {}
    class Provider1 {}
    class Provider2 {}
    class Provider3 {}
    class Provider4 {}
    class Provider5 {}
    class Provider6 {}
    class Provider7 {}

    @Module({
      providersPerApp: [Provider0],
    })
    class Module0 {}

    @Module({
      providersPerApp: [Provider1],
    })
    class Module1 {}

    @Module({
      providersPerApp: [Provider2, Provider3, Provider4],
      imports: [Module1],
    })
    class Module2 {}

    @Module({
      providersPerApp: [Provider5, Provider6],
      imports: [Module2],
    })
    class Module3 {}

    @RootModule({
      imports: [Module3],
      providersPerApp: [{ provide: Provider1, useClass: Provider7 }],
      exports: [Module0],
    })
    class AppModule {}

    beforeEach(() => {
      const logMediator = new LogMediator(new LogManager());
      moduleManager = new ModuleManager(logMediator);
      mock = new AppInitializerMock(moduleManager, logMediator);
    });

    it('should collects providers from exports array without imports them', () => {
      const meta = moduleManager.scanRootModule(AppModule);
      const providersPerApp = mock.collectProvidersPerApp(meta, moduleManager);
      expect(providersPerApp.includes(Provider0)).toBe(true);
    });

    it('should collects providers in particular order', () => {
      const meta = moduleManager.scanRootModule(AppModule);
      const providersPerApp = mock.collectProvidersPerApp(meta, moduleManager);
      expect(providersPerApp).toEqual([Provider1, Provider2, Provider3, Provider4, Provider5, Provider6, Provider0]);
    });

    it('should works with moduleWithParams', () => {
      @Module()
      class Module6 {
        static withParams(providers: ServiceProvider[]): ModuleWithParams<Module6> {
          return { module: Module6, providersPerApp: providers };
        }
      }
      const modWithParams = Module6.withParams([Provider7]);
      const meta = moduleManager.scanModule(modWithParams);
      const providersPerApp = mock.collectProvidersPerApp(meta, moduleManager);
      expect(providersPerApp).toEqual([Provider7]);
    });

    it('should have empty array of providersPerApp', () => {
      @Module()
      class Module7 {}

      const meta = moduleManager.scanModule(Module7);
      const providersPerApp = mock.collectProvidersPerApp(meta, moduleManager);
      expect(providersPerApp).toEqual([]);
    });
  });

  describe('prepareProvidersPerApp()', () => {
    beforeEach(() => {
      const logMediator = new LogMediator(new LogManager());
      moduleManager = new ModuleManager(logMediator);
      mock = new AppInitializerMock(moduleManager, logMediator);
    });

    it('should throw an error about non-identical duplicates', () => {
      class Provider1 {}

      @Module({ providersPerApp: [{ provide: Provider1, useClass: Provider1 }] })
      class Module1 {}

      @Module({ providersPerApp: [Provider1] })
      class Module2 {}

      @RootModule({
        imports: [Module1, Module2],
      })
      class AppModule {}

      const meta = moduleManager.scanRootModule(AppModule);
      const msg = 'AppModule failed: exports from Module1, Module2 causes collision with Provider1.';
      expect(() => mock.prepareProvidersPerApp(meta, moduleManager)).toThrow(msg);
    });

    it('should works with duplicates in feature module and root module', () => {
      class Provider1 {}
      class Provider2 {}

      @Module({ providersPerApp: [{ provide: Provider1, useClass: Provider2 }] })
      class Module1 {}

      @Module({ providersPerApp: [Provider1] })
      class Module2 {}

      @RootModule({
        imports: [Module1, Module2],
        resolvedCollisionsPerApp: [[Provider1, Module1]],
      })
      class AppModule {}

      const meta = moduleManager.scanRootModule(AppModule);
      mock.mergeRootMetadata(meta.module);
      expect(() => mock.prepareProvidersPerApp(meta, moduleManager)).not.toThrow();
      expect(mock.getResolvedProvidersPerApp()).toEqual([{ provide: Provider1, useClass: Provider2 }]);
      expect(mock.meta.providersPerApp.length).toBe(3);
      expect(mock.meta.resolvedCollisionsPerApp.length).toBe(1);
    });

    it('should throw an error because resolvedCollisionsPerApp not properly setted module', () => {
      class Provider1 {}

      @Module()
      class Module0 {}

      @Module({ providersPerApp: [{ provide: Provider1, useClass: Provider1 }] })
      class Module1 {}

      @Module({ providersPerApp: [Provider1] })
      class Module2 {}

      @RootModule({
        imports: [Module1, Module2],
        resolvedCollisionsPerApp: [[Provider1, Module0]],
      })
      class AppModule {}

      const meta = moduleManager.scanRootModule(AppModule);
      mock.mergeRootMetadata(meta.module);
      const msg = `AppModule failed: Provider1 mapped with Module0, but Module0 is not imported`;
      expect(() => mock.prepareProvidersPerApp(meta, moduleManager)).toThrow(msg);
    });

    it('should throw an error because resolvedCollisionsPerApp not properly setted provider', () => {
      class Provider1 {}
      class Provider2 {}

      @Module({
        providersPerMod: [Provider2],
        exports: [Provider2],
      })
      class Module0 {}

      @Module({ providersPerApp: [{ provide: Provider1, useClass: Provider1 }] })
      class Module1 {}

      @Module({ providersPerApp: [Provider1] })
      class Module2 {}

      @RootModule({
        imports: [Module0, Module1, Module2],
        resolvedCollisionsPerApp: [[Provider1, Module0]],
      })
      class AppModule {}

      const meta = moduleManager.scanRootModule(AppModule);
      mock.mergeRootMetadata(meta.module);
      const msg = `AppModule failed: Provider1 mapped with Module0, but providersPerApp does not includes Provider1`;
      expect(() => mock.prepareProvidersPerApp(meta, moduleManager)).toThrow(msg);
    });

    it('should works with identical duplicates', () => {
      class Provider1 {}

      @Module({ providersPerApp: [Provider1] })
      class Module1 {}

      @Module({ providersPerApp: [Provider1] })
      class Module2 {}

      @RootModule({
        imports: [Module1, Module2],
      })
      class AppModule {}

      const meta = moduleManager.scanRootModule(AppModule);
      expect(() => mock.prepareProvidersPerApp(meta, moduleManager)).not.toThrow();
    });

    it('should works with duplicates in providersPerApp of root module', () => {
      class Provider1 {}

      @RootModule({ providersPerApp: [Provider1, Provider1, { provide: Provider1, useClass: Provider1 }] })
      class AppModule {}

      const meta = moduleManager.scanRootModule(AppModule);
      mock.mergeRootMetadata(meta.module);
      expect(() => mock.prepareProvidersPerApp(meta, moduleManager)).not.toThrow();
      expect(mock.meta.providersPerApp.length).toBe(3);
    });

    it('should works with empty "imports" array in root module', () => {
      @RootModule({ imports: [] })
      class AppModule {}
      const meta = moduleManager.scanRootModule(AppModule);
      mock.mergeRootMetadata(meta.module);
      expect(() => mock.prepareProvidersPerApp(meta, moduleManager)).not.toThrow();
    });
  });

  describe('export from root module', () => {
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

    @Controller()
    class Ctrl {}

    @Module({
      exports: [Provider0],
      providersPerMod: [Provider0],
    })
    class Module0 {}

    const obj1 = { provide: Provider1, useClass: Provider1 };
    @Module({
      controllers: [Ctrl],
      exports: [Provider1],
      providersPerMod: [obj1, Provider2],
    })
    class Module1 {}

    @Module({
      exports: [Provider3, Provider4],
      providersPerMod: [Provider3, Provider4],
    })
    class Module2 {
      static withParams() {
        return { module: Module2 };
      }
    }

    @Module({
      exports: [Provider5, Provider6, Provider7],
      providersPerReq: [Provider5, Provider6, Provider7],
    })
    class Module3 {}

    @Module({
      exports: [Provider8, Provider9],
      providersPerReq: [Provider8, Provider9],
    })
    class Module4 {}

    @Module({
      providersPerApp: [{ provide: Logger, useValue: 'fake value' }],
    })
    class Module5 {}

    const module2WithParams: ModuleWithParams = Module2.withParams();
    const module3WithParams: ModuleWithParams = { prefix: 'one', module: Module3 };
    const module4WithParams: ModuleWithParams = { guards: [], module: Module4 };
    @RootModule({
      serverName: 'custom-server',
      imports: [Module0, Module1, module2WithParams, Module5, module3WithParams, module4WithParams],
      exports: [Module0, module2WithParams, module3WithParams],
      providersPerApp: [
        Logger,
        { provide: Router, useValue: 'fake' },
        { provide: LogManager, useValue: new LogManager() },
      ],
    })
    class AppModule {}

    beforeEach(() => {
      const logMediator = new LogMediator(new LogManager());
      moduleManager = new ModuleManager(logMediator);
      mock = new AppInitializerMock(moduleManager, logMediator);
    });

    function checkGlobalProviders(mod: MetadataPerMod1 | undefined) {
      const tokensPerMod = getImportedTokens(mod?.importedTokensMap.perMod).slice(0, 3);
      expect(tokensPerMod).toEqual([Provider0, Provider3, Provider4]);
      const tokensPerReq = getImportedTokens(mod?.importedTokensMap.perReq).slice(0, 3);
      expect(tokensPerReq).toEqual([Provider5, Provider6, Provider7]);

      // Global providers per a module
      const perMod = mod?.importedTokensMap.perMod!;
      const expectedPerMod = new ImportObj();

      expectedPerMod.module = Module0;
      expectedPerMod.providers = [Provider0];
      expect(perMod.get(Provider0)).toEqual(expectedPerMod);

      expectedPerMod.module = module2WithParams;
      expectedPerMod.providers = [Provider3];
      expect(perMod.get(Provider3)).toEqual(expectedPerMod);
      expectedPerMod.providers = [Provider4];
      expect(perMod.get(Provider4)).toEqual(expectedPerMod);

      // Global providers per a request
      const perReq = mod?.importedTokensMap.perReq!;
      const expectedPerReq = new ImportObj();
      expectedPerReq.module = module3WithParams;
      expectedPerReq.providers = [Provider5];
      expect(perReq.get(Provider5)).toEqual(expectedPerReq);
      expectedPerReq.providers = [Provider6];
      expect(perReq.get(Provider6)).toEqual(expectedPerReq);
      expectedPerReq.providers = [Provider7];
      expect(perReq.get(Provider7)).toEqual(expectedPerReq);
    }

    it('Module0', async () => {
      moduleManager.scanRootModule(AppModule);
      const appMetadataMap = mock.bootstrapModuleFactory(moduleManager);
      const mod0 = appMetadataMap.get(Module0);
      expect(mod0?.meta.providersPerApp).toEqual([]);
      const providerPerMod: ServiceProvider = { provide: ModConfig, useValue: { prefixPerMod: '' } };
      expect(mod0?.meta.providersPerMod).toEqual([providerPerMod, Provider0]);
      expect(mod0?.meta.providersPerReq).toEqual([]);
      checkGlobalProviders(mod0);
    });

    it('Module1', async () => {
      moduleManager.scanRootModule(AppModule);
      const appMetadataMap = mock.bootstrapModuleFactory(moduleManager);
      const mod1 = appMetadataMap.get(Module1);
      expect(mod1?.meta.providersPerApp).toEqual([]);
      const providerPerMod: ServiceProvider = { provide: ModConfig, useValue: { prefixPerMod: '' } };
      expect(mod1?.meta.providersPerMod).toEqual([providerPerMod, obj1, Provider2]);
      checkGlobalProviders(mod1);
    });

    it('Module2', async () => {
      moduleManager.scanRootModule(AppModule);
      const appMetadataMap = mock.bootstrapModuleFactory(moduleManager);
      const mod2 = appMetadataMap.get(module2WithParams);
      expect(mod2?.meta.providersPerApp).toEqual([]);
      const providerPerMod: ServiceProvider = { provide: ModConfig, useValue: { prefixPerMod: '' } };
      expect(mod2?.meta.providersPerMod).toEqual([providerPerMod, Provider3, Provider4]);
      expect(mod2?.meta.providersPerReq).toEqual([]);
      checkGlobalProviders(mod2);
    });

    it('Module3', async () => {
      moduleManager.scanRootModule(AppModule);
      const appMetadataMap = mock.bootstrapModuleFactory(moduleManager);
      const mod3 = appMetadataMap.get(module3WithParams);
      expect(mod3?.meta.providersPerApp).toEqual([]);
      const providerPerMod: ServiceProvider = { provide: ModConfig, useValue: { prefixPerMod: 'one' } };
      expect(mod3?.meta.providersPerMod).toEqual([providerPerMod]);
      expect(mod3?.meta.providersPerReq).toEqual([Provider5, Provider6, Provider7]);
      checkGlobalProviders(mod3);
    });

    it('Module4', async () => {
      moduleManager.scanRootModule(AppModule);
      const appMetadataMap = mock.bootstrapModuleFactory(moduleManager);
      const mod4 = appMetadataMap.get(module4WithParams);
      expect(mod4?.meta.providersPerApp).toEqual([]);
      const providerPerMod: ServiceProvider = { provide: ModConfig, useValue: { prefixPerMod: '' } };
      expect(mod4?.meta.providersPerMod).toEqual([providerPerMod]);
      expect(mod4?.meta.providersPerReq).toEqual([Provider8, Provider9]);
      checkGlobalProviders(mod4);
    });

    it('AppModule', async () => {
      moduleManager.scanRootModule(AppModule);
      const appMetadataMap = mock.bootstrapModuleFactory(moduleManager);
      const root1 = appMetadataMap.get(AppModule);
      expect(root1?.meta.providersPerApp.slice(0, 2)).toEqual([Logger, { provide: Router, useValue: 'fake' }]);
      const providerPerMod: ServiceProvider = { provide: ModConfig, useValue: { prefixPerMod: '' } };
      expect(root1?.meta.providersPerMod).toEqual([providerPerMod]);
      expect(root1?.meta.providersPerReq).toEqual([]);
      checkGlobalProviders(root1);
      expect(getImportedTokens(root1?.importedTokensMap.perMod)).toEqual([Provider0, Provider3, Provider4, Provider1]);
      expect(getImportedTokens(root1?.importedTokensMap.perReq)).toEqual([
        Provider5,
        Provider6,
        Provider7,
        Provider8,
        Provider9,
      ]);
    });
  });

  describe('bootstrapProvidersPerApp()', () => {
    it('logMediator should has different instances in contexts of Application and AppInitializer', () => {
      const loggerSpy = jest.fn();

      class LogMediatorMock extends LogMediator {
        override flush() {
          const { level } = (this._logger as any).config;
          loggerSpy(level);
          super.flush();
        }
      }

      // Simulation of a call from the Application
      const logMediator = new LogMediatorMock(new LogManager());
      moduleManager = new ModuleManager(logMediator);
      mock = new AppInitializerMock(moduleManager, logMediator);

      // Simulation of a call from the AppModule
      const config2 = new LoggerConfig('trace');
      @RootModule({
        providersPerApp: [
          Router,
          { provide: LoggerConfig, useValue: config2 },
          { provide: LogMediator, useClass: LogMediatorMock },
        ],
      })
      class AppModule {}

      moduleManager.scanRootModule(AppModule);
      mock.bootstrapProvidersPerApp();
      // Here log used from Application
      logMediator.flush();
      mock.flushLogs();
      expect(loggerSpy.mock.calls[0]).toEqual(['info']);
      expect(loggerSpy.mock.calls[1]).toEqual(['trace']);
    });
  });

  describe('Providers collisions', () => {
    beforeEach(() => {
      const logMediator = new LogMediator(new LogManager());
      moduleManager = new ModuleManager(logMediator);
      mock = new AppInitializerMock(moduleManager, logMediator);
    });

    describe('per a module', () => {
      it('import Module2 and reexport Module1 with collision - Provider2', async () => {
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
          providersPerApp: [{ provide: LogManager, useValue: new LogManager() }],
        })
        class AppModule {}

        moduleManager.scanRootModule(AppModule);
        mock.bootstrapProvidersPerApp();
        const msg = 'AppModule failed: exports from several modules causes collision with Provider2.';
        await expect(mock.bootstrapModulesAndExtensions()).rejects.toThrow(msg);
      });

      it('import Module2 and Module1 with collision - Provider1', async () => {
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

        @RootModule({
          imports: [Module1, Module2],
          providersPerApp: [{ provide: LogManager, useValue: new LogManager() }],
        })
        class AppModule {}

        moduleManager.scanRootModule(AppModule);
        mock.bootstrapProvidersPerApp();
        const msg = 'AppModule failed: exports from several modules causes collision with Provider1.';
        await expect(mock.bootstrapModulesAndExtensions()).rejects.toThrow(msg);
      });

      it('mix exporting duplicates with "multi == true" per app and per mod', async () => {
        class Provider1 {}
        class Provider2 {}

        const ObjProviderPerApp: ServiceProvider = { provide: Provider1, useClass: Provider1, multi: true };
        const ObjProviderPerMod: ServiceProvider = { provide: Provider1, useClass: Provider1, multi: true };
        @Module({
          exports: [Provider1],
          providersPerMod: [ObjProviderPerMod, Provider2],
          providersPerApp: [ObjProviderPerApp],
        })
        class Module1 {}

        @Module({
          exports: [Provider1],
          providersPerMod: [ObjProviderPerMod],
        })
        class Module2 {}

        @RootModule({
          imports: [Module1, Module2],
          providersPerApp: [{ provide: LogManager, useValue: new LogManager() }],
        })
        class AppModule {}

        moduleManager.scanRootModule(AppModule);
        mock.bootstrapProvidersPerApp();
        const msg = 'AppModule failed: exports from several modules causes collision with Provider1.';
        await expect(mock.bootstrapModulesAndExtensions()).rejects.toThrow(msg);
      });

      it('exporting duplicates with "multi == true" not to throw', async () => {
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
          providersPerApp: [
            { provide: Router, useValue: 'fake' },
            { provide: LogManager, useValue: new LogManager() },
          ],
        })
        class AppModule {}

        moduleManager.scanRootModule(AppModule);
        mock.bootstrapProvidersPerApp();
        await expect(mock.bootstrapModulesAndExtensions()).resolves.not.toThrow();
      });

      it('exporting duplicates of Provider2, but declared in providersPerMod of root module', async () => {
        class Provider1 {}
        class Provider2 {}
        class Provider3 {}

        @Module({
          exports: [Provider1, Provider2],
          providersPerMod: [Provider1, { provide: Provider2, useFactory: () => {} }],
        })
        class Module1 {}
        @Module({
          imports: [Module1],
          exports: [Module1, Provider2, Provider3],
          providersPerMod: [Provider2, Provider3],
        })
        class Module2 {}

        @RootModule({
          imports: [Module2],
          providersPerMod: [Provider2],
          providersPerApp: [
            { provide: Router, useValue: 'fake' },
            { provide: LogManager, useValue: new LogManager() },
          ],
        })
        class AppModule {}

        moduleManager.scanRootModule(AppModule);
        mock.bootstrapProvidersPerApp();
        await expect(mock.bootstrapModulesAndExtensions()).resolves.not.toThrow();
      });

      it('exporting duplicates of Provider1 from Module1 and Module2, but declared in providersPerMod of root module', async () => {
        class Provider1 {}
        class Provider2 {}

        @Module({
          exports: [Provider1],
          providersPerMod: [{ provide: Provider1, useClass: Provider1 }, Provider2],
        })
        class Module0 {}

        @Module({
          exports: [Provider1, Provider2],
          providersPerMod: [Provider1, Provider2],
        })
        class Module1 {
          static withParams() {
            return { module: Module1 };
          }
        }

        @RootModule({
          imports: [Module0, Module1.withParams()],
          providersPerMod: [Provider1],
          providersPerApp: [
            { provide: Router, useValue: 'fake' },
            { provide: LogManager, useValue: new LogManager() },
          ],
        })
        class AppModule {}

        moduleManager.scanRootModule(AppModule);
        mock.bootstrapProvidersPerApp();
        await expect(mock.bootstrapModulesAndExtensions()).resolves.not.toThrow();
      });
    });

    describe('per a req', () => {
      class Provider1 {}
      class Provider2 {}
      class Provider3 {}

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

      @Module({
        imports: [Module1],
        exports: [Module1, Provider2, Provider3],
        providersPerReq: [{ provide: Provider2, useClass: Provider2 }, Provider3],
      })
      class Module2 {}

      it('exporting duplicates of Provider2', async () => {
        @RootModule({
          imports: [Module2],
          providersPerApp: [{ provide: LogManager, useValue: new LogManager() }],
        })
        class AppModule {}

        moduleManager.scanRootModule(AppModule);
        mock.bootstrapProvidersPerApp();
        const msg = 'AppModule failed: exports from several modules causes collision with Provider2.';
        await expect(mock.bootstrapModulesAndExtensions()).rejects.toThrow(msg);
      });

      it('exporting duplicates of Provider2, but declared in providersPerReq of root module', async () => {
        @RootModule({
          imports: [Module2],
          providersPerReq: [Provider2],
          providersPerApp: [
            { provide: Router, useValue: 'fake' },
            { provide: LogManager, useValue: new LogManager() },
          ],
        })
        class AppModule {}

        moduleManager.scanRootModule(AppModule);
        mock.bootstrapProvidersPerApp();
        await expect(mock.bootstrapModulesAndExtensions()).resolves.not.toThrow();
      });

      it('exporting duplicates of Provider1 from Module1 and Module2', async () => {
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
          providersPerApp: [{ provide: LogManager, useValue: new LogManager() }],
        })
        class AppModule {}

        moduleManager.scanRootModule(AppModule);
        mock.bootstrapProvidersPerApp();
        const msg = 'AppModule failed: exports from several modules causes collision with Provider1.';
        await expect(mock.bootstrapModulesAndExtensions()).rejects.toThrow(msg);
      });

      it('exporting duplicates of Provider1 from Module1 and Module2, but declared in providersPerReq of root module', async () => {
        @RootModule({
          imports: [Module0, Module1],
          providersPerReq: [Provider1],
          providersPerApp: [
            { provide: Router, useValue: 'fake' },
            { provide: LogManager, useValue: new LogManager() },
          ],
        })
        class AppModule {}

        moduleManager.scanRootModule(AppModule);
        mock.bootstrapProvidersPerApp();
        await expect(mock.bootstrapModulesAndExtensions()).resolves.not.toThrow();
      });
    });

    describe('mix per app, per mod or per req', () => {
      class Provider0 {}
      class Provider1 {}
      class Provider2 {}
      class Provider3 {}

      it('case 1', async () => {
        @Module({
          exports: [Provider0, Provider1, Request, NODE_REQ, Provider3],
          providersPerMod: [Provider0],
          providersPerReq: [
            { provide: Provider1, useClass: Provider1 },
            Provider2,
            { provide: NODE_REQ, useValue: '' },
            Provider3,
            { provide: Request, useClass: Request },
          ],
        })
        class Module0 {}

        @RootModule({
          imports: [Module0],
          providersPerApp: [Provider0, { provide: LogManager, useValue: new LogManager() }],
          providersPerMod: [Provider1],
          providersPerReq: [],
        })
        class AppModule {}

        moduleManager.scanRootModule(AppModule);
        mock.bootstrapProvidersPerApp();
        const msg =
          'AppModule failed: exports from several modules causes collision with Provider0, Provider1, Request, InjectionToken NODE_REQ.';
        await expect(mock.bootstrapModulesAndExtensions()).rejects.toThrow(msg);
      });
    });
  });

  describe('init()', () => {
    const testMethodSpy = jest.fn();
    class LogMediatorMock1 extends LogMediator {
      testMethod(level: keyof Logger, filterConfig: FilterConfig = {}, ...args: any[]) {
        testMethodSpy();
        this.setLog(level, filterConfig, `${args}`);
      }
    }
    class LogMediatorMock2 extends LogMediator {}

    @Module({ providersPerApp: [{ provide: LogMediator, useClass: LogMediatorMock2 }] })
    class Module1 {}

    @RootModule({
      imports: [Module1],
      providersPerApp: [
        { provide: Router, useValue: 'fake' },
        { provide: LogMediator, useClass: LogMediatorMock1 },
        { provide: LogManager, useValue: new LogManager() },
      ],
    })
    class AppModule {}

    beforeEach(() => {
      testMethodSpy.mockRestore();
      const logMediator = new LogMediator(new LogManager());
      moduleManager = new ModuleManager(logMediator);
      mock = new AppInitializerMock(moduleManager, logMediator);
    });

    it('logs should collects between two init()', async () => {
      expect(mock.logMediator.buffer).toHaveLength(0);
      expect(mock.logMediator).toBeInstanceOf(LogMediator);
      expect(mock.logMediator).not.toBeInstanceOf(LogMediatorMock1);
      moduleManager.scanRootModule(AppModule);

      // First init
      await mock.init();
      const { buffer } = mock.logMediator;
      expect(mock.logMediator).toBeInstanceOf(LogMediatorMock1);
      (mock.logMediator as LogMediatorMock1).testMethod('debug', {}, 'one', 'two');
      const msgIndex1 = buffer.length - 1;
      expect(buffer[msgIndex1].level).toBe('debug');
      expect(buffer[msgIndex1].msg).toBe('one,two');
      expect(testMethodSpy.mock.calls.length).toBe(1);

      // Second init
      await mock.init();
      expect(mock.logMediator).toBeInstanceOf(LogMediatorMock1);
      (mock.logMediator as LogMediatorMock1).testMethod('info', {}, 'three', 'four');
      // Logs from first init() still here
      expect(buffer[msgIndex1].level).toBe('debug');
      expect(buffer[msgIndex1].msg).toBe('one,two');
      const msgIndex2 = buffer.length - 1;
      expect(buffer[msgIndex2].level).toBe('info');
      expect(buffer[msgIndex2].msg).toBe('three,four');
      expect(testMethodSpy.mock.calls.length).toBe(2);
      mock.logMediator.flush();
      expect(buffer.length).toBe(0);
    });
  });
});
