import request = require('supertest');
import { NodeServer, Providers } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '../src/app/app.module';

describe('02-controller-error-handler', () => {
  let server: NodeServer;

  beforeAll(async () => {
    // The controller method is expected to throw an error, so we force the log level to "fatal"
    // to avoid outputting an error to the console.
    server = await new TestApplication(AppModule).getServer();
  });

  afterAll(() => {
    server.close();
  });

  it('should works', async () => {
    await request(server).get('/').expect(200).expect('ok');
  });

  it('should throw an error', async () => {
    await request(server).get('/throw-error').expect(500);
  });
});
