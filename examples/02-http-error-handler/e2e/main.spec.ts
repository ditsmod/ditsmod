import request from 'supertest';
import { NodeServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';

describe('02-controller-error-handler', () => {
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
    const { type, status, text } = await testAgent.get('/hello');
    expect(type).toBe('text/plain');
    expect(status).toBe(200);
    expect(text).toBe('Hello, World!');
  });

  it('should throw an error', async () => {
    const { status } = await testAgent.get('/throw-error');
    expect(status).toBe(500);
  });

  it('should works', async () => {
    const { type, status, text } = await testAgent.get('/hello2');
    expect(type).toBe('text/plain');
    expect(status).toBe(200);
    expect(text).toBe('Hello, World2!');
  });

  it('should throw an error', async () => {
    const { status } = await testAgent.get('/throw-error2');
    expect(status).toBe(500);
  });
});
