import * as http from 'http';
import * as http2 from 'http2';
import * as https from 'https';
import { describe, expect, it, beforeEach } from 'vitest';
import {
  SystemLogMediator,
  AppOptions,
  ModuleType,
  AppInitializer,
  LogMediator,
  rootModule,
  ModuleManager,
  LoggerConfig,
} from '@ditsmod/core';

import { RoutingApplication } from './routing-application.js';
import { AppOptions } from '../types/app-options.js';

describe('Application', () => {
  class ApplicationMock extends RoutingApplication {
    override appOptions = new AppOptions();
    declare systemLogMediator: SystemLogMediator;

    override init(appOptions?: AppOptions) {
      return super.init(appOptions);
    }

    override checkSecureServerOption() {
      return super.checkSecureServerOption();
    }

    override scanRootModule(appModule: ModuleType) {
      return super.scanRootModule(appModule);
    }

    override bootstrapApplication(appInitializer: AppInitializer) {
      return super.bootstrapApplication(appInitializer);
    }
  }

  let mock: ApplicationMock;

  beforeEach(() => {
    mock = new ApplicationMock();
  });

  describe('init()', () => {
    it('should merge AppOptions with default', () => {
      mock.init({ bufferLogs: false });
      expect(mock.appOptions.bufferLogs).toBe(false);
      expect(LogMediator.bufferLogs).toBe(false);
      expect(mock.appOptions.path).toBeDefined();
      expect(mock.appOptions.serverOptions).toBeDefined();
    });
  });

  describe('checkSecureServerOption()', () => {
    const msg = 'createSecureServer() not found';

    it('should not to throw with http2 and isHttp2SecureServer == true', () => {
      mock.appOptions.serverOptions = { isHttp2SecureServer: true };
      mock.appOptions.httpModule = http2;
      expect(() => mock.checkSecureServerOption()).not.toThrow();
    });

    it('should to throw with http and isHttp2SecureServer == true', () => {
      mock.appOptions.serverOptions = { isHttp2SecureServer: true };
      mock.appOptions.httpModule = http;
      expect(() => mock.checkSecureServerOption()).toThrow(msg);
    });

    it('should not to throw with http and isHttp2SecureServer == false', () => {
      mock.appOptions.httpModule = http;
      expect(() => mock.checkSecureServerOption()).not.toThrow(msg);
    });

    it('should to throw with https and isHttp2SecureServer == true', () => {
      mock.appOptions.serverOptions = { isHttp2SecureServer: true };
      mock.appOptions.httpModule = https;
      expect(() => mock.checkSecureServerOption()).toThrow(msg);
    });
  });

  describe('scanRootModule()', () => {
    @rootModule({})
    class AppModule {}

    it('should return instance of ModuleManager', () => {
      expect(mock.scanRootModule(AppModule)).toBeInstanceOf(ModuleManager);
    });
  });

  describe('bootstrapApplication()', () => {
    @rootModule({
      providersPerApp: [
        // { token: Router, useValue: {} },
        { token: LoggerConfig, useValue: { level: 'off' } },
      ],
    })
    class AppModule {}

    it('should replace systemLogMediator during call bootstrapApplication()', async () => {
      const moduleManager = mock.scanRootModule(AppModule);
      const appInitializer = new AppInitializer(
        new AppOptions(),
        moduleManager,
        new SystemLogMediator({ moduleName: '' }),
      );
      const { systemLogMediator } = mock;
      await mock.bootstrapApplication(appInitializer);
      expect(mock.systemLogMediator !== systemLogMediator).toBe(true);
    });
  });
});
