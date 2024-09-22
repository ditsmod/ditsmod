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
    const { type, status, text } = await testAgent.get('/hello');
    expect(type).toBe('text/plain');
    expect(status).toBe(200);
    expect(text).toBe('Hello, World!');
  });

  it('controller handles HEAD method', async () => {
    const { type, status, text, headers } = await testAgent.head('/hello');
    expect(type).toBe('text/plain');
    expect(status).toBe(200);
    expect(text).toBeUndefined();
    expect(headers).toMatchObject({
      'content-type': 'text/plain; charset=utf-8',
      'content-length': '13',
    });
  });

  it('controller as singleton works', async () => {
    const { type, status, text } = await testAgent.get('/hello2');
    expect(type).toBe('text/plain');
    expect(status).toBe(200);
    expect(text).toBe('Hello, World!');
  });
});
