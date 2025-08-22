import request from 'supertest';
import { HttpServer } from '@ditsmod/rest';
import { TestApplication } from '@ditsmod/testing';

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

  describe('injector-scoped controller', () => {
    it('works with GET method', async () => {
      const { status, text } = await testAgent.get('/injector-scoped');
      expect(status).toBe(200);
      expect(text).toBe('ok1');
    });
  });

  describe('context-scoped controller', () => {
    it('works with GET method', async () => {
      const { status, text } = await testAgent.get('/context-scoped');
      expect(status).toBe(200);
      expect(text).toBe('ok2');
    });
  });
});
