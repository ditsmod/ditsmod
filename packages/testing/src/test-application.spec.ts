import { AppOptions, ModuleType, rootModule } from '@ditsmod/core';
import { Router } from '@ditsmod/routing';
import { Server } from 'node:http';
import { describe, expect, it } from 'vitest';

import { TestApplication } from './test-application.js';

describe('TestApplication', () => {
  class TestApplicationMock extends TestApplication {
    declare preTestApplication: TestApplicationMock;
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
      await expect(TestApplicationMock.create(RootModule1)).resolves.not.toThrow();
    });
  });

  describe('getServer()', () => {
    it('not to throw an error', async () => {
      const mock = await TestApplicationMock.create(RootModule1);
      await expect(mock.getServer()).resolves.not.toThrow();
    });

    it('returns instance of http.Server', async () => {
      const mock = await TestApplicationMock.create(RootModule1);
      const server = await mock.getServer();
      expect(server).toBeInstanceOf(Server);
    });
  });
});
