import request from 'supertest';
import { TestApplication } from '@ditsmod/testing';
import { HttpServer } from '@ditsmod/routing';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';

import { AppModule } from '#app/app.module.js';

describe('19-session-cookie', () => {
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await TestApplication.createTestApp(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  describe('non-context-scoped', () => {
    it('should set cookie', async () => {
      const { status, headers, text } = await testAgent.get('/set');
      expect(status).toBe(200);
      expect(headers['set-cookie'][0]).toMatch(/custom-session-name=123/);
      expect(text).toBe('Hello, World!\n');
    });

    it('should read cookie', async () => {
      const { status, text } = await testAgent.get('/get').set('cookie', 'custom-session-name=123');
      expect(status).toBe(200);
      expect(text).toBe('session ID: 123');
    });
  });

  describe('context-scoped', () => {
    it('should set cookie', async () => {
      const { status, headers, text } = await testAgent.get('/set2');
      expect(status).toBe(200);
      expect(headers['set-cookie'][0]).toMatch(/custom-session-name=123/);
      expect(text).toBe('Hello, World!\n');
    });

    it('should read cookie', async () => {
      const { status, text } = await testAgent.get('/get2').set('cookie', 'custom-session-name=123');
      expect(status).toBe(200);
      expect(text).toBe('session ID: 123');
    });
  });
});
