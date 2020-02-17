import 'reflect-metadata';
import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';
import { ReflectiveInjector, Type } from 'ts-di';

import { AppFactory } from './app-factory';
import { RootModuleDecorator, RootModule, ApplicationMetadata, defaultProvidersPerApp } from './decorators/root-module';
import { PreRequest } from './services/pre-request';
import { Router } from './types/router';
import { Logger } from './types/logger';
import { Server } from './types/server-options';
import { Module, ModuleType, ModuleDecorator, ModuleWithOptions } from './decorators/module';
import { isRootModule } from './utils/type-guards';

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
      checker: (arg: RootModuleDecorator | ModuleDecorator) => boolean
    ): T {
      return super.getRawModuleMetadata(typeOrObject, checker);
    }

    getProvidersPerApp(mod: ModuleType) {
      return super.getProvidersPerApp(mod);
    }

    checkSecureServerOption(appModule: ModuleType) {
      return super.checkSecureServerOption(appModule);
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

    it('should have 9 providersPerApp imported from Module1 and Module4', () => {
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

    @Module()
    class Module6 {}

    it('should have empty array of providersPerApp', () => {
      expect(mock.getProvidersPerApp(Module6)).toEqual([]);
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

      const routesPrefixPerMod = [
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

  describe('getAppMetadata()', () => {
    it('should returns ClassWithDecorators metadata', () => {
      @RootModule({ controllers: [SomeControllerClass] })
      class ClassWithDecorators {}
      const metadata = mock.getRawModuleMetadata(ClassWithDecorators, isRootModule);
      expect(metadata).toEqual(new RootModule({ controllers: [SomeControllerClass] }));
    });

    it('should not returns any metadata', () => {
      const metadata = mock.getRawModuleMetadata(ClassWithoutDecorators, isRootModule);
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
});
