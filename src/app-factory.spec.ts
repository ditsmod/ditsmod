import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';
import { ReflectiveInjector } from 'ts-di';

import { AppFactory } from './app-factory';
import { ModuleType, Logger, Server, Router } from './types/types';
import { RootModuleDecorator, RootModule } from './types/decorators';
import { PreRequest } from './services/pre-request';
import { defaultProvidersPerApp, ApplicationMetadata } from './types/default-options';

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

    getAppModuleMetadata(appModule: ModuleType): RootModuleDecorator {
      return super.getAppModuleMetadata(appModule);
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

  describe('getAppModuleMetadata()', () => {
    it('should returns ClassWithDecorators metadata', () => {
      @RootModule({ controllers: [SomeControllerClass] })
      class ClassWithDecorators {}
      const metadata = mock.getAppModuleMetadata(ClassWithDecorators);
      expect(metadata).toEqual(new RootModule({ controllers: [SomeControllerClass] }));
    });

    it('should not returns any metadata', () => {
      const metadata = mock.getAppModuleMetadata(ClassWithoutDecorators);
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
