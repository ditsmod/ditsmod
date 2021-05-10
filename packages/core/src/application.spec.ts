import 'reflect-metadata';
import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';
import { Injectable, InjectionToken } from '@ts-stack/di';

import { Application } from './application';
import { RootModule } from './decorators/root-module';
import { RootMetadata } from './models/root-metadata';
import { ModuleType, Extension } from './types/mix';
import { Router } from './types/router';

describe('Application', () => {
  class MockApplication extends Application {
    meta = new RootMetadata();

    async init(appModule: ModuleType) {
      return super.init(appModule);
    }

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

    it('declared extensions in root module and only in providersPerApp', async () => {
      @RootModule({
        providersPerApp: [
          { provide: Router, useValue: 'fake value for router' },
          { provide: MY_EXTENSIONS, useClass: Extension1, multi: true },
        ],
        extensions: [MY_EXTENSIONS],
      })
      class AppModule {}

      const promise = new MockApplication().init(AppModule);
      await expect(promise).resolves.not.toThrow();
      expect(jestFn.mock.calls).toEqual([['Extension1']]);
    });

    it('should throw an error about include MY_EXTENSIONS to providersPerApp', async () => {
      @RootModule({ extensions: [MY_EXTENSIONS] })
      class AppModule {}

      const promise = new MockApplication().init(AppModule);
      await expect(promise).rejects.toThrow(/MY_EXTENSIONS" must be includes in "providersPerApp"/);
    });

    it('should throw an error about include MY_EXTENSIONS to providersPerReq', async () => {
      @RootModule({
        providersPerApp: [{ provide: MY_EXTENSIONS, useClass: Extension1, multi: true }],
        providersPerReq: [{ provide: MY_EXTENSIONS, useClass: Extension1, multi: true }],
        extensions: [MY_EXTENSIONS],
      })
      class AppModule {}

      const promise = new MockApplication().init(AppModule);
      await expect(promise).rejects.toThrow(/MY_EXTENSIONS" can be includes in the "providersPerApp"/);
    });

    it('should throw an error about include MY_EXTENSIONS to providersPerMod', async () => {
      @RootModule({
        providersPerApp: [{ provide: MY_EXTENSIONS, useClass: Extension1, multi: true }],
        providersPerMod: [{ provide: MY_EXTENSIONS, useClass: Extension1, multi: true }],
        extensions: [MY_EXTENSIONS],
      })
      class AppModule {}

      const promise = new MockApplication().init(AppModule);
      await expect(promise).rejects.toThrow(/MY_EXTENSIONS" can be includes in the "providersPerApp"/);
    });
  });
});
