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
    const { status, text, type } = await testAgent.get('/');
    expect(type).toBe('text/plain');
    expect(status).toBe(200);
    expect(text).toBe('ok');
  });

  it('should throw an error', async () => {
    const { status } = await testAgent.get('/throw-error');
    expect(status).toBe(500);
  });
});
