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
import { ModuleType } from '#types/mix.js';
import { Provider } from '#di/types-and-models.js';
import { ModuleWithParams } from '#types/module-metadata.js';
import { Extension, ExtensionCounters } from '#extension/extension-types.js';
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
