import request from 'supertest';
import { NodeServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';

describe('04-logger', () => {
  let server: NodeServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await new TestApplication(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  it('should works', async () => {
    await testAgent.get('/').expect(200).expect('ok');
  });

  it('should works with winston', async () => {
    await testAgent.get('/winston').expect(200);
  });

  it('should works with bunyan', async () => {
    await testAgent.get('/bunyan').expect(200);
  });

  it('should works with pino', async () => {
    await testAgent.get('/pino').expect(200);
  });
});
