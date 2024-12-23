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

  it('controller works with GET method', async () => {
    const { status, type, text } = await testAgent.get('/auth/signin');
    expect(status).toBe(200);
    expect(type).toBe('text/html');
    expect(text).toStrictEqual(expect.any(String));
  });
});
