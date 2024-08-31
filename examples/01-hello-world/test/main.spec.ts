import request from 'supertest';
import { NodeServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';

describe('01-hello-world', () => {
  let server: NodeServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await new TestApplication(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  it('controller works', async () => {
    await testAgent
      .get('/hello')
      .expect(200)
      .expect('Hello, World!');
  });

  it('controller as singleton works', async () => {
    await testAgent
      .get('/hello2')
      .expect(200)
      .expect('Hello, World!');
  });
});
