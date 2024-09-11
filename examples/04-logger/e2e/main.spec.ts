import request from 'supertest';
import { NodeServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';

describe('04-logger', () => {
  let server: NodeServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await new TestApplication(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  it('should works', async () => {
    const { status, text, type } = await testAgent.get('/');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('ok');
  });

  it('should works with winston', async () => {
    const { status } = await testAgent.get('/winston');
    expect(status).toBe(200);
  });

  it('should works with bunyan', async () => {
    const { status } = await testAgent.get('/bunyan');
    expect(status).toBe(200);
  });

  it('should works with pino', async () => {
    const { status } = await testAgent.get('/pino');
    expect(status).toBe(200);
  });
});
