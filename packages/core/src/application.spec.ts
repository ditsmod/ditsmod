import 'reflect-metadata';
import * as http from 'http';
import * as http2 from 'http2';
import * as https from 'https';
import { it, describe, beforeEach, expect } from '@jest/globals';

import { Application } from './application';
import { RootModule } from './decorators/root-module';
import { RootMetadata } from './models/root-metadata';
import { AppInitializer } from './services/app-initializer';
import { LogMediator } from './services/log-mediator';
import { ModuleType, ModuleWithParams } from './types/mix';

describe('Application', () => {
  class ApplicationMock extends Application {
    override rootMeta = new RootMetadata();
    override logMediator: LogMediator;

    override init(appModule: ModuleType) {
      return super.init(appModule);
    }

    override checkSecureServerOption(appModule: ModuleType) {
      return super.checkSecureServerOption(appModule);
    }

    override getAppInitializer(appModule: ModuleType, logMediator: LogMediator) {
      return super.getAppInitializer(appModule, logMediator);
    }

    override mergeRootMetadata(module: ModuleType | ModuleWithParams) {
      return super.mergeRootMetadata(module);
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
        serverName: 'customServerName',
        serverOptions: { isHttp2SecureServer: false },
        listenOptions: { host: 'customHost', port: 3000 },
        path: 'customPrefix',
        providersPerApp: [Provider1],
      })
      class AppModule {}

      mock.mergeRootMetadata(AppModule);
      const { serverName, serverOptions, listenOptions, path: prefixPerApp } = mock.rootMeta;
      expect(serverName).toBe('customServerName');
      expect(prefixPerApp).toBe('customPrefix');
      expect(serverOptions).toEqual({ isHttp2SecureServer: false });
      expect(listenOptions).toEqual({ host: 'customHost', port: 3000 });
    });
  });

  describe('getAppInitializer()', () => {
    @RootModule()
    class AppModule {}

    it('should return instance of AppInitializer', () => {
      expect(mock.getAppInitializer(AppModule, {} as LogMediator)).toBeInstanceOf(AppInitializer);
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
      expect(() => mock.checkSecureServerOption(AppModule)).not.toThrow();
    });

    it('should to throw with http and isHttp2SecureServer == true', () => {
      mock.rootMeta.serverOptions = { isHttp2SecureServer: true };
      mock.rootMeta.httpModule = http;
      const msg = 'serverModule.createSecureServer() not found (see AppModule settings)';
      expect(() => mock.checkSecureServerOption(AppModule)).toThrowError(msg);
    });

    it('should not to throw with http and isHttp2SecureServer == false', () => {
      mock.rootMeta.httpModule = http;
      const msg = 'serverModule.createSecureServer() not found (see AppModule settings)';
      expect(() => mock.checkSecureServerOption(AppModule)).not.toThrowError(msg);
    });

    it('should to throw with https and isHttp2SecureServer == true', () => {
      mock.rootMeta.serverOptions = { isHttp2SecureServer: true };
      mock.rootMeta.httpModule = https;
      const msg = 'serverModule.createSecureServer() not found (see AppModule settings)';
      expect(() => mock.checkSecureServerOption(AppModule)).toThrowError(msg);
    });
  });
});
