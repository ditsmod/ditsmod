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

  it('serves main page for OpenAPI docs', async () => {
    await testAgent
      .get('/openapi')
      .expect(200)
      .responseType('text/html');
  });

  it('serves route with JSON response for OpenAPI docs', async () => {
    const { status, type, headers } = await testAgent.get('/openapi.json');
    expect(status).toBe(200);
    expect(type).toBe('application/json');
    expect(Number(headers?.['content-length'])).toBeGreaterThan(0);
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
