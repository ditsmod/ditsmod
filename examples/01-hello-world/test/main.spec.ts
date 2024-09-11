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
    const { status, text, type } = await testAgent.get('/hello');
    expect(type).toBe('text/plain');
    expect(status).toBe(200);
    expect(text).toBe('Hello, World!');
  });

  it('controller as singleton works', async () => {
    const { status, text, type } = await testAgent.get('/hello2');
    expect(type).toBe('text/plain');
    expect(status).toBe(200);
    expect(text).toBe('Hello, World!');
  });
});
