import 'reflect-metadata';
import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';
import { ReflectiveInjector, Type, Provider } from '@ts-stack/di';

import { AppFactory } from './app-factory';
import { RootModule, ApplicationMetadata } from './decorators/root-module';
import { PreRequest } from './services/pre-request';
import { Router, RoutesPrefixPerMod } from './types/router';
import { Logger } from './types/logger';
import { Server } from './types/server-options';
import { Module, ModuleType, ModuleDecorator, ModuleWithOptions } from './decorators/module';
import { Controller } from './decorators/controller';

describe('AppFactory', () => {
  class MockAppFactory extends AppFactory {
    log: Logger;
    server: Server;
    injectorPerApp: ReflectiveInjector;
    router: Router;
    preReq: PreRequest;
    opts = new ApplicationMetadata();

    mergeMetadata(appModule: ModuleType): void {
      return super.mergeMetadata(appModule);
    }

    getRawModuleMetadata<T extends ModuleDecorator>(
      typeOrObject: Type<any> | ModuleWithOptions<any>,
      isRoot?: boolean
    ): T {
      return super.getRawModuleMetadata(typeOrObject, isRoot);
    }

    exportProvidersPerApp(mod: Type<any> | ModuleWithOptions<any>) {
      return super.exportProvidersPerApp(mod);
    }

    checkSecureServerOption(appModule: ModuleType) {
      return super.checkSecureServerOption(appModule);
    }

    prepareServerOptions(appModule: ModuleType) {
      return super.prepareServerOptions(appModule);
    }

    bootstrapModuleFactory(appModule: ModuleType) {
      return super.bootstrapModuleFactory(appModule);
    }

    prepareProvidersPerApp(appModule: ModuleType) {
      return super.prepareProvidersPerApp(appModule);
    }
  }

  let mock: MockAppFactory;
  class SomeControllerClass {}
  class ClassWithoutDecorators {}

  beforeEach(() => {
    mock = new MockAppFactory();
  });

  describe('getProvidersPerApp() and importProvidersPerApp()', () => {
    class Provider1 {}
    class Provider2 {}
    class Provider3 {}
    class Provider4 {}
    class Provider5 {}
    class Provider6 {}
    class Provider7 {}

    @Module({
      providersPerApp: [Provider1]
    })
    class Module1 {}

    @Module({
      providersPerApp: [Provider2, Provider3, Provider4],
      imports: [Module1]
    })
    class Module2 {}

    @Module({
      providersPerApp: [Provider5, Provider6],
      imports: [Module2]
    })
    class Module3 {}

    @Module({
      imports: [Module3]
    })
    class Module4 {}

    @Module({
      imports: [Module1, [Module4]]
    })
    class Module5 {}

    it('should have 6 providersPerApp imported from Module3', () => {
      expect(mock.exportProvidersPerApp(Module4)).toEqual([
        Provider1,
        Provider2,
        Provider3,
        Provider4,
        Provider5,
        Provider6
      ]);
    });

    it('should have 7 providersPerApp imported from Module1 and Module4', () => {
      expect(mock.exportProvidersPerApp(Module5)).toEqual([
        Provider1,
        Provider1,
        Provider2,
        Provider3,
        Provider4,
        Provider5,
        Provider6
      ]);
    });

    @Module({
      imports: [Module4]
    })
    class Module6 {
      static withOptions(providers: Provider[]): ModuleWithOptions<Module6> {
        return { module: Module6, providersPerApp: providers };
      }
    }

    it('should have 7 providersPerApp imported from Module4 and Module6', () => {
      const modWithOptions = Module6.withOptions([Provider7]);
      expect(mock.exportProvidersPerApp(modWithOptions)).toEqual([
        Provider1,
        Provider2,
        Provider3,
        Provider4,
        Provider5,
        Provider6,
        Provider7
      ]);
    });

    @Module()
    class Module7 {}

    it('should have empty array of providersPerApp', () => {
      expect(mock.exportProvidersPerApp(Module7)).toEqual([]);
    });
  });

  describe('mergeMetadata()', () => {
    it('should set default metatada', () => {
      @RootModule()
      class ClassWithDecorators {}

      mock.mergeMetadata(ClassWithDecorators);
      expect(mock.opts.serverName).toBe('Node.js');
      expect(mock.opts.serverOptions).toEqual({});
      expect(mock.opts.httpModule).toBeDefined();
      expect(mock.opts.routesPrefixPerApp).toBe('');
      expect(mock.opts.routesPrefixPerMod).toEqual([]);
      expect(mock.opts.providersPerApp).toEqual([]);
      expect(mock.opts.listenOptions).toBeDefined();
      // Ignore controllers - it's intended behavior.
      expect((mock.opts as any).routesPerMod).toBe(undefined);
      expect((mock.opts as any).controllers).toBe(undefined);
      expect((mock.opts as any).exports).toBe(undefined);
      expect((mock.opts as any).imports).toBe(undefined);
      expect((mock.opts as any).providersPerMod).toBe(undefined);
      expect((mock.opts as any).providersPerReq).toBe(undefined);
    });

    it('should merge default metatada with ClassWithDecorators metadata', () => {
      class SomeModule {}
      class OtherModule {}

      const routesPrefixPerMod: RoutesPrefixPerMod[] = [
        { prefix: '', module: SomeModule },
        { prefix: '', module: OtherModule }
      ];

      @RootModule({
        routesPrefixPerApp: 'api',
        routesPrefixPerMod,
        controllers: [SomeControllerClass],
        providersPerApp: [ClassWithoutDecorators]
      })
      class ClassWithDecorators {}

      mock.mergeMetadata(ClassWithDecorators);
      expect(mock.opts.serverName).toEqual('Node.js');
      expect(mock.opts.serverOptions).toEqual({});
      expect(mock.opts.httpModule).toBeDefined();
      expect(mock.opts.routesPrefixPerApp).toBe('api');
      expect(mock.opts.routesPrefixPerMod).toEqual(routesPrefixPerMod);
      expect(mock.opts.providersPerApp).toEqual([ClassWithoutDecorators]);
      expect(mock.opts.listenOptions).toBeDefined();
      // Ignore controllers - it's intended behavior.
      expect((mock.opts as any).routesPerMod).toBe(undefined);
      expect((mock.opts as any).controllers).toBe(undefined);
      expect((mock.opts as any).exports).toBe(undefined);
      expect((mock.opts as any).imports).toBe(undefined);
      expect((mock.opts as any).providersPerMod).toBe(undefined);
      expect((mock.opts as any).providersPerReq).toBe(undefined);
    });

    it('ClassWithoutDecorators should not have metatada', () => {
      const msg = `Module build failed: module "ClassWithoutDecorators" does not have the "@RootModule()" decorator`;
      expect(() => mock.mergeMetadata(ClassWithoutDecorators)).toThrowError(msg);
    });
  });

  describe('getRawModuleMetadata()', () => {
    it('should returns ClassWithDecorators metadata', () => {
      @RootModule({ controllers: [SomeControllerClass] })
      class ClassWithDecorators {}
      const metadata = mock.getRawModuleMetadata(ClassWithDecorators, true);
      expect(metadata).toEqual(new RootModule({ controllers: [SomeControllerClass] }));
    });

    it('should not returns any metadata', () => {
      const metadata = mock.getRawModuleMetadata(ClassWithoutDecorators, true);
      expect(metadata).toBeUndefined();
    });
  });

  describe('checkSecureServerOption()', () => {
    @RootModule({
      controllers: [SomeControllerClass],
      providersPerApp: [ClassWithoutDecorators]
    })
    class ClassWithDecorators {}

    it('should not to throw with http2 and isHttp2SecureServer == true', () => {
      mock.opts.serverOptions = { isHttp2SecureServer: true };
      mock.opts.httpModule = http2;
      expect(() => mock.checkSecureServerOption(ClassWithDecorators)).not.toThrow();
    });

    it('should to throw with http and isHttp2SecureServer == true', () => {
      mock.opts.serverOptions = { isHttp2SecureServer: true };
      mock.opts.httpModule = http;
      const msg = 'serverModule.createSecureServer() not found (see ClassWithDecorators settings)';
      expect(() => mock.checkSecureServerOption(ClassWithDecorators)).toThrowError(msg);
    });

    it('should not to throw with http and isHttp2SecureServer == false', () => {
      mock.opts.httpModule = http;
      const msg = 'serverModule.createSecureServer() not found (see ClassWithDecorators settings)';
      expect(() => mock.checkSecureServerOption(ClassWithDecorators)).not.toThrowError(msg);
    });

    it('should to throw with https and isHttp2SecureServer == true', () => {
      mock.opts.serverOptions = { isHttp2SecureServer: true };
      mock.opts.httpModule = https;
      const msg = 'serverModule.createSecureServer() not found (see ClassWithDecorators settings)';
      expect(() => mock.checkSecureServerOption(ClassWithDecorators)).toThrowError(msg);
    });
  });

  describe('prepareProvidersPerApp()', () => {
    @Controller()
    class Provider1 {}

    const Alias = Provider1;
    const duplicates = [Provider1, Alias];

    @Module({ providersPerApp: duplicates })
    class Module0 {}

    @RootModule({
      imports: [Module0]
    })
    class RootModule1 {}

    it(`case 1`, () => {
      mock.mergeMetadata(RootModule1);
      const msg = `Exporting providers in RootModule1 was failed: Unpredictable priority was found for: Provider1. You should manually add these providers.`;
      expect(() => mock.prepareProvidersPerApp(RootModule1)).toThrow(msg);
    });

    @RootModule({ providersPerApp: duplicates })
    class RootModule2 {}

    it(`case 2`, () => {
      mock.mergeMetadata(RootModule2);
      expect(() => mock.prepareProvidersPerApp(RootModule2)).not.toThrow();
      expect(mock.opts.providersPerApp.length).toBe(2);
    });

    @RootModule({
      imports: [Module0],
      providersPerApp: duplicates
    })
    class RootModule3 {}

    it(`case 3`, () => {
      mock.mergeMetadata(RootModule3);
      expect(() => mock.prepareProvidersPerApp(RootModule3)).not.toThrow();
      expect(mock.opts.providersPerApp.length).toBe(4);
    });

    @RootModule({
      imports: []
    })
    class RootModule4 {}

    it(`case 4`, () => {
      mock.mergeMetadata(RootModule4);
      expect(() => mock.prepareProvidersPerApp(RootModule4)).not.toThrow();
    });
  });
});
