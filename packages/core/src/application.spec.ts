import 'reflect-metadata';
import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';
import { Inject, Injectable, InjectionToken } from '@ts-stack/di';

import { Application } from './application';
import { RootModule } from './decorators/root-module';
import { RootMetadata } from './models/root-metadata';
import { ModuleType, Extension } from './types/mix';
import { Router } from './types/router';
import { Log, LogItem } from './services/log';
import { Logger } from './types/logger';
import { LOG_BUFFER } from './constans';

describe('Application', () => {
  class MockApplication extends Application {
    override meta = new RootMetadata();
    override log: Log;

    override async createTemporaryLogger(appModule: ModuleType) {
      return super.createTemporaryLogger(appModule);
    }

    override async init(appModule: ModuleType) {
      return super.init(appModule);
    }

    override checkSecureServerOption(appModule: ModuleType) {
      return super.checkSecureServerOption(appModule);
    }
  }

  let mock: MockApplication;

  beforeEach(() => {
    mock = new MockApplication();
  });

  describe('createTemporaryLogger()', () => {
    it('log should be undefined', () => {
      expect(mock.log).toBeUndefined();
    });

    it('log should be instance of Log', () => {
      @RootModule()
      class AppModule {}
      mock.createTemporaryLogger(AppModule);
      expect(mock.log).toBeInstanceOf(Log);
    });

    it('log should be instance of LogMock', () => {
      class LogMock extends Log {}

      @RootModule({
        providersPerApp: [{ provide: Log, useClass: LogMock }],
      })
      class AppModule {}
      mock.createTemporaryLogger(AppModule);
      expect(mock.log).toBeInstanceOf(LogMock);
    });
  });

  describe('init()', () => {
    const constructor = jest.fn();
    const flush = jest.fn();

    beforeEach(() => {
      flush.mockRestore();
    });

    it('log should be instance of Log and log.buffer should be empty', async () => {
      @RootModule({
        providersPerApp: [{ provide: Router, useValue: 'fake value for router' }]
      })
      class AppModule {}

      const promise = mock.init(AppModule);
      await expect(promise).resolves.not.toThrow();
      expect(mock.log).toBeInstanceOf(Log);
      expect(mock.log.bufferLogs).toBe(true);
    });

    it('log should be instance of LogMock and log.buffer should be empty', async () => {
      @Injectable()
      class LogMock extends Log {
        constructor(logger: Logger, @Inject(LOG_BUFFER) public override buffer: LogItem[]) {
          super(logger, buffer);
          constructor();
        }

        override flush() {
          super.flush();
          flush();
        }
      }

      @RootModule({
        providersPerApp: [
          { provide: Router, useValue: 'fake value for router' },
          { provide: Log, useClass: LogMock }
        ]
      })
      class AppModule {}
      expect(flush.mock.calls.length).toBe(0);
      const promise = mock.init(AppModule);
      await expect(promise).resolves.not.toThrow();
      expect(mock.log).toBeInstanceOf(LogMock);
      expect(constructor.mock.calls.length).toBe(3);
      expect(flush.mock.calls.length).toBe(0);
      expect(mock.log.bufferLogs).toBe(true);
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

    it('declared extensions in root module and only in providersPerApp', async () => {
      @RootModule({
        providersPerApp: [
          { provide: Router, useValue: 'fake value for router' },
          { provide: MY_EXTENSIONS, useClass: Extension1, multi: true },
        ],
        extensions: [MY_EXTENSIONS],
      })
      class AppModule {}

      const promise = mock.init(AppModule);
      await expect(promise).resolves.not.toThrow();
      expect(jestFn.mock.calls).toEqual([['Extension1']]);
    });

    it('should throw an error about include MY_EXTENSIONS to providersPerApp', async () => {
      @RootModule({ extensions: [MY_EXTENSIONS] })
      class AppModule {}

      const promise = mock.init(AppModule);
      await expect(promise).rejects.toThrow(/MY_EXTENSIONS" must be includes in "providersPerApp"/);
    });

    it('should throw an error about include MY_EXTENSIONS to providersPerReq', async () => {
      @RootModule({
        providersPerApp: [{ provide: MY_EXTENSIONS, useClass: Extension1, multi: true }],
        providersPerReq: [{ provide: MY_EXTENSIONS, useClass: Extension1, multi: true }],
        extensions: [MY_EXTENSIONS],
      })
      class AppModule {}

      const promise = mock.init(AppModule);
      await expect(promise).rejects.toThrow(/MY_EXTENSIONS" can be includes in the "providersPerApp"/);
    });

    it('should throw an error about include MY_EXTENSIONS to providersPerMod', async () => {
      @RootModule({
        providersPerApp: [{ provide: MY_EXTENSIONS, useClass: Extension1, multi: true }],
        providersPerMod: [{ provide: MY_EXTENSIONS, useClass: Extension1, multi: true }],
        extensions: [MY_EXTENSIONS],
      })
      class AppModule {}

      const promise = mock.init(AppModule);
      await expect(promise).rejects.toThrow(/MY_EXTENSIONS" can be includes in the "providersPerApp"/);
    });
  });
});
