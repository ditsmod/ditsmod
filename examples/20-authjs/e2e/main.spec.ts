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

  it('case1', async () => {
    const { status, type, text } = await testAgent.get('/auth/signin');
    expect(status).toBe(200);
    expect(type).toBe('text/html');
    expect(text).toEqual(expect.any(String));
  });

  it('case2', async () => {
    const { status } = await testAgent.get('/per-req');
    expect(status).toBe(401);
  });

  it('case3', async () => {
    const { status } = await testAgent.get('/per-mod');
    expect(status).toBe(401);
  });
});
