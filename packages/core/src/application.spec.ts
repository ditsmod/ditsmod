import * as http from 'http';
import * as http2 from 'http2';
import * as https from 'https';

import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { ModuleManager } from '#services/module-manager.js';
import { Router } from '#types/router.js';
import { AppOptions } from '#types/app-options.js';
import { ModuleType } from '#types/mix.js';
import { AppInitializer } from './app-initializer.js';
import { Application } from './application.js';
import { rootModule } from './decorators/root-module.js';
import { LoggerConfig } from './index.js';

describe('Application', () => {
  class ApplicationMock extends Application {
    override appOptions = new AppOptions();
    declare systemLogMediator: SystemLogMediator;

    override checkSecureServerOption() {
      return super.checkSecureServerOption();
    }

    override scanRootModule(appModule: ModuleType) {
      return super.scanRootModule(appModule);
    }

    override getAppInitializer(moduleManager: ModuleManager) {
      return new AppInitializer(this.appOptions, moduleManager, this.systemLogMediator);
    }

    override bootstrapApplication(appInitializer: AppInitializer) {
      return super.bootstrapApplication(appInitializer);
    }
  }

  let mock: ApplicationMock;

  beforeEach(() => {
    mock = new ApplicationMock();
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
        { token: Router, useValue: {} },
        { token: LoggerConfig, useValue: { level: 'off' } },
      ],
    })
    class AppModule {}

    it('should replace logMediator during call bootstrapApplication()', () => {
      const moduleManager = mock.scanRootModule(AppModule);
      const appInitializer = mock.getAppInitializer(moduleManager);
      const { systemLogMediator } = mock;
      mock.bootstrapApplication(appInitializer);
      expect(mock.systemLogMediator !== systemLogMediator).toBe(true);
    });
  });
});
