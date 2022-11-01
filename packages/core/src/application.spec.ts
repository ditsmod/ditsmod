import 'reflect-metadata';
import { beforeEach, fdescribe, describe, expect, it } from '@jest/globals';
import * as http from 'http';
import * as http2 from 'http2';
import * as https from 'https';

import { AppInitializer } from './app-initializer';
import { Application } from './application';
import { RootModule } from './decorators/root-module';
import { RootMetadata } from './models/root-metadata';
import { LogMediator } from './services/log-mediator';
import { ModuleType, ModuleWithParams } from './types/mix';

describe('Application', () => {
  class ApplicationMock extends Application {
    override rootMeta = new RootMetadata();
    override logMediator: LogMediator;

    override mergeRootMetadata(module: ModuleType | ModuleWithParams) {
      return super.mergeRootMetadata(module);
    }

    override checkSecureServerOption(rootModuleName: string) {
      return super.checkSecureServerOption(rootModuleName);
    }

    override scanRootModuleAndGetAppInitializer(appModule: ModuleType, logMediator: LogMediator) {
      return super.scanRootModuleAndGetAppInitializer(appModule, logMediator);
    }
  }

  let mock: ApplicationMock;

  beforeEach(() => {
    mock = new ApplicationMock();
  });

  describe('mergeRootMetadata()', () => {
    it('should merge custom options for the root module', () => {
      class Provider1 {}

      @RootModule({
        serverOptions: { isHttp2SecureServer: false },
        listenOptions: { host: 'customHost', port: 3000 },
        path: 'customPrefix',
        providersPerApp: [Provider1],
      })
      class AppModule {}

      mock.mergeRootMetadata(AppModule);
      const { serverOptions, listenOptions, path: prefixPerApp } = mock.rootMeta;
      expect(prefixPerApp).toBe('customPrefix');
      expect(serverOptions).toEqual({ isHttp2SecureServer: false });
      expect(listenOptions).toEqual({ host: 'customHost', port: 3000 });
    });
  });

  describe('checkSecureServerOption()', () => {
    class Provider1 {}
    class Provider2 {}
    @RootModule({
      controllers: [Provider1],
      providersPerApp: [Provider2],
    })
    class AppModule {}

    it('should not to throw with http2 and isHttp2SecureServer == true', () => {
      mock.rootMeta.serverOptions = { isHttp2SecureServer: true };
      mock.rootMeta.httpModule = http2;
      expect(() => mock.checkSecureServerOption(AppModule.name)).not.toThrow();
    });

    it('should to throw with http and isHttp2SecureServer == true', () => {
      mock.rootMeta.serverOptions = { isHttp2SecureServer: true };
      mock.rootMeta.httpModule = http;
      const msg = 'serverModule.createSecureServer() not found (see AppModule settings)';
      expect(() => mock.checkSecureServerOption(AppModule.name)).toThrowError(msg);
    });

    it('should not to throw with http and isHttp2SecureServer == false', () => {
      mock.rootMeta.httpModule = http;
      const msg = 'serverModule.createSecureServer() not found (see AppModule settings)';
      expect(() => mock.checkSecureServerOption(AppModule.name)).not.toThrowError(msg);
    });

    it('should to throw with https and isHttp2SecureServer == true', () => {
      mock.rootMeta.serverOptions = { isHttp2SecureServer: true };
      mock.rootMeta.httpModule = https;
      const msg = 'serverModule.createSecureServer() not found (see AppModule settings)';
      expect(() => mock.checkSecureServerOption(AppModule.name)).toThrowError(msg);
    });
  });

  describe('scanRootModuleAndGetAppInitializer()', () => {
    @RootModule()
    class AppModule {}

    it('should return instance of AppInitializer', () => {
      expect(mock.scanRootModuleAndGetAppInitializer(AppModule, {} as LogMediator)).toBeInstanceOf(AppInitializer);
    });
  });
});
