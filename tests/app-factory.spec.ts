import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';
import { ReflectiveInjector } from 'ts-di';

import { AppFactory } from '../src/app-factory';
import { ModuleType, Logger, Server, Router } from '../src/types/types';
import { RootModuleDecorator, RootModule } from '../src/types/decorators';
import { PreRequest } from '../src/services/pre-request';
import { defaultProvidersPerApp, ApplicationMetadata } from '../src/types/default-options';

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

  describe('mergeMetadata()', () => {
    it('should set default metatada', () => {
      @RootModule()
      class ClassWithDecorators {}
      mock.mergeMetadata(ClassWithDecorators);
      expect(mock.opts.serverName).toEqual('Node.js');
      expect(mock.opts.serverOptions).toEqual({});
      expect(mock.opts.httpModule).toBeDefined();
      expect(mock.opts.providersPerApp).toEqual(defaultProvidersPerApp);
      expect((mock.opts as any).controllers).toEqual(undefined);
      expect((mock.opts as any).exports).toEqual(undefined);
      expect((mock.opts as any).imports).toEqual(undefined);
      expect(mock.opts.listenOptions).toBeDefined();
      expect((mock.opts as any).providersPerMod).toEqual(undefined);
      expect((mock.opts as any).providersPerReq).toEqual(undefined);
    });

    it('should merge default metatada with ClassWithDecorators metadata', () => {
      @RootModule({
        controllers: [SomeControllerClass],
        providersPerApp: [ClassWithoutDecorators]
      })
      class ClassWithDecorators {}
      mock.mergeMetadata(ClassWithDecorators);
      expect(mock.opts.serverName).toEqual('Node.js');
      expect(mock.opts.serverOptions).toEqual({});
      expect(mock.opts.httpModule).toBeDefined();
      expect(mock.opts.providersPerApp).toEqual([...defaultProvidersPerApp, ClassWithoutDecorators]);
      // Ignore controllers - it's intended behavior.
      expect((mock.opts as any).controllers).toEqual(undefined);
      expect((mock.opts as any).exports).toEqual(undefined);
      expect((mock.opts as any).imports).toEqual(undefined);
      expect(mock.opts.listenOptions).toBeDefined();
      expect((mock.opts as any).providersPerMod).toEqual(undefined);
      expect((mock.opts as any).providersPerReq).toEqual(undefined);
    });

    it('ClassWithoutDecorators should not have metatada', () => {
      const msg = `Module build failed: module "ClassWithoutDecorators" does not have the "@RootModule()" decorator`;
      expect(() => mock.mergeMetadata(ClassWithoutDecorators)).toThrowError(msg);
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
