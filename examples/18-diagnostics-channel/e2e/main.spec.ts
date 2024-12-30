import request from 'supertest';
import { HttpServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';

import { AppModule } from '#app/app.module.js';

describe('01-hello-world', () => {
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await TestApplication.createTestApp(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  it('controller works with GET method', async () => {
    const { type, status, text } = await testAgent.get('/default-controller');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('Hello, World!');
  });

  it('controller handles HEAD method', async () => {
    const { type, status, text, headers } = await testAgent.head('/default-controller');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBeUndefined();
    expect(headers).toMatchObject({
      'content-type': 'text/plain; charset=utf-8',
      'content-length': '13',
    });
  });

  it('controller as context-scoped works', async () => {
    const { type, status, text } = await testAgent.get('/context-scoped-controller');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('Hello, World!');
  });

  it('method name as symbol with GET method', async () => {
    const { type, status, text } = await testAgent.get('/method-name-as-symbol');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('Hello, World!');
  });

  it('method name as symbol with POST method', async () => {
    const { type, status, text } = await testAgent.post('/method-name-as-symbol');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('Hello, World!');
  });
});
