import request = require('supertest');
import { HttpErrorHandler, NodeServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';
import { jest } from '@jest/globals';

import { AppModule } from '#app/app.module.js';
import { CustomHttpErrorHandler } from './custom-controller-error-handler.js';
import { ErrorContainer } from './error-container.js';

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
            token: HttpErrorHandler,
            useClass: CustomHttpErrorHandler,
            providers: [{ token: ErrorContainer, useValue: errorContainer }],
          },
        ])
        .getServer();
    });

    afterEach(() => {
      server.close();
    });

    it('should start from "Controller1.method1"', async () => {
      await request(server).get('/fail1').expect(500);
      const errMsg = 'No provider for non-existing-token!; this error during calling Controller1.prototype.method1!';
      const traceRegExp = /^Error: No provider for non-existing-token![^\n]+\n\s+at Controller1./;
      const errStack = expect.stringMatching(traceRegExp);
      expect(setError).toHaveBeenCalledWith(errMsg, errStack);
      expect(setError).toHaveBeenCalledTimes(1);
    });
  });
});
