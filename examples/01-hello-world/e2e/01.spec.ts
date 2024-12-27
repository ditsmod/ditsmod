import request from 'supertest';
import { HttpServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';

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
      const { status, type, text } = await testAgent.get('/injector-scoped');
      expect(status).toBe(200);
      expect(type).toBe('text/plain');
      expect(text).toBe('ok1');
    });
  });

  describe('context-scoped controller', () => {
    it('works with GET method', async () => {
      const { status, type, text } = await testAgent.get('/context-scoped');
      expect(status).toBe(200);
      expect(type).toBe('text/plain');
      expect(text).toBe('ok2');
    });
  });
});
