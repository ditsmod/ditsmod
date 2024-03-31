import request from 'supertest';
import { NodeServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';

describe('02-controller-error-handler', () => {
  let server: NodeServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await new TestApplication(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server.close();
  });

  it('should works', async () => {
    await testAgent.get('/').expect(200).expect('ok');
  });

  it('should throw an error', async () => {
    await testAgent.get('/throw-error').expect(500);
  });
});
