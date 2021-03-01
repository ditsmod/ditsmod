import 'reflect-metadata';
import * as http from 'http';
import { Provider, Type } from '@ts-stack/di';

import { ModuleType } from '../types/types';
import { AppInitializer } from './app-initializer';
import { Module, ModuleMetadata, ModuleWithOptions } from '../decorators/module';
import { RootModule } from '../decorators/root-module';
import { AppMetadata } from '../decorators/app-metadata';
import { ImportWithOptions } from '../types/import-with-options';

describe('AppInitializer', () => {
  class MockAppInitializer extends AppInitializer {
    opts = new AppMetadata();

    mergeMetadata(appModule: ModuleType): void {
      return super.mergeMetadata(appModule);
    }

    getRawModuleMetadata(modOrObject: Type<any> | ModuleWithOptions<any>, isRoot?: boolean) {
      return super.getRawModuleMetadata(modOrObject, isRoot);
    }

    collectProvidersPerApp(mod: Type<any> | ModuleWithOptions<any>) {
      return super.collectProvidersPerApp(mod);
    }

    bootstrapModuleFactory(appModule: ModuleType) {
      return super.bootstrapModuleFactory(appModule);
    }

    prepareProvidersPerApp(appModule: ModuleType) {
      return super.prepareProvidersPerApp(appModule);
    }
  }

  let mock: MockAppInitializer;

  beforeEach(async () => {
    mock = new MockAppInitializer();
  });

  describe('mergeMetadata()', () => {
    it('should set the default metatada', () => {
      @RootModule()
      class AppModule {}

      mock.mergeMetadata(AppModule);
      expect(mock.opts.httpModule).toBe(http);
      expect(mock.opts.serverName).toBe('Node.js');
      expect(mock.opts.serverOptions).toEqual({});
      expect(mock.opts.listenOptions).toBeDefined();
      expect(mock.opts.prefixPerApp).toBe('');
      expect(mock.opts.providersPerApp).toEqual([]);

      const opts = (mock.opts as unknown) as ModuleMetadata;
      expect(opts.controllers).toBe(undefined);
      expect(opts.exports).toBe(undefined);
      expect(opts.imports).toBe(undefined);
      expect(opts.providersPerMod).toBe(undefined);
      expect(opts.providersPerReq).toBe(undefined);
    });

    it('should merge default metatada with AppModule metadata', () => {
      class Controller1 {}
      class Provider1 {}
      class Module1 {}
      class Module2 {}

      const imports: ImportWithOptions[] = [
        { prefix: '', module: Module1 },
        { guards: [], module: Module2 },
      ];

      @RootModule({
        prefixPerApp: 'api',
        imports,
        controllers: [Controller1],
        providersPerApp: [Provider1],
      })
      class AppModule {}

      mock.mergeMetadata(AppModule);
      expect(mock.opts.httpModule).toBe(http);
      expect(mock.opts.serverName).toEqual('Node.js');
      expect(mock.opts.serverOptions).toEqual({});
      expect(mock.opts.prefixPerApp).toBe('api');
      expect(mock.opts.providersPerApp).toEqual([Provider1]);
      expect(mock.opts.listenOptions).toBeDefined();

      const opts = (mock.opts as unknown) as ModuleMetadata;
      expect(opts.controllers).toBe(undefined);
      expect(opts.exports).toBe(undefined);
      expect(opts.imports).toBe(undefined);
      expect(opts.providersPerMod).toBe(undefined);
      expect(opts.providersPerReq).toBe(undefined);
    });

    it('should throw error about absence @Module decorator', () => {
      class Module1 {}
      const msg = 'Module build failed: module "Module1" does not have the "@RootModule()" decorator';
      expect(() => mock.mergeMetadata(Module1)).toThrowError(msg);
    });
  });

  describe('prepareProvidersPerApp()', () => {
    it('should throw an error about non-identical duplicates in feature modules', () => {
      class Provider1 {}

      @Module({ providersPerApp: [{ provide: Provider1, useClass: Provider1 }] })
      class Module1 {}

      @Module({ providersPerApp: [Provider1] })
      class Module2 {}

      @RootModule({
        imports: [Module1, Module2],
      })
      class RootModule1 {}

      mock.mergeMetadata(RootModule1);
      const msg =
        'Exporting providers to RootModule1 was failed: found collision for: ' +
        'Provider1. You should manually add this provider to RootModule1.';
      expect(() => mock.prepareProvidersPerApp(RootModule1)).toThrow(msg);
    });

    it('should works with identical duplicates in feature modules', () => {
      class Provider1 {}

      @Module({ providersPerApp: [Provider1] })
      class Module1 {}

      @Module({ providersPerApp: [Provider1] })
      class Module2 {}

      @RootModule({
        imports: [Module1, Module2],
      })
      class RootModule1 {}

      mock.mergeMetadata(RootModule1);
      expect(() => mock.prepareProvidersPerApp(RootModule1)).not.toThrow();
    });

    it('should works with duplicates in providersPerApp of root module', () => {
      class Provider1 {}

      @RootModule({ providersPerApp: [Provider1, Provider1, { provide: Provider1, useClass: Provider1 }] })
      class RootModule2 {}

      mock.mergeMetadata(RootModule2);
      expect(() => mock.prepareProvidersPerApp(RootModule2)).not.toThrow();
      expect(mock.opts.providersPerApp.length).toBe(3);
    });

    it('should works with duplicates in root imports module', () => {
      class Provider1 {}
      const Alias = Provider1;
      const duplicates = [Provider1, Alias, { provide: Provider1, useClass: Provider1 }];

      @Module({ providersPerApp: duplicates })
      class Module1 {}

      @RootModule({
        imports: [Module1],
      })
      class RootModule1 {}

      mock.mergeMetadata(RootModule1);
      expect(() => mock.prepareProvidersPerApp(RootModule1)).not.toThrow();
    });

    it('should works with duplicates in feature module and root module', () => {
      class Provider1 {}
      const Alias = Provider1;
      const duplicates = [Provider1, Alias, { provide: Provider1, useClass: Provider1 }];

      @Module({ providersPerApp: duplicates })
      class Module1 {}

      @RootModule({
        imports: [Module1],
        providersPerApp: duplicates,
      })
      class RootModule3 {}

      mock.mergeMetadata(RootModule3);
      expect(() => mock.prepareProvidersPerApp(RootModule3)).not.toThrow();
      expect(mock.opts.providersPerApp.length).toBe(4);
    });

    it('should works with empty "imports" array in root module', () => {
      @RootModule({ imports: [] })
      class RootModule4 {}
      mock.mergeMetadata(RootModule4);
      expect(() => mock.prepareProvidersPerApp(RootModule4)).not.toThrow();
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
      const providers = mock.collectProvidersPerApp(AppModule);
      expect(providers.includes(Provider0)).toBe(true);
    });

    it('should collects providers in particular order', () => {
      expect(mock.collectProvidersPerApp(AppModule)).toEqual([
        Provider1,
        Provider2,
        Provider3,
        Provider4,
        Provider5,
        Provider6,
        Provider0,
      ]);
    });

    it('should flattens arrays with modules', () => {
      @Module({
        imports: [Module1, [AppModule]],
      })
      class Module5 {}

      expect(mock.collectProvidersPerApp(Module5)).toEqual([
        Provider1,
        Provider1,
        Provider2,
        Provider3,
        Provider4,
        Provider5,
        Provider6,
        Provider0,
      ]);
    });

    it('should works with moduleWithOptions', () => {
      @Module({
        imports: [AppModule],
      })
      class Module6 {
        static withOptions(providers: Provider[]): ModuleWithOptions<Module6> {
          return { module: Module6, providersPerApp: providers };
        }
      }
      const modWithOptions = Module6.withOptions([Provider7]);
      expect(mock.collectProvidersPerApp(modWithOptions)).toEqual([
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
      expect(mock.collectProvidersPerApp(Module7)).toEqual([]);
    });
  });
});
