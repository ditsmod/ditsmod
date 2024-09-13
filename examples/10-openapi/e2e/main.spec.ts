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
    const { type, status, text } = await testAgent.get('/');
    expect(type).toBe('text/plain');
    expect(status).toBe(200);
    expect(text).toBe('Hello World!\n');
  });

  it('serves main page for OpenAPI docs', async () => {
    const { status, type } = await testAgent.get('/openapi');
    expect(type).toBe('text/html');
    expect(status).toBe(200);
  });

  it('serves route with JSON response for OpenAPI docs', async () => {
    const { status, type, headers } = await testAgent.get('/openapi.json');
    expect(status).toBe(200);
    expect(type).toBe('application/json');
    expect(Number(headers?.['content-length'])).toBeGreaterThan(0);
  });

  it('serves route with YAML response for OpenAPI docs', async () => {
    const { status, type, headers } = await testAgent.get('/openapi.yaml');
    expect(status).toBe(200);
    expect(type).toBe('text/yaml');
    expect(Number(headers?.['content-length'])).toBeGreaterThan(0);
  });

  it('controller works', async () => {
    const { status, body, type } = await testAgent.get('/resource/123');
    expect(status).toBe(200);
    expect(type).toBe('application/json');
    expect(body).toEqual({ resourceId: '123', body: 'some body for resourceId 123' });
  });

  it('guard works', async () => {
    const { status } = await testAgent.get('/second');
    expect(status).toBe(401);
  });
});
