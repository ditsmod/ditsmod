import request from 'supertest';
import { NodeServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';


describe('10-openapi', () => {
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
      .expect('Hello World!\n');
  });

  it('controller works', async () => {
    await testAgent
      .get('/resource/123')
      .expect(200)
      .expect({ resourceId: '123', body: 'some body for resourceId 123' });
  });

  it('guard works', async () => {
    await testAgent
      .get('/second')
      .expect(401);
  });
});
