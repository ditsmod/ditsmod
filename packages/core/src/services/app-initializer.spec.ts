import 'reflect-metadata';
import { ClassProvider, Injectable, InjectionToken, ReflectiveInjector } from '@ts-stack/di';

import { AppInitializer } from './app-initializer';
import { Logger, LoggerConfig } from '../types/logger';
import { Router } from '../types/router';
import { Request } from './request';
import { ModuleType, ModuleWithParams, ServiceProvider, Extension } from '../types/mix';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { Module } from '../decorators/module';
import { RootModule } from '../decorators/root-module';
import { RootMetadata } from '../models/root-metadata';
import { DefaultLogger } from './default-logger';
import { ModuleManager } from './module-manager';
import { defaultProvidersPerReq } from './default-providers-per-req';
import { MetadataPerMod } from '../types/metadata-per-mod';
import { SiblingObj } from '../models/sibling-obj';
import { Controller } from '../decorators/controller';
import { ModConfig } from '../models/mod-config';
import { NODE_REQ } from '../constans';
import { Log } from './log';
import { LogManager } from './log-manager';

describe('AppInitializer', () => {
  type M = ModuleType | ModuleWithParams;
  type S = SiblingObj;

  @Injectable()
  class AppInitializerMock extends AppInitializer {
    override appMetadataMap: Map<ModuleType | ModuleWithParams, MetadataPerMod>;
    override meta = new RootMetadata();

    constructor(public override moduleManager: ModuleManager, public override log: Log) {
      super(moduleManager, log);
    }

    override async init() {
      await super.init();
    }

    override mergeMetadata(appModule: ModuleType) {
      return super.mergeMetadata(appModule);
    }

    override collectProvidersPerAppAndExtensions(metadata: NormalizedModuleMetadata, moduleManager: ModuleManager) {
      return super.collectProvidersPerAppAndExtensions(metadata, moduleManager);
    }

    override prepareProvidersPerApp(meta: NormalizedModuleMetadata, moduleManager: ModuleManager) {
      return super.prepareProvidersPerApp(meta, moduleManager);
    }
  }

  let mock: AppInitializerMock;
  let moduleManager: ModuleManager;

  beforeEach(async () => {
    const config = new LoggerConfig();
    const logger = new DefaultLogger(config);
    const logManager = new LogManager();
    const log = new Log(logger, logManager);
    moduleManager = new ModuleManager(log);
    mock = new AppInitializerMock(moduleManager, log);
  });

  describe('init()', () => {
    const testMethodSpy = jest.fn();
    class LogMock1 extends Log {
      testMethod(level: keyof Logger, ...args: any[]) {
        testMethodSpy();
        this.setLog(level, `${args}`);
      }
    }
    class LogMock2 extends Log {}

    @Module({ providersPerApp: [{ provide: Log, useClass: LogMock2 }] })
    class Module1 {}

    @RootModule({
      imports: [Module1],
      providersPerApp: [
        { provide: Router, useValue: 'fake' },
        { provide: Log, useClass: LogMock1 },
        { provide: LogManager, useValue: new LogManager() }
      ],
    })
    class AppModule {}

    beforeEach(() => {
      testMethodSpy.mockRestore();
    });

    it('logs should collects between two init()', async () => {
      expect(mock.log.buffer).toHaveLength(0);
      expect(mock.log).toBeInstanceOf(Log);
      expect(mock.log).not.toBeInstanceOf(LogMock1);
      moduleManager.scanRootModule(AppModule);

      // First init
      await mock.init();
      const { buffer } = mock.log;
      expect(mock.log).toBeInstanceOf(LogMock1);
      (mock.log as LogMock1).testMethod('debug', 'one', 'two');
      const msgIndex1 = buffer.length - 1;
      expect(buffer[msgIndex1].level).toBe('debug');
      expect(buffer[msgIndex1].msg).toBe('one,two');
      expect(testMethodSpy.mock.calls.length).toBe(1);

      // Second init
      await mock.init();
      expect(mock.log).toBeInstanceOf(LogMock1);
      (mock.log as LogMock1).testMethod('info', 'three', 'four');
      // Logs from first init() still here
      expect(buffer[msgIndex1].level).toBe('debug');
      expect(buffer[msgIndex1].msg).toBe('one,two');
      const msgIndex2 = buffer.length - 1;
      expect(buffer[msgIndex2].level).toBe('info');
      expect(buffer[msgIndex2].msg).toBe('three,four');
      expect(testMethodSpy.mock.calls.length).toBe(2);
      mock.log.flush();
      expect(buffer.length).toBe(0);
    });
  });

  describe('prepareProvidersPerApp()', () => {
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

      const meta = moduleManager.scanModule(AppModule);
      const msg =
        'Exporting providers to AppModule was failed: found collision for: ' +
        'Provider1. You should manually add this provider to AppModule.';
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

      const meta = moduleManager.scanModule(AppModule);
      expect(() => mock.prepareProvidersPerApp(meta, moduleManager)).not.toThrow();
    });

    it('should works with duplicates in providersPerApp of root module', () => {
      class Provider1 {}

      @RootModule({ providersPerApp: [Provider1, Provider1, { provide: Provider1, useClass: Provider1 }] })
      class AppModule {}

      const meta = moduleManager.scanModule(AppModule);
      mock.mergeMetadata(AppModule);
      expect(() => mock.prepareProvidersPerApp(meta, moduleManager)).not.toThrow();
      expect(mock.meta.providersPerApp.length).toBe(3);
    });

    it('should works with duplicates in feature module and root module', () => {
      class Provider1 {}
      class Provider2 {}

      @Module({ providersPerApp: [Provider1, Provider2, { provide: Provider1, useClass: Provider1 }] })
      class Module1 {}

      @RootModule({
        imports: [Module1],
        providersPerApp: [Provider1, Provider2],
      })
      class AppModule {}

      const meta = moduleManager.scanModule(AppModule);
      mock.mergeMetadata(AppModule);
      expect(() => mock.prepareProvidersPerApp(meta, moduleManager)).not.toThrow();
      expect(mock.meta.providersPerApp.length).toBe(4);
    });

    it('should works with empty "imports" array in root module', () => {
      @RootModule({ imports: [] })
      class AppModule {}
      const meta = moduleManager.scanModule(AppModule);
      mock.mergeMetadata(AppModule);
      expect(() => mock.prepareProvidersPerApp(meta, moduleManager)).not.toThrow();
    });
  });

  describe('collectProvidersPerAppAndExtensions()', () => {
    class Provider0 {}
    class Provider1 {}
    class Provider2 {}
    class Provider3 {}
    class Provider4 {}
    class Provider5 {}
    class Provider6 {}
    class Provider7 {}
    class Extension1 implements Extension<any> {
      async init() {}
    }
    const MY_EXTENSIONS = new InjectionToken<Extension<void>[]>('MY_EXTENSIONS');

    @Module({
      providersPerApp: [Provider0],
    })
    class Module0 {}

    const extensionProvider: ClassProvider = { provide: MY_EXTENSIONS, useClass: Extension1, multi: true };
    @Module({
      providersPerApp: [Provider1, extensionProvider],
      extensions: [MY_EXTENSIONS],
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

    it('should collects providers from exports array without imports them', () => {
      const meta = moduleManager.scanModule(AppModule);
      const { providersPerApp, extensions } = mock.collectProvidersPerAppAndExtensions(meta, moduleManager);
      expect(providersPerApp.includes(Provider0)).toBe(true);
      expect(extensions.includes(MY_EXTENSIONS)).toBe(true);
    });

    it('should collects providers in particular order', () => {
      const meta = moduleManager.scanModule(AppModule);
      const { providersPerApp } = mock.collectProvidersPerAppAndExtensions(meta, moduleManager);
      expect(providersPerApp).toEqual([
        Provider1,
        extensionProvider,
        Provider2,
        Provider3,
        Provider4,
        Provider5,
        Provider6,
        Provider0,
      ]);
    });

    it('should works with moduleWithParams', () => {
      @Module({
        imports: [AppModule],
      })
      class Module6 {
        static withParams(providers: ServiceProvider[]): ModuleWithParams<Module6> {
          return { module: Module6, providersPerApp: providers };
        }
      }
      const modWithParams = Module6.withParams([Provider7]);
      const meta = moduleManager.scanModule(modWithParams);
      const { providersPerApp } = mock.collectProvidersPerAppAndExtensions(meta, moduleManager);
      expect(providersPerApp).toEqual([
        Provider1,
        extensionProvider,
        Provider2,
        Provider3,
        Provider4,
        Provider5,
        Provider6,
        Provider0,
        Provider7,
      ]);
    });

    it('should have empty array of providersPerApp', () => {
      @Module()
      class Module7 {}

      const meta = moduleManager.scanModule(Module7);
      const { providersPerApp } = mock.collectProvidersPerAppAndExtensions(meta, moduleManager);
      expect(providersPerApp).toEqual([]);
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
      exports: [Module0, Module2, Module3],
      providersPerApp: [
        Logger,
        { provide: Router, useValue: 'fake' },
        { provide: LogManager, useValue: new LogManager() },
      ],
    })
    class AppModule {}

    it('Module0', async () => {
      moduleManager.scanRootModule(AppModule);
      mock.bootstrapProvidersPerApp();
      await mock.bootstrapModulesAndExtensions();
      const mod0 = mock.appMetadataMap.get(Module0);
      expect(mod0?.moduleMetadata.providersPerApp).toEqual([]);
      const providerPerMod: ServiceProvider = { provide: ModConfig, useValue: { prefixPerMod: '' } };
      expect(mod0?.moduleMetadata.providersPerMod).toEqual([providerPerMod, Provider0]);
      expect(mod0?.moduleMetadata.providersPerReq).toEqual([...defaultProvidersPerReq]);

      expect(mod0?.siblingsPerMod).toBeDefined();
      expect(mod0?.siblingsPerMod.get(Module0)).toMatchObject({ tokens: [Provider0] });
      expect(mod0?.siblingsPerMod.get(Module2)).toMatchObject({ tokens: [Provider3, Provider4] });
      
      expect(mod0?.siblingsPerReq).toBeDefined();
      expect(mod0?.siblingsPerReq.get(Module3)).toMatchObject({ tokens: [Provider5, Provider6, Provider7] });
    });

    it('Module1', async () => {
      moduleManager.scanRootModule(AppModule);
      mock.bootstrapProvidersPerApp();
      await mock.bootstrapModulesAndExtensions();
      const mod1 = mock.appMetadataMap.get(Module1);
      expect(mod1?.moduleMetadata.providersPerApp).toEqual([]);
      const providerPerMod: ServiceProvider = { provide: ModConfig, useValue: { prefixPerMod: '' } };
      expect(mod1?.moduleMetadata.providersPerMod).toEqual([
        providerPerMod,
        obj1,
        Provider2,
      ]);

      expect(mod1?.siblingsPerMod).toBeDefined();
      expect(mod1?.siblingsPerMod.get(Module0)).toMatchObject({ tokens: [Provider0] });
      expect(mod1?.siblingsPerMod.get(Module2)).toMatchObject({ tokens: [Provider3, Provider4] });
      
      expect(mod1?.siblingsPerReq).toBeDefined();
      expect(mod1?.siblingsPerReq.get(Module3)).toMatchObject({ tokens: [Provider5, Provider6, Provider7] });
      expect(mod1?.moduleMetadata.providersPerReq).toEqual([...defaultProvidersPerReq]);
    });

    it('Module2', async () => {
      moduleManager.scanRootModule(AppModule);
      mock.bootstrapProvidersPerApp();
      await mock.bootstrapModulesAndExtensions();
      const mod2 = mock.appMetadataMap.get(module2WithParams);
      expect(mod2?.moduleMetadata.providersPerApp).toEqual([]);
      const providerPerMod: ServiceProvider = { provide: ModConfig, useValue: { prefixPerMod: '' } };
      expect(mod2?.moduleMetadata.providersPerMod).toEqual([providerPerMod, Provider3, Provider4]);
      expect(mod2?.moduleMetadata.providersPerReq).toEqual([...defaultProvidersPerReq]);

      expect(mod2?.siblingsPerMod).toBeDefined();
      expect(mod2?.siblingsPerMod.get(Module0)).toMatchObject({ tokens: [Provider0] });
      expect(mod2?.siblingsPerMod.get(Module2)).toMatchObject({ tokens: [Provider3, Provider4] });
      
      expect(mod2?.siblingsPerReq).toBeDefined();
      expect(mod2?.siblingsPerReq.get(Module3)).toMatchObject({ tokens: [Provider5, Provider6, Provider7] });
    });

    it('Module3', async () => {
      moduleManager.scanRootModule(AppModule);
      mock.bootstrapProvidersPerApp();
      await mock.bootstrapModulesAndExtensions();
      const mod3 = mock.appMetadataMap.get(module3WithParams);
      expect(mod3?.moduleMetadata.providersPerApp).toEqual([]);
      const providerPerMod: ServiceProvider = { provide: ModConfig, useValue: { prefixPerMod: 'one' } };
      expect(mod3?.moduleMetadata.providersPerMod).toEqual([providerPerMod]);
      expect(mod3?.moduleMetadata.providersPerReq).toEqual([
        ...defaultProvidersPerReq,
        Provider5,
        Provider6,
        Provider7,
      ]);

      expect(mod3?.siblingsPerMod).toBeDefined();
      expect(mod3?.siblingsPerMod.get(Module0)).toMatchObject({ tokens: [Provider0] });
      expect(mod3?.siblingsPerMod.get(Module2)).toMatchObject({ tokens: [Provider3, Provider4] });
      
      expect(mod3?.siblingsPerReq).toBeDefined();
      expect(mod3?.siblingsPerReq.get(Module3)).toMatchObject({ tokens: [Provider5, Provider6, Provider7] });
    });

    it('Module4', async () => {
      moduleManager.scanRootModule(AppModule);
      mock.bootstrapProvidersPerApp();
      await mock.bootstrapModulesAndExtensions();
      const mod4 = mock.appMetadataMap.get(module4WithParams);
      expect(mod4?.moduleMetadata.providersPerApp).toEqual([]);
      const providerPerMod: ServiceProvider = { provide: ModConfig, useValue: { prefixPerMod: '' } };
      expect(mod4?.moduleMetadata.providersPerMod).toEqual([providerPerMod]);
      expect(mod4?.moduleMetadata.providersPerReq).toEqual([
        ...defaultProvidersPerReq,
        Provider8,
        Provider9,
      ]);

      expect(mod4?.siblingsPerMod).toBeDefined();
      expect(mod4?.siblingsPerMod.get(Module0)).toMatchObject({ tokens: [Provider0] });
      expect(mod4?.siblingsPerMod.get(Module2)).toMatchObject({ tokens: [Provider3, Provider4] });
      
      expect(mod4?.siblingsPerReq).toBeDefined();
      expect(mod4?.siblingsPerReq.get(Module3)).toMatchObject({ tokens: [Provider5, Provider6, Provider7] });
    });

    it('AppModule', async () => {
      moduleManager.scanRootModule(AppModule);
      mock.bootstrapProvidersPerApp();
      await mock.bootstrapModulesAndExtensions();
      const root1 = mock.appMetadataMap.get(AppModule);
      // expect(root1?.moduleMetadata.providersPerApp.slice(0, 1)).toEqual([Logger, { provide: Router, useValue: 'fake' }]);
      const providerPerMod: ServiceProvider = { provide: ModConfig, useValue: { prefixPerMod: '' } };
      expect(root1?.moduleMetadata.providersPerMod).toEqual([providerPerMod]);
      expect(root1?.moduleMetadata.providersPerReq).toEqual([...defaultProvidersPerReq]);

      expect(root1?.siblingsPerMod).toBeDefined();
      expect(root1?.siblingsPerMod.get(Module0)).toMatchObject({ tokens: [Provider0] });
      expect(root1?.siblingsPerMod.get(module2WithParams)).toMatchObject({ tokens: [Provider3, Provider4] });
      expect(root1?.siblingsPerMod.get(Module1)).toMatchObject({ tokens: [Provider1] });
      expect(root1?.siblingsPerMod.get(Module2)).toMatchObject({ tokens: [Provider3, Provider4] });
      
      expect(root1?.siblingsPerReq).toBeDefined();
      expect(root1?.siblingsPerReq.get(Module3)).toMatchObject({ tokens: [Provider5, Provider6, Provider7] });
      expect(root1?.siblingsPerReq.get(module3WithParams)).toMatchObject({ tokens: [Provider5, Provider6, Provider7] });
      expect(root1?.siblingsPerReq.get(module4WithParams)).toMatchObject({ tokens: [Provider8, Provider9] });
    });
  });

  describe('Providers collisions', () => {
    describe('per a module', () => {
      it('exporting duplicates of Provider2', async () => {
        class Provider1 {}
        class Provider2 {}
        class Provider3 {}

        @Module({
          exports: [Provider1, { provide: Provider2, useFactory: () => {} }],
          providersPerMod: [Provider1, Provider2],
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
          providersPerApp: [{ provide: LogManager, useValue: new LogManager() }]
        })
        class AppModule {}

        moduleManager.scanRootModule(AppModule);
        mock.bootstrapProvidersPerApp();
        const msg =
          'Exporting providers to AppModule was failed: found collision for: ' +
          'Provider2. You should manually add this provider to AppModule.';
        await expect(mock.bootstrapModulesAndExtensions()).rejects.toThrow(msg);
      });

      it('same export as in previous, but in import both module in root module', async () => {
        class Provider1 {}
        class Provider2 {}

        @Module({
          exports: [{ provide: Provider1, useValue: '' }],
          providersPerMod: [{ provide: Provider1, useClass: Provider1 }, Provider2],
        })
        class Module1 {}

        @Module({
          exports: [Provider1, { provide: Provider2, useFactory: () => {} }],
          providersPerMod: [Provider1, Provider2],
        })
        class Module2 {}

        @RootModule({
          imports: [Module1, Module2],
          providersPerApp: [{ provide: LogManager, useValue: new LogManager() }]
        })
        class AppModule {}

        moduleManager.scanRootModule(AppModule);
        mock.bootstrapProvidersPerApp();
        const msg =
          'Exporting providers to AppModule was failed: found collision for: ' +
          'Provider1. You should manually add this provider to AppModule.';
        await expect(mock.bootstrapModulesAndExtensions()).rejects.toThrow(msg);
      });

      it('mix exporting duplicates with "multi == true" per app and per mod', async () => {
        class Provider1 {}
        class Provider2 {}

        const ObjProviderPerApp: ServiceProvider = { provide: Provider1, useClass: Provider1, multi: true };
        const ObjProviderPerMod: ServiceProvider = { provide: Provider1, useClass: Provider1, multi: true };
        @Module({
          exports: [ObjProviderPerMod],
          providersPerMod: [ObjProviderPerMod, Provider2],
          providersPerApp: [ObjProviderPerApp],
        })
        class Module1 {}

        @Module({
          exports: [ObjProviderPerMod],
          providersPerMod: [ObjProviderPerMod],
        })
        class Module2 {}

        @RootModule({
          imports: [Module1, Module2],
          providersPerApp: [{ provide: LogManager, useValue: new LogManager() }]
        })
        class AppModule {}

        moduleManager.scanRootModule(AppModule);
        mock.bootstrapProvidersPerApp();
        const msg =
          'Exporting providers to AppModule was failed: found collision for: ' +
          'Provider1. You should manually add this provider to AppModule.';
        await expect(mock.bootstrapModulesAndExtensions()).rejects.toThrow(msg);
      });

      it('exporting duplicates with "multi == true" not to throw', async () => {
        class Provider1 {}
        class Provider2 {}

        @Module({
          exports: [{ provide: Provider1, useClass: Provider1, multi: true }],
          providersPerMod: [{ provide: Provider1, useClass: Provider1, multi: true }, Provider2],
        })
        class Module1 {}

        @Module({
          exports: [{ provide: Provider1, useClass: Provider1, multi: true }],
          providersPerMod: [{ provide: Provider1, useClass: Provider1, multi: true }],
        })
        class Module2 {}

        @RootModule({
          imports: [Module1, Module2],
          providersPerApp: [
            { provide: Router, useValue: 'fake' },
            { provide: LogManager, useValue: new LogManager() }
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
          exports: [Provider1, { provide: Provider2, useFactory: () => {} }],
          providersPerMod: [Provider1, Provider2],
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
            { provide: LogManager, useValue: new LogManager() }
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
          exports: [{ provide: Provider1, useValue: '' }],
          providersPerMod: [{ provide: Provider1, useClass: Provider1 }, Provider2],
        })
        class Module0 {}

        @Module({
          exports: [Provider1, { provide: Provider2, useFactory: () => {} }],
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
            { provide: LogManager, useValue: new LogManager() }
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
        exports: [{ provide: Provider1, useClass: Provider1 }],
        providersPerReq: [{ provide: Provider1, useClass: Provider1 }, Provider2],
      })
      class Module0 {}

      @Module({
        exports: [{ provide: Provider1, useExisting: Provider1 }, Provider2],
        providersPerReq: [Provider1, Provider2],
      })
      class Module1 {}

      @Module({
        imports: [Module1],
        exports: [Module1, { provide: Provider2, useClass: Provider2 }, Provider3],
        providersPerReq: [Provider2, Provider3],
      })
      class Module2 {}

      it('exporting duplicates of Provider2', async () => {
        @RootModule({
          imports: [Module2],
          providersPerApp: [{ provide: LogManager, useValue: new LogManager() }]
        })
        class AppModule {}

        moduleManager.scanRootModule(AppModule);
        mock.bootstrapProvidersPerApp();
        const msg =
          'Exporting providers to AppModule was failed: found collision for: ' +
          'Provider2. You should manually add this provider to AppModule.';
        await expect(mock.bootstrapModulesAndExtensions()).rejects.toThrow(msg);
      });

      it('exporting duplicates of Provider2, but declared in providersPerReq of root module', async () => {
        @RootModule({
          imports: [Module2],
          providersPerReq: [Provider2],
          providersPerApp: [
            { provide: Router, useValue: 'fake' },
            { provide: LogManager, useValue: new LogManager() }
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
          exports: [{ provide: Provider1, useClass: Provider1 }],
          providersPerReq: [{ provide: Provider1, useClass: Provider1 }, Provider2],
        })
        class Module0 {}

        @Module({
          exports: [{ provide: Provider1, useExisting: Provider1 }, Provider2],
          providersPerReq: [Provider1, Provider2],
        })
        class Module1 {}

        @RootModule({
          imports: [Module0, Module1],
          providersPerApp: [{ provide: LogManager, useValue: new LogManager() }]
        })
        class AppModule {}

        moduleManager.scanRootModule(AppModule);
        mock.bootstrapProvidersPerApp();
        const msg =
          'Exporting providers to AppModule was failed: found collision for: ' +
          'Provider1. You should manually add this provider to AppModule.';
        await expect(mock.bootstrapModulesAndExtensions()).rejects.toThrow(msg);
      });

      it('exporting duplicates of Provider1 from Module1 and Module2, but declared in providersPerReq of root module', async () => {
        @RootModule({
          imports: [Module0, Module1],
          providersPerReq: [Provider1],
          providersPerApp: [
            { provide: Router, useValue: 'fake' },
            { provide: LogManager, useValue: new LogManager() }
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
          exports: [
            Provider0,
            Provider1,
            { provide: Request, useClass: Request },
            { provide: NODE_REQ, useValue: '' },
            Provider3,
          ],
          providersPerMod: [Provider0],
          providersPerReq: [
            { provide: Provider1, useClass: Provider1 },
            Provider2,
            { provide: NODE_REQ, useValue: '' },
            Provider3,
            Request,
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
        const logManager = new LogManager();
        mock.bootstrapProvidersPerApp(logManager);
        const msg =
          'Exporting providers to AppModule was failed: found collision for: ' +
          'Provider0, Provider1, Request, InjectionToken NODE_REQ. You should manually add these providers to AppModule.';
        await expect(mock.bootstrapModulesAndExtensions()).rejects.toThrow(msg);
      });
    });
  });
});
