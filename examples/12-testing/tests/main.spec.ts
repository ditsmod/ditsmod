import request = require('supertest');
import { ControllerErrorHandler, LoggerConfig, NodeServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '../src/app/app.module';
import { CustomControllerErrorHandler } from './custom-controller-error-handler';
import { ErrorContainer } from './error-container';

describe('12-testing', () => {
  it('controller works', async () => {
    const server = await new TestApplication(AppModule).getServer();
    await request(server).get('/').expect(200).expect('Hello, World!\n');
    await request(server).get('/admin').expect(200).expect('Hello, admin!\n');
    server.close();
  });

  describe('good error stack trace', () => {
    const setError = jest.fn();
    const errorContainer = { setError } as ErrorContainer;
    let server: NodeServer;

    beforeAll(async () => {
      server = await new TestApplication(AppModule)
        .overrideProviders([
          {
            token: ControllerErrorHandler,
            useClass: CustomControllerErrorHandler,
            providers: [{ token: ErrorContainer, useValue: errorContainer }],
          },
        ])
        .setProvidersPerApp([{ token: LoggerConfig, useValue: { level: 'fatal' } }])
        .getServer();
    });

    afterEach(() => {
      server.close();
    });

    it('should start from "Controller1.method1"', async () => {
      await request(server).get('/fail1').expect(500);
      const errMsg = 'No provider for non-existing-token!; this error during calling Controller1.prototype.method1!';
      const traceRegExp = /^Error: No provider for non-existing-token![^\n]+\n\s+at Controller1.method1 /;
      const errStack = expect.stringMatching(traceRegExp);
      expect(setError).toBeCalledWith(errMsg, errStack);
      expect(setError).toBeCalledTimes(1);
    });
  });
});
