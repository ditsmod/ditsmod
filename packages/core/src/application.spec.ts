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
import { ModuleType } from './types/mix';
import { Extension } from './types/extension';
import { Router } from './types/router';
import { Module } from './decorators/module';

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
    class Extension1 implements Extension<any> {
      #inited: boolean;

      async init() {
        if (this.#inited) {
          return;
        }
        jestFn('Extension1');
        this.#inited = true;
      }
    }

    @Injectable()
    class Extension2 implements Extension<any> {
      #inited: boolean;

      async init() {
        if (this.#inited) {
          return;
        }
        jestFn('Extension2');
        this.#inited = true;
      }
    }

    @Injectable()
    class Extension3 implements Extension<any> {
      #inited: boolean;

      async init() {
        if (this.#inited) {
          return;
        }
        jestFn('Extension3');
        this.#inited = true;
      }
    }

    @Injectable()
    class Extension4 implements Extension<any> {
      #inited: boolean;

      async init() {
        if (this.#inited) {
          return;
        }
        jestFn('Extension4');
        this.#inited = true;
      }
    }

    @Injectable()
    class Extension5 implements Extension<any> {
      #inited: boolean;

      async init() {
        if (this.#inited) {
          return;
        }
        jestFn('Extension5');
        this.#inited = true;
      }
    }

    it('mix declared extensions in two modules and in providersPerMod and providersPerApp', async () => {
      const MY_EXTENSIONS2 = new InjectionToken<Extension<void>[]>('MY_EXTENSIONS2');
      const loggerConfig = new LoggerConfig();
      const level: keyof Logger = 'info';
      loggerConfig.level = level;
      loggerConfig.depth = 3;

      @Module({
        providersPerApp: [
          { provide: MY_EXTENSIONS, useClass: Extension1, multi: true },
          { provide: MY_EXTENSIONS2, useClass: Extension3, multi: true },
        ],
        providersPerMod: [{ provide: MY_EXTENSIONS, useClass: Extension2, multi: true }],
        extensions: [MY_EXTENSIONS, MY_EXTENSIONS2],
      })
      class Module1 {}

      @RootModule({
        imports: [Module1],
        providersPerApp: [
          { provide: Router, useClass: DefaultRouter },
          { provide: LoggerConfig, useValue: loggerConfig },
          { provide: MY_EXTENSIONS2, useClass: Extension4, multi: true },
          { provide: MY_EXTENSIONS2, useClass: Extension5, multi: true },
        ],
        extensions: [MY_EXTENSIONS2],
      })
      class AppModule {}

      class MockApplication extends Application {
        async init(appModule: ModuleType) {
          return super.init(appModule);
        }
      }
      const promise = new MockApplication().init(AppModule);
      await expect(promise).resolves.not.toThrow();
      expect(jestFn.mock.calls).toEqual([['Extension2'], ['Extension3'], ['Extension4'], ['Extension5']]);
    });

    it('mix declared extensions in root module and in providersPerMod and providersPerApp', async () => {
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

    it('declared extensions in root module and only in providersPerApp', async () => {
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
