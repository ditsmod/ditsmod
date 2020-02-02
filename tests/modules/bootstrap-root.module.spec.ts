import { ListenOptions } from 'net';
import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';
import { Provider, ReflectiveInjector } from 'ts-di';

import { BootstrapRootModule } from '../../src/modules/bootstrap-root.module';
import { ModuleType, Logger, HttpModule, ServerOptions, Server, Router } from '../../src/types/types';
import { RootModuleDecorator, RootModule } from '../../src/types/decorators';
import { PreRequest } from '../../src/services/pre-request';
import { defaultProvidersPerApp } from '../../src/types/default-options';

describe('BootstrapRootModule', () => {
  class MockBootstrapRootModule extends BootstrapRootModule {
    log: Logger;
    serverName: string;
    httpModule: HttpModule;
    serverOptions: ServerOptions;
    server: Server;
    listenOptions: ListenOptions;
    providersPerApp: Provider[];
    injectorPerApp: ReflectiveInjector;
    router: Router;
    preReq: PreRequest;

    mergeMetadata(appModule: ModuleType): RootModuleDecorator {
      return super.mergeMetadata(appModule);
    }

    getAppModuleMetadata(appModule: ModuleType): RootModuleDecorator {
      return super.getAppModuleMetadata(appModule);
    }

    checkSecureServerOption(appModule: ModuleType) {
      return super.checkSecureServerOption(appModule);
    }
  }

  let mock: MockBootstrapRootModule;
  class SomeControllerClass {}
  class ClassWithoutDecorators {}

  beforeEach(() => {
    mock = new MockBootstrapRootModule();
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
      const metadata = mock.mergeMetadata(ClassWithDecorators);
      expect(metadata.serverName).toEqual('Node.js');
      expect(metadata.serverOptions).toEqual({});
      expect(metadata.httpModule).toBeDefined();
      expect(metadata.providersPerApp).toEqual(defaultProvidersPerApp);
      expect(metadata.controllers).toEqual(undefined);
      expect(metadata.exports).toEqual(undefined);
      expect(metadata.imports).toEqual(undefined);
      expect(metadata.listenOptions).toBeDefined();
      expect(metadata.providersPerMod).toEqual(undefined);
      expect(metadata.providersPerReq).toEqual(undefined);
    });

    it('should merge default metatada with ClassWithDecorators metadata', () => {
      @RootModule({
        controllers: [SomeControllerClass],
        providersPerApp: [ClassWithoutDecorators]
      })
      class ClassWithDecorators {}
      const metadata = mock.mergeMetadata(ClassWithDecorators);
      expect(metadata.serverName).toEqual('Node.js');
      expect(metadata.serverOptions).toEqual({});
      expect(metadata.httpModule).toBeDefined();
      expect(metadata.providersPerApp).toEqual([...defaultProvidersPerApp, ClassWithoutDecorators]);
      // Ignore controllers - it's intended behavior.
      expect(metadata.controllers).toEqual(undefined);
      expect(metadata.exports).toEqual(undefined);
      expect(metadata.imports).toEqual(undefined);
      expect(metadata.listenOptions).toBeDefined();
      expect(metadata.providersPerMod).toEqual(undefined);
      expect(metadata.providersPerReq).toEqual(undefined);
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
      mock.serverOptions = { isHttp2SecureServer: true };
      mock.httpModule = http2;
      expect(() => mock.checkSecureServerOption(ClassWithDecorators)).not.toThrow();
    });

    it('should to throw with http and isHttp2SecureServer == true', () => {
      mock.serverOptions = { isHttp2SecureServer: true };
      mock.httpModule = http;
      const msg = 'serverModule.createSecureServer() not found (see ClassWithDecorators settings)';
      expect(() => mock.checkSecureServerOption(ClassWithDecorators)).toThrowError(msg);
    });

    it('should not to throw with http and isHttp2SecureServer == false', () => {
      mock.httpModule = http;
      const msg = 'serverModule.createSecureServer() not found (see ClassWithDecorators settings)';
      expect(() => mock.checkSecureServerOption(ClassWithDecorators)).not.toThrowError(msg);
    });

    it('should to throw with https and isHttp2SecureServer == true', () => {
      mock.serverOptions = { isHttp2SecureServer: true };
      mock.httpModule = https;
      const msg = 'serverModule.createSecureServer() not found (see ClassWithDecorators settings)';
      expect(() => mock.checkSecureServerOption(ClassWithDecorators)).toThrowError(msg);
    });
  });
});
