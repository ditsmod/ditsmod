import request from 'supertest';
import { NodeServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';

describe('08-http-interceptors', () => {
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
      .get('/')
      .expect(200)
      .expect({ originalMsg: 'Original message!', msg: 'message that attached by interceptor' });
  });

  it('singleton controller works', async () => {
    await testAgent
      .get('/singleton')
      .expect(200)
      .expect({ originalMsg: 'Original message!', msg: 'message that attached by interceptor' });
  });
});
