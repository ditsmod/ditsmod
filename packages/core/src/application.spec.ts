import 'reflect-metadata';
import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';

import { Application } from './application';
import { RootModule } from './decorators/root-module';
import { Logger } from './types/logger';
import { RootMetadata } from './models/root-metadata';
import { ModuleType } from './types/module-type';

describe('Application', () => {
  class MockApplication extends Application {
    meta = new RootMetadata();
    log: Logger;

    checkSecureServerOption(appModule: ModuleType) {
      return super.checkSecureServerOption(appModule);
    }
  }

  let mock: MockApplication;

  beforeEach(() => {
    mock = new MockApplication();
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
      mock.meta.serverOptions = { isHttp2SecureServer: true };
      mock.meta.httpModule = http2;
      expect(() => mock.checkSecureServerOption(AppModule)).not.toThrow();
    });

    it('should to throw with http and isHttp2SecureServer == true', () => {
      mock.meta.serverOptions = { isHttp2SecureServer: true };
      mock.meta.httpModule = http;
      const msg = 'serverModule.createSecureServer() not found (see AppModule settings)';
      expect(() => mock.checkSecureServerOption(AppModule)).toThrowError(msg);
    });

    it('should not to throw with http and isHttp2SecureServer == false', () => {
      mock.meta.httpModule = http;
      const msg = 'serverModule.createSecureServer() not found (see AppModule settings)';
      expect(() => mock.checkSecureServerOption(AppModule)).not.toThrowError(msg);
    });

    it('should to throw with https and isHttp2SecureServer == true', () => {
      mock.meta.serverOptions = { isHttp2SecureServer: true };
      mock.meta.httpModule = https;
      const msg = 'serverModule.createSecureServer() not found (see AppModule settings)';
      expect(() => mock.checkSecureServerOption(AppModule)).toThrowError(msg);
    });
  });

  describe('getGlobalProviders()', () => {});
});
