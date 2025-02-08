import request from 'supertest';
import { HttpServer } from '@ditsmod/routing';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';

describe('02-controller-error-handler', () => {
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
    const { status, text } = await testAgent.get('/hello');
    expect(status).toBe(200);
    expect(text).toBe('Hello, World!');
  });

  it('should throw an error', async () => {
    const { status } = await testAgent.get('/throw-error');
    expect(status).toBe(500);
  });

  it('should works', async () => {
    const { status, text } = await testAgent.get('/hello2');
    expect(status).toBe(200);
    expect(text).toBe('Hello, World2!');
  });

  it('should throw an error', async () => {
    const { status } = await testAgent.get('/throw-error2');
    expect(status).toBe(500);
  });
});
