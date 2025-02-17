import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { injectable, InjectionToken } from '#di';
import { InputLogLevel, Logger } from '#logger/logger.js';
import { LogMediator } from '#logger/log-mediator.js';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { featureModule } from '#decorators/module.js';
import { rootModule } from '#decorators/root-module.js';
import { NormalizedModuleMetadata } from '#types/normalized-module-metadata.js';
import { Router } from '#types/router.js';
import { AppInitializer } from '#init/app-initializer.js';
import { ModuleManager } from '#init/module-manager.js';
import { ModuleType, Provider } from '#types/mix.js';
import { ModuleWithParams } from '#types/module-metadata.js';
import { Extension, ExtensionCounters } from '#extension/extension-types.js';
import { controller } from '#decorators/controller.js';
import { ModuleExtract } from '#types/module-extract.js';
import { ImportObj, MetadataPerMod1 } from '#types/metadata-per-mod.js';
import { Providers } from '#utils/providers.js';
import { AppOptions } from '#types/app-options.js';

describe('AppInitializer', () => {
  type ModRefId = ModuleType | ModuleWithParams;

  @injectable()
  class AppInitializerMock extends AppInitializer {
    override meta = new NormalizedModuleMetadata();

    constructor(
      public override appOptions: AppOptions,
      public override moduleManager: ModuleManager,
      public override systemLogMediator: SystemLogMediator,
    ) {
      super(appOptions, moduleManager, systemLogMediator);
    }

    async init() {
      this.bootstrapProvidersPerApp();
      await this.bootstrapModulesAndExtensions();
    }

    override collectProvidersPerApp(meta: NormalizedModuleMetadata) {
      return super.collectProvidersPerApp(meta);
    }

    override prepareProvidersPerApp() {
      return super.prepareProvidersPerApp();
    }

    override bootstrapModuleFactory(moduleManager: ModuleManager) {
      return super.bootstrapModuleFactory(moduleManager);
    }

    override getResolvedCollisionsPerApp() {
      return super.getResolvedCollisionsPerApp();
    }

    override decreaseExtensionsCounters(extensionCounters: ExtensionCounters, providers: Provider[]) {
      return super.decreaseExtensionsCounters(extensionCounters, providers);
    }
  }

  function getImportedTokens(map: Map<any, ImportObj<Provider>> | undefined) {
    return [...(map || [])].map(([key]) => key);
  }

  let mock: AppInitializerMock;
  let moduleManager: ModuleManager;

  describe('decreaseExtensionsCounters()', () => {
    beforeEach(() => {
      const systemLogMediator = new SystemLogMediator({ moduleName: 'fakeName' });
      moduleManager = new ModuleManager(systemLogMediator);
      const appOptions = new AppOptions();
      mock = new AppInitializerMock(appOptions, moduleManager, systemLogMediator);
    });

    const SOME_EXTENSIONS = new InjectionToken('SOME_EXTENSIONS');
    class Extension1 {}
    class Extension2 {}
    class Extension3 {}

    const extensionCounters = new ExtensionCounters();
    extensionCounters.mGroupTokens.set(SOME_EXTENSIONS, 3);

    extensionCounters.mExtensions.set(Extension1, 9);
    extensionCounters.mExtensions.set(Extension2, 8);
    extensionCounters.mExtensions.set(Extension3, 6);

    it('counters should remain the same', () => {
      mock.decreaseExtensionsCounters(extensionCounters, []);

      expect(extensionCounters.mGroupTokens.get(SOME_EXTENSIONS)).toBe(3);

      expect(extensionCounters.mExtensions.get(Extension1)).toBe(9);
      expect(extensionCounters.mExtensions.get(Extension2)).toBe(8);
      expect(extensionCounters.mExtensions.get(Extension3)).toBe(6);
    });

    it('counter should be changed', () => {
      const providers: Provider[] = [
        Extension2,
        Extension2,
        { token: SOME_EXTENSIONS, useClass: Extension1 },
        Extension1,
      ];
      mock.decreaseExtensionsCounters(extensionCounters, providers);

      expect(extensionCounters.mGroupTokens.get(SOME_EXTENSIONS)).toBe(2);

      expect(extensionCounters.mExtensions.get(Extension1)).toBe(8);
      expect(extensionCounters.mExtensions.get(Extension2)).toBe(7);
      expect(extensionCounters.mExtensions.get(Extension3)).toBe(6);
    });
  });

  describe('prepareProvidersPerApp()', () => {
    beforeAll(() => {
      console.log = vi.fn() as any;
    });

    beforeEach(() => {
      const systemLogMediator = new SystemLogMediator({ moduleName: 'fakeName' });
      moduleManager = new ModuleManager(systemLogMediator);
      const appOptions = new AppOptions();
      mock = new AppInitializerMock(appOptions, moduleManager, systemLogMediator);
    });

    it('should throw an error about collision', () => {
      class Provider1 {}

      @featureModule({ providersPerApp: [{ token: Provider1, useClass: Provider1 }] })
      class Module1 {}

      @featureModule({ providersPerApp: [Provider1] })
      class Module2 {}

      @rootModule({
        imports: [Module1, Module2],
      })
      class AppModule {}

      mock.meta = moduleManager.scanRootModule(AppModule);
      const msg = 'AppModule failed: exports from Module1, Module2 causes collision with Provider1.';
      expect(() => mock.prepareProvidersPerApp()).toThrow(msg);
    });

    it('should works with collision and resolvedCollisionsPerApp', () => {
      class Provider1 {}
      class Provider2 {}

      @featureModule({ providersPerApp: [{ token: Provider1, useClass: Provider2 }] })
      class Module1 {}

      @featureModule({ providersPerApp: [Provider1] })
      class Module2 {}

      @rootModule({
        imports: [Module1, Module2],
        resolvedCollisionsPerApp: [[Provider1, Module1]],
      })
      class AppModule {}

      mock.meta = moduleManager.scanRootModule(AppModule);
      expect(() => mock.prepareProvidersPerApp()).not.toThrow();
      expect(mock.getResolvedCollisionsPerApp()).toEqual([{ token: Provider1, useClass: Provider2 }]);
      expect(mock.meta.providersPerApp).toEqual([{ token: Provider1, useClass: Provider2 }]);
      expect(mock.meta.resolvedCollisionsPerApp.length).toBe(1);
    });

    it('should throw an error because resolvedCollisionsPerApp not properly setted', () => {
      class Provider1 {}

      @featureModule({})
      class Module0 {}

      @featureModule({ providersPerApp: [{ token: Provider1, useClass: Provider1 }] })
      class Module1 {}

      @featureModule({ providersPerApp: [Provider1] })
      class Module2 {}

      @rootModule({
        imports: [Module1, Module2],
        resolvedCollisionsPerApp: [[Provider1, Module0]],
      })
      class AppModule {}

      mock.meta = moduleManager.scanRootModule(AppModule);
      const msg = 'AppModule failed: Provider1 mapped with Module0, but Module0 is not imported';
      expect(() => mock.prepareProvidersPerApp()).toThrow(msg);
    });

    it('multi providers should not causes collisions', () => {
      class Provider1 {}
      class Provider2 {}

      @featureModule({
        providersPerMod: [Provider2],
        exports: [Provider2],
      })
      class Module0 {}

      @featureModule({
        providersPerApp: [{ token: Provider1, useValue: 'value1 of module1', multi: true }],
      })
      class Module1 {}

      @featureModule({
        providersPerApp: [{ token: Provider1, useValue: 'value1 of module2', multi: true }],
      })
      class Module2 {}

      @rootModule({
        imports: [Module0, Module1, Module2],
      })
      class AppModule {}

      mock.meta = moduleManager.scanRootModule(AppModule);
      expect(() => mock.prepareProvidersPerApp()).not.toThrow();
      expect(mock.meta.providersPerApp).toEqual([
        { token: Provider1, useValue: 'value1 of module1', multi: true },
        { token: Provider1, useValue: 'value1 of module2', multi: true },
      ]);
    });

    it('multi providers should not resolves collisions', () => {
      class Provider1 {}
      class Provider2 {}

      @featureModule({
        providersPerMod: [Provider2],
        exports: [Provider2],
      })
      class Module0 {}

      @featureModule({
        providersPerApp: [{ token: Provider1, useValue: 'value1 of module1', multi: true }],
      })
      class Module1 {}

      @featureModule({
        providersPerApp: [{ token: Provider1, useValue: 'value1 of module2', multi: true }],
      })
      class Module2 {}

      @rootModule({
        imports: [Module0, Module1, Module2],
        resolvedCollisionsPerApp: [[Provider1, Module1]],
      })
      class AppModule {}

      mock.meta = moduleManager.scanRootModule(AppModule);
      expect(() => mock.prepareProvidersPerApp()).toThrow('Provider1 is a token of the multi providers');
    });

    it('should throw an error because resolvedCollisionsPerApp not properly setted provider', () => {
      class Provider1 {}
      class Provider2 {}

      @featureModule({
        providersPerMod: [Provider2],
        exports: [Provider2],
      })
      class Module0 {}

      @featureModule({ providersPerApp: [{ token: Provider1, useClass: Provider1 }] })
      class Module1 {}

      @featureModule({ providersPerApp: [Provider1] })
      class Module2 {}

      @rootModule({
        imports: [Module0, Module1, Module2],
        resolvedCollisionsPerApp: [[Provider1, Module0]],
      })
      class AppModule {}

      mock.meta = moduleManager.scanRootModule(AppModule);
      const msg = 'AppModule failed: Provider1 mapped with Module0, but providersPerApp does not includes Provider1';
      expect(() => mock.prepareProvidersPerApp()).toThrow(msg);
    });

    it('should works with identical duplicates', () => {
      class Provider1 {}

      @featureModule({ providersPerApp: [Provider1] })
      class Module1 {}

      @featureModule({ providersPerApp: [Provider1] })
      class Module2 {}

      @rootModule({
        imports: [Module1, Module2],
      })
      class AppModule {}

      mock.meta = moduleManager.scanRootModule(AppModule);
      expect(() => mock.prepareProvidersPerApp()).not.toThrow();
    });

    it('should works with duplicates in providersPerApp of root module', () => {
      class Provider1 {}

      @rootModule({ providersPerApp: [Provider1, Provider1, { token: Provider1, useClass: Provider1 }] })
      class AppModule {}

      mock.meta = moduleManager.scanRootModule(AppModule);
      expect(() => mock.prepareProvidersPerApp()).not.toThrow();
      expect(mock.meta.providersPerApp.length).toBe(3);
    });

    it('should works with empty "imports" array in root module', () => {
      @rootModule({ imports: [] })
      class AppModule {}
      mock.meta = moduleManager.scanRootModule(AppModule);
      expect(() => mock.prepareProvidersPerApp()).not.toThrow();
    });
  });

  describe('collectProvidersPerApp()', () => {
    class Provider0 {}
    class Provider1 {}
    class Provider2 {}
    class Provider3 {}
    class Provider4 {}
    class Provider5 {}
    class Provider6 {}
    class Provider7 {}

    @featureModule({ providersPerApp: [Provider0] })
    class Module0 {}

    @featureModule({ providersPerApp: [Provider1] })
    class Module1 {}

    @featureModule({
      providersPerApp: [Provider2, Provider3, Provider4],
      imports: [Module1],
    })
    class Module2 {}

    @featureModule({
      providersPerApp: [Provider5, Provider6],
      imports: [Module2],
    })
    class Module3 {}

    @rootModule({
      imports: [Module3, Module0],
      providersPerApp: [{ token: Provider1, useClass: Provider7 }],
      exports: [Module0],
    })
    class AppModule {}

    beforeEach(() => {
      const systemLogMediator = new SystemLogMediator({ moduleName: 'fakeName' });
      moduleManager = new ModuleManager(systemLogMediator);
      const appOptions = new AppOptions();
      mock = new AppInitializerMock(appOptions, moduleManager, systemLogMediator);
    });

    it('should collects providers from exports array without imports them', () => {
      mock.meta = moduleManager.scanRootModule(AppModule);
      const providersPerApp = mock.collectProvidersPerApp(mock.meta);
      expect(providersPerApp.includes(Provider0)).toBe(true);
    });

    it('should collects providers in particular order', () => {
      mock.meta = moduleManager.scanRootModule(AppModule);
      const providersPerApp = mock.collectProvidersPerApp(mock.meta);
      expect(providersPerApp).toEqual([Provider1, Provider2, Provider3, Provider4, Provider5, Provider6, Provider0]);
    });

    it('should works with moduleWithParams', () => {
      @featureModule({})
      class Module6 {
        static withParams(providers: Provider[]): ModuleWithParams<Module6> {
          return { module: Module6, providersPerApp: providers };
        }
      }
      const modWithParams = Module6.withParams([Provider7]);
      const meta = moduleManager.scanModule(modWithParams);
      const providersPerApp = mock.collectProvidersPerApp(meta);
      expect(providersPerApp).toEqual([Provider7]);
    });

    it('should works without providersPerApp', () => {
      @controller()
      class Controller1 {}

      @featureModule({ controllers: [Controller1] })
      class Module7 {}

      const meta = moduleManager.scanModule(Module7);
      const providersPerApp = mock.collectProvidersPerApp(meta);
      expect(providersPerApp).toEqual([]);
    });
  });

  describe('exports/imports', () => {
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

    @controller()
    class Ctrl {}

    @featureModule({
      exports: [Provider0],
      providersPerMod: [Provider0],
    })
    class Module0 {}

    const obj1 = { token: Provider1, useClass: Provider1 };
    @featureModule({
      controllers: [Ctrl],
      providersPerMod: [obj1, Provider2],
      exports: [Provider1],
    })
    class Module1 {}

    @featureModule({
      providersPerMod: [Provider3, Provider4],
      exports: [Provider3, Provider4],
    })
    class Module2 {
      static withParams() {
        return { module: Module2 };
      }
    }

    @featureModule({
      providersPerReq: [Provider5, Provider6, Provider7],
      exports: [Provider5, Provider6, Provider7],
    })
    class Module3 {}

    @featureModule({
      providersPerReq: [Provider8, Provider9],
      exports: [Provider8, Provider9],
    })
    class Module4 {}

    @featureModule({
      providersPerApp: [{ token: Logger, useValue: 'fake value' }],
    })
    class Module5 {}

    const module2WithParams: ModuleWithParams = Module2.withParams();
    const module3WithParams: ModuleWithParams = { path: 'one', module: Module3 };
    const module4WithParams: ModuleWithParams = { module: Module4 };
    @rootModule({
      imports: [Module0, Module1, module2WithParams, Module5, module3WithParams, module4WithParams],
      exports: [Module0, module2WithParams, module3WithParams],
      providersPerApp: [Logger, { token: Router, useValue: 'fake' }],
    })
    class AppModule {}

    let appMetadataMap: Map<ModRefId, MetadataPerMod1>;

    beforeAll(() => {
      const systemLogMediator = new SystemLogMediator({ moduleName: 'fakeName' });
      moduleManager = new ModuleManager(systemLogMediator);
      const appOptions = new AppOptions();
      mock = new AppInitializerMock(appOptions, moduleManager, systemLogMediator);
      moduleManager.scanRootModule(AppModule);
      appMetadataMap = mock.bootstrapModuleFactory(moduleManager);
    });

    function checkGlobalProviders(metadataPerMod1: MetadataPerMod1 | undefined) {
      const tokensPerMod = getImportedTokens(metadataPerMod1?.importedTokensMap.perMod).slice(0, 3);
      expect(tokensPerMod).toEqual([Provider0, Provider3, Provider4]);
      const tokensPerReq = getImportedTokens(metadataPerMod1?.importedTokensMap.perReq).slice(0, 3);
      expect(tokensPerReq).toEqual([Provider5, Provider6, Provider7]);

      // Global providers per a module
      const perMod = metadataPerMod1?.importedTokensMap?.perMod!;
      const expectedPerMod = new ImportObj();

      expectedPerMod.modRefId = Module0;
      expectedPerMod.providers = [Provider0];
      expect(perMod.get(Provider0)).toEqual(expectedPerMod);

      expectedPerMod.modRefId = module2WithParams;
      expectedPerMod.providers = [Provider3];
      expect(perMod.get(Provider3)).toEqual(expectedPerMod);
      expectedPerMod.providers = [Provider4];
      expect(perMod.get(Provider4)).toEqual(expectedPerMod);

      // Global providers per a request
      const perReq = metadataPerMod1?.importedTokensMap.perReq!;
      const expectedPerReq = new ImportObj();
      expectedPerReq.modRefId = module3WithParams;
      expectedPerReq.providers = [Provider5];
      expect(perReq.get(Provider5)).toEqual(expectedPerReq);
      expectedPerReq.providers = [Provider6];
      expect(perReq.get(Provider6)).toEqual(expectedPerReq);
      expectedPerReq.providers = [Provider7];
      expect(perReq.get(Provider7)).toEqual(expectedPerReq);
    }

    it('Module0', async () => {
      const mod0 = appMetadataMap.get(Module0);
      expect(mod0?.meta.providersPerApp).toEqual([]);
      const moduleExtract: ModuleExtract = { path: '', moduleName: 'Module0', isExternal: false };
      const providerPerMod: Provider = { token: ModuleExtract, useValue: moduleExtract };
      expect(mod0?.meta.providersPerMod).toEqual([providerPerMod, Provider0]);
      expect(mod0?.meta.providersPerReq).toEqual([]);
      checkGlobalProviders(mod0);
    });

    it('Module1', async () => {
      const mod1 = appMetadataMap.get(Module1);
      expect(mod1?.meta.providersPerApp).toEqual([]);
      const moduleExtract: ModuleExtract = { path: '', moduleName: 'Module1', isExternal: false };
      const providerPerMod: Provider = { token: ModuleExtract, useValue: moduleExtract };
      expect(mod1?.meta.providersPerMod).toEqual([providerPerMod, obj1, Provider2]);
      checkGlobalProviders(mod1);
    });

    it('Module2', async () => {
      const mod2 = appMetadataMap.get(module2WithParams);
      expect(mod2?.meta.providersPerApp).toEqual([]);
      const moduleExtract: ModuleExtract = { path: '', moduleName: 'Module2', isExternal: false };
      const providerPerMod: Provider = { token: ModuleExtract, useValue: moduleExtract };
      expect(mod2?.meta.providersPerMod).toEqual([providerPerMod, Provider3, Provider4]);
      expect(mod2?.meta.providersPerReq).toEqual([]);
      checkGlobalProviders(mod2);
    });

    it('Module3', async () => {
      const mod3 = appMetadataMap.get(module3WithParams);
      expect(mod3?.meta.providersPerApp).toEqual([]);
      const moduleExtract: ModuleExtract = { path: 'one', moduleName: 'Module3', isExternal: false };
      const providerPerMod: Provider = {
        token: ModuleExtract,
        useValue: moduleExtract,
      };
      expect(mod3?.meta.providersPerMod).toEqual([providerPerMod]);
      expect(mod3?.meta.providersPerReq).toEqual([Provider5, Provider6, Provider7]);
      checkGlobalProviders(mod3);
    });

    it('Module4', async () => {
      moduleManager.scanRootModule(AppModule);
      const appMetadataMap = mock.bootstrapModuleFactory(moduleManager);
      const mod4 = appMetadataMap.get(module4WithParams);
      expect(mod4?.meta.providersPerApp).toEqual([]);
      const moduleExtract: ModuleExtract = { path: '', moduleName: 'Module4', isExternal: false };
      const providerPerMod: Provider = { token: ModuleExtract, useValue: moduleExtract };
      expect(mod4?.meta.providersPerMod).toEqual([providerPerMod]);
      expect(mod4?.meta.providersPerReq).toEqual([Provider8, Provider9]);
      checkGlobalProviders(mod4);
    });

    it('AppModule', async () => {
      moduleManager.scanRootModule(AppModule);
      const appMetadataMap = mock.bootstrapModuleFactory(moduleManager);
      const root1 = appMetadataMap.get(AppModule);
      expect(root1?.meta.providersPerApp.slice(0, 2)).toEqual([Logger, { token: Router, useValue: 'fake' }]);
      const moduleExtract: ModuleExtract = { path: '', moduleName: 'AppModule', isExternal: false };
      const providerPerMod: Provider = {
        token: ModuleExtract,
        useValue: moduleExtract,
      };
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
      const loggerSpy = vi.fn();

      class LogMediatorMock extends SystemLogMediator {
        override flush() {
          const level = (this.logger as any).level;
          loggerSpy(level);
          super.flush();
        }
      }

      // Simulation of a call from the Application
      const logMediator = new LogMediatorMock({ moduleName: 'fakeName' });
      moduleManager = new ModuleManager(logMediator);
      const appOptions = new AppOptions();
      mock = new AppInitializerMock(appOptions, moduleManager, logMediator);

      // Simulation of a call from the AppModule
      @rootModule({
        providersPerApp: new Providers()
          .passThrough(Router)
          .useLogConfig({ level: 'trace' })
          .useSystemLogMediator(LogMediatorMock),
      })
      class AppModule {}

      moduleManager.scanRootModule(AppModule);
      mock.bootstrapProvidersPerApp();
      // Here logMediator used from Application
      logMediator.flush();
      // mock.flushLogs();
      expect(loggerSpy).toHaveBeenNthCalledWith(1, 'info');
    });
  });

  describe('init()', () => {
    const testMethodSpy = vi.fn();
    class LogMediatorMock1 extends SystemLogMediator {
      testMethod(level: InputLogLevel, ...args: any[]) {
        testMethodSpy();
        this.setLog(level, `${args}`);
      }
    }
    class LogMediatorMock2 extends LogMediator {}

    @featureModule({ providersPerApp: [{ token: LogMediator, useClass: LogMediatorMock2 }] })
    class Module1 {}

    @rootModule({
      imports: [Module1],
      providersPerApp: [
        { token: Router, useValue: 'fake' },
        { token: SystemLogMediator, useClass: LogMediatorMock1 },
      ],
    })
    class AppModule {}

    beforeEach(() => {
      testMethodSpy.mockRestore();
      LogMediator.bufferLogs = true;
      LogMediator.buffer = [];
      const systemLogMediator = new SystemLogMediator({ moduleName: 'fakeName' });
      moduleManager = new ModuleManager(systemLogMediator);
      const appOptions = new AppOptions();
      mock = new AppInitializerMock(appOptions, moduleManager, systemLogMediator);
    });

    it('logs should collects between two init()', async () => {
      expect(LogMediator.buffer).toHaveLength(0);
      expect(mock.systemLogMediator).toBeInstanceOf(SystemLogMediator);
      expect(mock.systemLogMediator).not.toBeInstanceOf(LogMediatorMock1);
      moduleManager.scanRootModule(AppModule);

      // First init
      await mock.init();
      const { buffer } = LogMediator;
      expect(mock.systemLogMediator).toBeInstanceOf(LogMediatorMock1);
      (mock.systemLogMediator as LogMediatorMock1).testMethod('debug', 'one', 'two');
      const msgIndex1 = buffer.length - 1;
      expect(buffer[msgIndex1].inputLogLevel).toBe('debug');
      expect(buffer[msgIndex1].msg).toBe('one,two');
      expect(testMethodSpy.mock.calls.length).toBe(1);

      // Second init
      await mock.init();
      expect(mock.systemLogMediator).toBeInstanceOf(LogMediatorMock1);
      (mock.systemLogMediator as LogMediatorMock1).testMethod('info', 'three', 'four');
      // Logs from first init() still here
      expect(buffer[msgIndex1].inputLogLevel).toBe('debug');
      expect(buffer[msgIndex1].msg).toBe('one,two');
      const msgIndex2 = buffer.length - 1;
      expect(buffer[msgIndex2].inputLogLevel).toBe('info');
      expect(buffer[msgIndex2].msg).toBe('three,four');
      expect(testMethodSpy.mock.calls.length).toBe(2);
      mock.systemLogMediator.flush();
      expect(buffer.length).toBe(0);
    });
  });

  describe('extensions stage1', () => {
    const jestFn = vi.fn((extensionName: string) => extensionName);

    beforeEach(() => {
      vi.restoreAllMocks();
      const systemLogMediator = new SystemLogMediator({ moduleName: 'fakeName' });
      moduleManager = new ModuleManager(systemLogMediator);
      const appOptions = new AppOptions();
      mock = new AppInitializerMock(appOptions, moduleManager, systemLogMediator);
    });

    interface MyInterface {
      one: string;
      two: number;
    }
    const MY_EXTENSIONS = new InjectionToken<Extension<MyInterface>[]>('MY_EXTENSIONS');

    @injectable()
    class Extension1 implements Extension {
      #inited: boolean;

      async stage1() {
        if (this.#inited) {
          return;
        }
        jestFn('Extension1');
        this.#inited = true;
      }
    }

    it('properly declared extensions in a root module', async () => {
      @rootModule({
        providersPerApp: [{ token: Router, useValue: 'fake value for router' }],
        extensions: [{ extension: Extension1, group: MY_EXTENSIONS }],
      })
      class AppModule {}

      expect(() => moduleManager.scanRootModule(AppModule)).not.toThrow();
      await expect(mock.init()).resolves.not.toThrow();
      expect(jestFn).toHaveBeenCalledWith('Extension1');
    });
  });
});
