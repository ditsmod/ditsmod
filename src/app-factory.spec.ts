import 'reflect-metadata';
import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';
import { ReflectiveInjector, Type, Provider } from '@ts-stack/di';

import { AppFactory } from './app-factory';
import { RootModule, ApplicationMetadata, defaultProvidersPerApp } from './decorators/root-module';
import { PreRequest } from './services/pre-request';
import { Router, RootModules } from './types/router';
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

    getProvidersPerApp(mod: Type<any> | ModuleWithOptions<any>) {
      return super.getProvidersPerApp(mod);
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
      expect(mock.getProvidersPerApp(Module4)).toEqual([
        Provider1,
        Provider2,
        Provider3,
        Provider4,
        Provider5,
        Provider6
      ]);
    });

    it('should have 7 providersPerApp imported from Module1 and Module4', () => {
      expect(mock.getProvidersPerApp(Module5)).toEqual([
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
      expect(mock.getProvidersPerApp(modWithOptions)).toEqual([
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
      expect(mock.getProvidersPerApp(Module7)).toEqual([]);
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
      expect(mock.opts.rootModules).toEqual([]);
      expect(mock.opts.providersPerApp).toEqual(defaultProvidersPerApp);
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
      class SomeEntity {}

      const rootModules: RootModules[] = [
        { prefix: '', rootModule: SomeModule },
        { prefix: '', rootModule: OtherModule }
      ];

      @RootModule({
        routesPrefixPerApp: 'api',
        rootModules,
        controllers: [SomeControllerClass],
        providersPerApp: [ClassWithoutDecorators]
      })
      class ClassWithDecorators {}

      mock.mergeMetadata(ClassWithDecorators);
      expect(mock.opts.serverName).toEqual('Node.js');
      expect(mock.opts.serverOptions).toEqual({});
      expect(mock.opts.httpModule).toBeDefined();
      expect(mock.opts.routesPrefixPerApp).toBe('api');
      expect(mock.opts.rootModules).toEqual(rootModules);
      expect(mock.opts.providersPerApp).toEqual([...defaultProvidersPerApp, ClassWithoutDecorators]);
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

    @Module({
      providersPerApp: [Provider1, Alias]
    })
    class Module0 {}

    @RootModule({
      imports: [Module0]
    })
    class RootModule1 {}

    @RootModule({
      providersPerApp: [Provider1, Alias]
    })
    class RootModule2 {}

    it(`should to throw an error about duplicates of providers`, () => {
      const msg = `The duplicates in 'providersPerApp' was found: Provider1`;
      expect(() => mock.prepareServerOptions(RootModule1)).toThrow(msg);
    });

    it(`should not to throw an error about duplicates of providers`, () => {
      expect(() => mock.prepareServerOptions(RootModule2)).not.toThrow();
      expect(mock.opts.providersPerApp.length).toBe(defaultProvidersPerApp.length + 2);
    });
  });
});
