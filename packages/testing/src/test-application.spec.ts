import { AppOptions, ModuleType, rootModule, Router } from '@ditsmod/core';
import { Server } from 'node:http';

import { TestApplication } from './test-application.js';
import { TestModuleManager } from './test-module-manager.js';

describe('TestApplication', () => {
  class TestApplicationMock extends TestApplication {
    declare preTestApplication: TestApplicationMock;
    declare testModuleManager: TestModuleManager;
    declare appOptions: AppOptions;
    static override async create(appModule: ModuleType, appOptions?: AppOptions) {
      return super.createTestApp(appModule, appOptions) as unknown as TestApplicationMock;
    }
  }

  const path = 'some-prefix';
  class Service1 {}

  @rootModule({
    providersPerApp: [Service1, { token: Router, useValue: {} }],
  })
  class RootModule1 {}

  describe('create()', () => {
    it('not throw an error', async () => {
      await expect(TestApplicationMock.create(RootModule1, { path })).resolves.not.toThrow();
    });

    it('TestModuleManager is inited', async () => {
      const mock = await TestApplicationMock.create(RootModule1, { path });
      expect(mock.testModuleManager).toBeInstanceOf(TestModuleManager);
    });

    it('TestModuleManager has metadata of the root module', async () => {
      const mock = await TestApplicationMock.create(RootModule1, { path });
      const meta = mock.testModuleManager.getMetadata(RootModule1);
      expect(meta?.providersPerApp[0]).toBe(Service1);
      expect(mock.appOptions.path).toBe(path);
    });
  });

  describe('getServer()', () => {
    it('not to throw an error', async () => {
      const mock = await TestApplicationMock.create(RootModule1, { path });
      await expect(mock.getServer()).resolves.not.toThrow();
    });

    it('returns instance of http.Server', async () => {
      const mock = await TestApplicationMock.create(RootModule1, { path });
      const server = await mock.getServer();
      expect(server).toBeInstanceOf(Server);
    });
  });
});
