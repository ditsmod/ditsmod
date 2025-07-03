import request from 'supertest';
import { HttpServer } from '@ditsmod/rest';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from './app.module.js';
import { Module3 } from './module3/module3.js';

describe('rest app2', () => {
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await TestApplication.createTestApp(AppModule).markModuleAsExternal(Module3).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  it('controller from root module', async () => {
    const { status, text } = await testAgent.get('/controller0');
    expect(status).toBe(200);
    expect(text).toBe('controller0');
  });

  it('imports module1 with controllers', async () => {
    const { status, text } = await testAgent.get('/module1/controller1');
    expect(status).toBe(200);
    expect(text).toBe('controller1');
  });

  it('appends module2 with controllers with "path"', async () => {
    const { status, text } = await testAgent.get('/module2/controller2');
    expect(status).toBe(200);
    expect(text).toBe('controller2');
  });

  it('appends module2 with controllers without "path"', async () => {
    const { status, text } = await testAgent.get('/controller2');
    expect(status).toBe(200);
    expect(text).toBe('controller2');
  });

  it('appends module3 marked as external module', async () => {
    const { status, text } = await testAgent.get('/module3/controller3');
    expect(status).toBe(200);
    expect(text).toBe('controller3');
  });
});
