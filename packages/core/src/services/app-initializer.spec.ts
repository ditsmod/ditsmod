import 'reflect-metadata';
import { DefaultRouter } from '@ts-stack/router';

import { AppInitializer } from './app-initializer';
import { Logger, LoggerConfig } from '../types/logger';
import { Router } from '../types/router';
import { Request } from './request';
import { defaultProvidersPerApp } from './default-providers-per-app';
import { ModuleType } from '../types/module-type';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { ModuleWithParams } from '../types/module-with-params';
import { Module } from '../decorators/module';
import { RootModule } from '../decorators/root-module';
import { NodeReqToken } from '../types/server-options';
import { RootMetadata } from '../models/root-metadata';
import { ServiceProvider } from '../types/service-provider';
import { DefaultLogger } from './default-logger';
import { ModuleManager } from './module-manager';

describe('AppInitializer', () => {
  (defaultProvidersPerApp as ServiceProvider[]).push({ provide: Router, useClass: DefaultRouter });

  class MockAppInitializer extends AppInitializer {
    meta = new RootMetadata();

    async init(appModule: ModuleType, log: Logger) {
      return super.init(appModule, log);
    }

    mergeMetadata(appModule: ModuleType) {
      return super.mergeMetadata(appModule);
    }

    collectProvidersPerApp(metadata: NormalizedModuleMetadata, moduleManager: ModuleManager) {
      return super.collectProvidersPerApp(metadata, moduleManager);
    }

    prepareProvidersPerApp(meta: NormalizedModuleMetadata, moduleManager: ModuleManager) {
      return super.prepareProvidersPerApp(meta, moduleManager);
    }
  }

  let mock: MockAppInitializer;
  let log: Logger;
  let moduleManager: ModuleManager;

  beforeEach(async () => {
    mock = new MockAppInitializer();
    const config = new LoggerConfig();
    log = new DefaultLogger(config);
    moduleManager = new ModuleManager(log);
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

    it('should collects providers from exports array without imports them', () => {
      const meta = moduleManager.scanModule(AppModule);
      const providers = mock.collectProvidersPerApp(meta, moduleManager);
      expect(providers.includes(Provider0)).toBe(true);
    });

    it('should collects providers in particular order', () => {
      const meta = moduleManager.scanModule(AppModule);
      expect(mock.collectProvidersPerApp(meta, moduleManager)).toEqual([
        Provider1,
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
      const providers = mock.collectProvidersPerApp(meta, moduleManager);
      expect(providers).toEqual([
        Provider1,
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
      const providers = mock.collectProvidersPerApp(meta, moduleManager);
      expect(providers).toEqual([]);
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
        })
        class AppModule {}

        const msg =
          'Exporting providers to AppModule was failed: found collision for: ' +
          'Provider2. You should manually add this provider to AppModule.';
        await expect(mock.init(AppModule, log)).rejects.toThrow(msg);
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
        })
        class AppModule {}

        const msg =
          'Exporting providers to AppModule was failed: found collision for: ' +
          'Provider1. You should manually add this provider to AppModule.';
        await expect(mock.init(AppModule, log)).rejects.toThrow(msg);
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
        })
        class AppModule {}

        const msg =
          'Exporting providers to AppModule was failed: found collision for: ' +
          'Provider1. You should manually add this provider to AppModule.';
        await expect(mock.init(AppModule, log)).rejects.toThrow(msg);
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
        })
        class AppModule {}

        await expect(mock.init(AppModule, log)).resolves.not.toThrow();
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
        })
        class AppModule {}

        await expect(mock.init(AppModule, log)).resolves.not.toThrow();
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
        })
        class AppModule {}

        await expect(mock.init(AppModule, log)).resolves.not.toThrow();
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
        })
        class AppModule {}

        const msg =
          'Exporting providers to AppModule was failed: found collision for: ' +
          'Provider2. You should manually add this provider to AppModule.';
        await expect(mock.init(AppModule, log)).rejects.toThrow(msg);
      });

      it('exporting duplicates of Provider2, but declared in providersPerReq of root module', async () => {
        @RootModule({
          imports: [Module2],
          providersPerReq: [Provider2],
        })
        class AppModule {}

        await expect(mock.init(AppModule, log)).resolves.not.toThrow();
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
        })
        class AppModule {}

        const msg =
          'Exporting providers to AppModule was failed: found collision for: ' +
          'Provider1. You should manually add this provider to AppModule.';
        await expect(mock.init(AppModule, log)).rejects.toThrow(msg);
      });

      it('exporting duplicates of Provider1 from Module1 and Module2, but declared in providersPerReq of root module', async () => {
        @RootModule({
          imports: [Module0, Module1],
          providersPerReq: [Provider1],
        })
        class AppModule {}

        await expect(mock.init(AppModule, log)).resolves.not.toThrow();
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
            { provide: NodeReqToken, useValue: '' },
            Provider3,
          ],
          providersPerMod: [Provider0],
          providersPerReq: [
            { provide: Provider1, useClass: Provider1 },
            Provider2,
            { provide: NodeReqToken, useValue: '' },
            Provider3,
            Request,
          ],
        })
        class Module0 {}

        @RootModule({
          imports: [Module0],
          providersPerApp: [Provider0],
          providersPerMod: [Provider1],
          providersPerReq: [],
        })
        class AppModule {}

        const msg =
          'Exporting providers to AppModule was failed: found collision for: ' +
          'Provider0, Request, Provider1, InjectionToken NodeRequest. You should manually add these providers to AppModule.';
        await expect(mock.init(AppModule, log)).rejects.toThrow(msg);
      });

      it('case 2', async () => {
        @Module({
          exports: [Provider0, Provider1],
          providersPerMod: [Provider0, Provider1],
          providersPerApp: [{ provide: Router, useValue: '' }],
        })
        class Module0 {}

        @RootModule({
          imports: [Module0],
        })
        class AppModule {}

        const msg =
          'Exporting providers to AppModule was failed: found collision for: ' +
          'Router. You should manually add this provider to AppModule.';
        await expect(mock.init(AppModule, log)).rejects.toThrow(msg);
      });
    });
  });
});
