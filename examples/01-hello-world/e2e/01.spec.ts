import request from 'supertest';
import type { HttpServer } from '@ditsmod/rest';
import { TestRestApplication } from '@ditsmod/rest-testing';

import { AppModule } from '#app/app.module.js';

describe('01-hello-world', () => {
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await TestRestApplication.createTestApp(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  describe('request-scoped controller', () => {
    it('works with GET method', async () => {
      const { status, text } = await testAgent.get('/request-scoped');
      expect(status).toBe(200);
      expect(text).toBe('ok1');
    });
  });

  describe('route-scoped controller', () => {
    it('works with GET method', async () => {
      const { status, text } = await testAgent.get('/route-scoped');
      expect(status).toBe(200);
      expect(text).toBe('ok2');
    });
  });
});
