import request from 'supertest';
import { HttpServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';

import { AppModule } from './app3/app.module.js';

describe('guards per module and per controller', () => {
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await TestApplication.createTestApp(AppModule, { loggerConfig: { level: 'info' } }).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  it('controller of root module without guard', async () => {
    const { type, status, text } = await testAgent.get('/root-controller');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('ok');
  });

  it('controller1 of module1 without guard', async () => {
    const { type, status, text } = await testAgent.get('/module1/ok1');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('ok1');
  });

  it('controller1 of module1 with guard (forbidden)', async () => {
    const { status } = await testAgent.get('/module1/need-auth1');
    expect(status).toBe(401);
  });

  it('controller1 of module1 with guard (allow)', async () => {
    const { type, status, text } = await testAgent.get('/module1/need-auth1?allow=1');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('some secret1');
  });

  it('controller2 of module1 without guard', async () => {
    const { type, status, text } = await testAgent.get('/module1/ok2');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('ok2');
  });

  it('controller2 of module1 with guard (forbidden)', async () => {
    const { status } = await testAgent.get('/module1/need-auth2');
    expect(status).toBe(401);
  });

  it('controller2 of module1 with guard (allow)', async () => {
    const { type, status, text } = await testAgent.get('/module1/need-auth2?allow=1');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('some secret2');
  });

  it('controller1 of module2 with external guard (forbidden)', async () => {
    const { status } = await testAgent.get('/module2-with-guard/ok1');
    expect(status).toBe(401);
  });

  it('controller1 of module2 with external guard (allow)', async () => {
    const { type, status, text } = await testAgent.get('/module2-with-guard/ok1?allow=1');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('ok1');
  });

  it('controller2 of module2 with external guard (forbidden)', async () => {
    const { status } = await testAgent.get('/module2-with-guard/ok2');
    expect(status).toBe(401);
  });

  it('controller2 of module2 with external guard (allow)', async () => {
    const { type, status, text } = await testAgent.get('/module2-with-guard/ok2?allow=1');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('ok2');
  });
});
