import request from 'supertest';
import { HttpServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';

import { AppModule } from './app3/app.module.js';

describe('guards per module and per controller', () => {
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await TestApplication.createTestApp(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  /**
   * - controller1 has per request scope, controller2 has per route scope;
   * - route with `/ok` - this is a route without guard (but can have external guard);
   * - route with `/need-auth` - this is a route with guard;
   */

  it('controller of root module, route without guard', async () => {
    const { type, status, text } = await testAgent.get('/root-controller');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('ok');
  });

  it('controller1 of module1, route without guard', async () => {
    const { type, status, text } = await testAgent.get('/module1/ok1');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('ok1');
  });

  it('controller1 of module1, route with guard (forbidden)', async () => {
    const { status } = await testAgent.get('/module1/need-auth1');
    expect(status).toBe(401);
  });

  it('controller1 of module1, route with guard (allow)', async () => {
    const { type, status, text } = await testAgent.get('/module1/need-auth1?allow=1');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('some secret1');
  });

  it('controller2 of module1, route without guard', async () => {
    const { type, status, text } = await testAgent.get('/module1/ok2');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('ok2');
  });

  it('controller2 of module1, route with guard (forbidden)', async () => {
    const { status } = await testAgent.get('/module1/need-auth2');
    expect(status).toBe(401);
  });

  it('controller2 of module1, route with guard (allow)', async () => {
    const { type, status, text } = await testAgent.get('/module1/need-auth2?allow=1');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('some secret2');
  });

  it('controller1 of module2, route with external guard (forbidden)', async () => {
    const { status } = await testAgent.get('/module2-with-guard/ok1');
    expect(status).toBe(401);
  });

  it('controller1 of module2, route with external guard (allow)', async () => {
    const { type, status, text } = await testAgent.get('/module2-with-guard/ok1?allow=1');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('ok1');
  });

  it('controller2 of module2, route with external guard (forbidden)', async () => {
    const { status } = await testAgent.get('/module2-with-guard/ok2');
    expect(status).toBe(401);
  });

  it('controller2 of module2, route with external guard (allow)', async () => {
    const { type, status, text } = await testAgent.get('/module2-with-guard/ok2?allow=1');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('ok2');
  });

  it('controller3 of module2, route with one external guard and one guard on the controller (forbidden)', async () => {
    const { status } = await testAgent.get('/module2-with-guard/ok3?allow=1');
    expect(status).toBe(401);
  });

  it('controller3 of module2, route with one external guard and and one guard on the controller (allow)', async () => {
    const { type, status, text } = await testAgent.get('/module2-with-guard/ok3?allow=2');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('ok3');
  });

  it('module3 has own controller1, route without guard', async () => {
    const { type, status, text } = await testAgent.get('/module3/ok1');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('ok1');
  });

  it('module3 imports module2, route with controller1 and external guard (forbidden)', async () => {
    const { status } = await testAgent.get('/module3/module2-with-guard/ok1');
    expect(status).toBe(401);
  });

  it('module3 imports module2, route with controller1 and external guard (allow)', async () => {
    const { type, status, text } = await testAgent.get('/module3/module2-with-guard/ok1?allow=1');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('ok1');
  });

  it('module3 imports module2, route with controller1 and external guard (forbidden)', async () => {
    const { status } = await testAgent.get('/module3/module2-with-guard/ok2');
    expect(status).toBe(401);
  });

  it('module3 imports module2, route with controller1 and external guard (allow)', async () => {
    const { type, status, text } = await testAgent.get('/module3/module2-with-guard/ok2?allow=1');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('ok2');
  });
});
