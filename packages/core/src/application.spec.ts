import 'reflect-metadata';
import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';
import { Injectable, InjectionToken } from '@ts-stack/di';
import { DefaultRouter } from '@ditsmod/router';

import { Application } from './application';
import { RootModule } from './decorators/root-module';
import { Logger, LoggerConfig } from './types/logger';
import { RootMetadata } from './models/root-metadata';
import { ModuleType } from './types/module-type';
import { Extension } from './types/extension';
import { Router } from './types/router';

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

  describe('Init extensions', () => {
    const jestFn = jest.fn((extensionName: string) => extensionName);

    beforeEach(() => {
      jestFn.mockRestore();
    });

    interface MyInterface {
      one: string;
      two: number;
    }
    const MY_EXTENSIONS = new InjectionToken<Extension<MyInterface>[]>('MY_EXTENSIONS');

    @Injectable()
    class Extension1 implements Extension {
      async init() {
        jestFn('Extension1');
      }
    }

    @Injectable()
    class Extension2 implements Extension {
      async init() {
        jestFn('Extension2');
      }
    }

    it('non-root module should inited only Extension2', async () => {
      @RootModule({
        providersPerApp: [{ provide: MY_EXTENSIONS, useClass: Extension1, multi: true }],
        providersPerMod: [{ provide: MY_EXTENSIONS, useClass: Extension2, multi: true }],
        extensions: [MY_EXTENSIONS],
      })
      class Module1 {}

      const loggerConfig = new LoggerConfig();
      const level: keyof Logger = 'info';
      loggerConfig.level = level;
      loggerConfig.depth = 3;

      @RootModule({
        imports: [Module1],
        providersPerApp: [
          { provide: Router, useClass: DefaultRouter },
          { provide: LoggerConfig, useValue: loggerConfig },
        ],
      })
      class AppModule {}

      class MockApplication extends Application {
        async init(appModule: ModuleType) {
          return super.init(appModule);
        }
      }
      const promise = new MockApplication().init(AppModule);
      await expect(promise).resolves.not.toThrow();
      expect(jestFn.mock.calls).toEqual([['Extension2']]);
    });

    it('root module should inited only extension from providersPerMod', async () => {
      const loggerConfig = new LoggerConfig();
      const level: keyof Logger = 'info';
      loggerConfig.level = level;
      loggerConfig.depth = 3;

      @RootModule({
        providersPerApp: [
          { provide: Router, useClass: DefaultRouter },
          { provide: LoggerConfig, useValue: loggerConfig },
          { provide: MY_EXTENSIONS, useClass: Extension1, multi: true },
        ],
        providersPerMod: [{ provide: MY_EXTENSIONS, useClass: Extension2, multi: true }],
        extensions: [MY_EXTENSIONS],
      })
      class AppModule {}

      class MockApplication extends Application {
        async init(appModule: ModuleType) {
          return super.init(appModule);
        }
      }
      const promise = new MockApplication().init(AppModule);
      await expect(promise).resolves.not.toThrow();
      expect(jestFn.mock.calls).toEqual([['Extension2']]);
    });

    it('root module should found extension in providersPerApp', async () => {
      const loggerConfig = new LoggerConfig();
      const level: keyof Logger = 'info';
      loggerConfig.level = level;
      loggerConfig.depth = 3;

      @RootModule({
        providersPerApp: [
          { provide: Router, useClass: DefaultRouter },
          { provide: LoggerConfig, useValue: loggerConfig },
          { provide: MY_EXTENSIONS, useClass: Extension1, multi: true },
        ],
        extensions: [MY_EXTENSIONS],
      })
      class AppModule {}

      class MockApplication extends Application {
        async init(appModule: ModuleType) {
          return super.init(appModule);
        }
      }
      const promise = new MockApplication().init(AppModule);
      await expect(promise).resolves.not.toThrow();
      expect(jestFn.mock.calls).toEqual([['Extension1']]);
    });
  });
});
