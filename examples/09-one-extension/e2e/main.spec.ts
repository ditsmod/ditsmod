import request from 'supertest';
import { HttpServer } from '@ditsmod/rest';
import { TestRestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';

describe('09-one-extension', () => {
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await TestRestApplication.createTestApp(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  it('controller works', async () => {
    const { status, text } = await testAgent.get('/');
    expect(status).toBe(200);
    expect(text).toBe('Hello, World!\n');
  });
});
