import { ModuleType, AppOptions, rootModule, Router } from '@ditsmod/core';
import { Server } from 'node:http';

import { TestApplication } from './test-application.js';
import { TestModuleManager } from './test-module-manager.js';
import { PreTestApplication } from './pre-test-application.js';

describe('TestApplication', () => {
  class PreTestApplicationMock extends PreTestApplication {
    declare appOptions: AppOptions;
  }

  class TestApplicationMock extends TestApplication {
    declare preTestApplication: PreTestApplicationMock;
    declare testModuleManager: TestModuleManager;

    override initAndScanRootModule(appModule: ModuleType, appOptions: AppOptions) {
      return super.initAndScanRootModule(appModule, appOptions);
    }
  }

  const path = 'some-prefix';
  class Service1 {}

  @rootModule({
    providersPerApp: [Service1, { token: Router, useValue: {} }],
  })
  class RootModule1 {}

  describe('constructor()', () => {
    it('not throw an error', () => {
      expect(() => new TestApplicationMock(RootModule1, { path })).not.toThrow();
    });

    it('TestModuleManager is inited', () => {
      const mock = new TestApplicationMock(RootModule1, { path });
      expect(mock.testModuleManager).toBeInstanceOf(TestModuleManager);
    });

    it('TestModuleManager has metadata of the root module', () => {
      const mock = new TestApplicationMock(RootModule1, { path });
      const meta = mock.testModuleManager.getMetadata(RootModule1);
      expect(meta?.providersPerApp[0]).toBe(Service1);
      expect(mock.preTestApplication.appOptions.path).toBe(path);
    });
  });

  describe('getServer()', () => {
    it('not to throw an error', async () => {
      const mock = new TestApplicationMock(RootModule1, { path });
      await expect(mock.getServer()).resolves.not.toThrow();
    });

    it('returns instance of http.Server', async () => {
      const mock = new TestApplicationMock(RootModule1, { path });
      const server = await mock.getServer();
      expect(server).toBeInstanceOf(Server);
    });
  });

  describe('setLogLevel()', () => {
    it('not to throw an error', () => {
      const mock = new TestApplicationMock(RootModule1, { path });
      expect(() => mock.setLogLevel('all')).not.toThrow();
    });
  });
});
