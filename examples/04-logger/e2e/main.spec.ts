import request from 'supertest';
import { HttpServer } from '@ditsmod/rest';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';

describe('04-logger', () => {
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await TestApplication.createTestApp(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  it('should works', async () => {
    const { status, text } = await testAgent.get('/');
    expect(status).toBe(200);
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
