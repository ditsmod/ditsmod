import request from 'supertest';
import { HttpServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';

describe('03-route-guards', () => {
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await TestApplication.createTestApp(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  it('controller in AppModule should works', async () => {
    const { type, status, text } = await testAgent.get('/');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('ok');
  });

  it('should works', async () => {
    const { type, status, text } = await testAgent.get('/controler1-of-module1');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('ok');
  });

  it('in module3 appended controller should works with guards', async () => {
    const { status } = await testAgent.get('/controler1-of-module2');
    expect(status).toBe(401);
  });

  it('controller singleton in module3 appended singletor controller should works with guards', async () => {
    const { status } = await testAgent.get('/controler2-of-module2');
    expect(status).toBe(401);
  });

  it('should throw 401', async () => {
    const { status } = await testAgent.get('/unauth');
    expect(status).toBe(401);
  });

  it('should throw 403 for guards setted for a module', async () => {
    const { status } = await testAgent.get('/guards-1/controler1-of-module2');
    expect(status).toBe(403);
  });

  it('controller singleton should throw 403 for guards setted for a module', async () => {
    const { status } = await testAgent.get('/guards-1/controler2-of-module2');
    expect(status).toBe(403);
  });

  it('should throw 403', async () => {
    const { status } = await testAgent.get('/forbidden');
    expect(status).toBe(403);
  });

  it('should works with singleton', async () => {
    const { type, status, text } = await testAgent.get('/controler2-of-module1');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('ok');
  });

  it('should throw 401 by singleton', async () => {
    const { status } = await testAgent.get('/unauth2');
    expect(status).toBe(401);
  });

  it('should throw 403 by singleton', async () => {
    const { status } = await testAgent.get('/forbidden2');
    expect(status).toBe(403);
  });

  it('should works', async () => {
    const expectBase64 = Buffer.from(process.env.BASIC_AUTH!, 'utf8').toString('base64');
    const { type, status, text } = await testAgent.get('/basic-auth').set('Authorization', `Basic ${expectBase64}`);
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('You are now authorized with BasicGuard');
  });

  it('should throw 401', async () => {
    const expectBase64 = Buffer.from('fake-string', 'utf8').toString('base64');
    const { status } = await testAgent.get('/basic-auth').set('Authorization', `Basic ${expectBase64}`);
    expect(status).toBe(401);
  });

  it('should throw 401', async () => {
    const { status } = await testAgent.get('/basic-auth');
    expect(status).toBe(401);
  });
});
