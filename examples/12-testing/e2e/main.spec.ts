import request from 'supertest';
import { HttpServer } from '@ditsmod/rest';
import { HttpErrorHandler } from '@ditsmod/rest';
import { TestApplication } from '@ditsmod/testing';
import { InstantiationError, NoProvider } from '@ditsmod/core/errors';
import { jest } from '@jest/globals';

import { AppModule } from '#app/app.module.js';
import { CustomHttpErrorHandler } from './custom-controller-error-handler.js';
import { ErrorContainer } from './error-container.js';

describe('12-testing', () => {
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;

  it('controller works case 1', async () => {
    const server = await TestApplication.createTestApp(AppModule).getServer();
    testAgent = request(server);

    const { status, text } = await testAgent.get('/');
    expect(status).toBe(200);
    expect(text).toBe('Hello, World!\n');
    server?.close();
  });

  it('controller works case 2', async () => {
    const server = await TestApplication.createTestApp(AppModule).getServer();
    testAgent = request(server);

    const { status, text } = await testAgent.get('/admin');
    expect(status).toBe(200);
    expect(text).toBe('Hello, admin!\n');
    server?.close();
  });

  describe('good error stack trace', () => {
    const setError = jest.fn();
    const errorContainer = { setError } as ErrorContainer;
    let server: HttpServer;

    beforeAll(async () => {
      server = await TestApplication.createTestApp(AppModule)
        .addProvidersToModule(AppModule, [{ token: ErrorContainer, useValue: errorContainer }])
        .overrideModuleMeta([
          {
            token: HttpErrorHandler,
            useClass: CustomHttpErrorHandler,
          },
        ])
        .getServer();
    });

    afterEach(() => {
      server?.close();
    });

    it('should start from "Controller1.method1"', async () => {
      const { status } = await request(server).get('/fail1');
      expect(status).toBe(500);
      const cause = new NoProvider(['non-existing-token']);
      const err = new InstantiationError(cause, ['Controller1.prototype.method1']);
      expect(setError).toHaveBeenCalledWith(err);
      expect(setError).toHaveBeenCalledTimes(1);
    });
  });
});
