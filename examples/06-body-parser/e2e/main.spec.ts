import request from 'supertest';
import { TestRestApplication } from '@ditsmod/rest-testing';
import { ProviderBuilder, HttpStatus } from '@ditsmod/core';
import type { HttpServer } from '@ditsmod/rest';
import { BodyParserConfig } from '@ditsmod/body-parser';

import { AppModule } from '#app/app.module.js';

describe('06-body-parser', () => {
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    const providers = new ProviderBuilder().useValue<BodyParserConfig>(BodyParserConfig, { jsonOptions: { limit: '9b' } });

    server = await TestRestApplication.createTestApp(AppModule)
      .overrideModuleMeta([...providers])
      .getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  it('should works with get', async () => {
    const { status, text } = await testAgent.get('/');
    expect(status).toBe(200);
    expect(text).toBe('Hello, you need send POST request');
  });

  it('should parsed post', async () => {
    const { status, body, type } = await testAgent.post('/').set('Content-Type', 'application/json').send({ one: 1 });
    expect(status).toBe(200);
    expect(type).toBe('application/json');
    expect(body).toEqual({ one: 1 });
  });

  it('should parsed post', async () => {
    const { status } = await testAgent.post('/').set('Content-Type', 'application/json').send({ one: 1, two: 2 });
    expect(status).toBe(HttpStatus.PAYLOAD_TO_LARGE);
  });

  it('should not parse fake-content-type', async () => {
    const { status, body, type } = await testAgent
      .post('/')
      .set('Content-Type', 'fake-content-type')
      .send('{ one: 1 }');
    expect(status).toBe(200);
    expect(type).toBe('application/json');
    expect(body).toEqual({});
  });

  it('controller route-scoped should works with get', async () => {
    const { status, text } = await testAgent.get('/route-scoped');
    expect(status).toBe(200);
    expect(text).toBe('Hello, you need send POST request');
  });

  it('controller route-scoped should parsed post', async () => {
    const { status, body, type } = await testAgent
      .post('/route-scoped')
      .set('Content-Type', 'application/json')
      .send({ one: 1 });
    expect(status).toBe(200);
    expect(type).toBe('application/json');
    expect(body).toEqual({ one: 1 });
  });

  it('controller route-scoped should parsed post', async () => {
    const { status } = await testAgent
      .post('/route-scoped')
      .set('Content-Type', 'application/json')
      .send({ one: 1, two: 2 });
    expect(status).toBe(HttpStatus.PAYLOAD_TO_LARGE);
  });

  it('controller route-scoped should not parse fake-content-type', async () => {
    const { status, body, type } = await testAgent
      .post('/route-scoped')
      .set('Content-Type', 'fake-content-type')
      .send('{ one: 1 }');
    expect(status).toBe(200);
    expect(type).toBe('application/json');
    expect(body).toEqual({});
  });
});
