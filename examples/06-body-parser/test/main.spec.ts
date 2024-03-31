import request from 'supertest';
import { TestApplication } from '@ditsmod/testing';
import { NodeServer } from '@ditsmod/core';

import { AppModule } from '#app/app.module.js';

describe('06-body-parser', () => {
  let server: NodeServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await new TestApplication(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server.close();
  });

  it('should works with get', async () => {
    await testAgent
      .get('/')
      .expect(200)
      .expect('Hello, you need send POST request');
  });

  it('should parsed post', async () => {
    await testAgent
      .post('/')
      .send({ one: 1 })
      .expect(200)
      .expect({ one: 1 });
  });

  it('controller singleton should works with get', async () => {
    await testAgent
      .get('/singleton')
      .expect(200)
      .expect('Hello, you need send POST request');
  });

  it('controller singleton should parsed post', async () => {
    await testAgent
      .post('/singleton')
      .send({ one: 1 })
      .expect(200)
      .expect({ one: 1 });
  });
});
