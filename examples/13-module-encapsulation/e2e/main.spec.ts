import request from 'supertest';
import { NodeServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';

describe('13-module-encapsulation', () => {
  let server: NodeServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await new TestApplication(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  it('case 1', async () => {
    const { type, status, text } = await testAgent.get('/');
    expect(type).toBe('text/plain');
    expect(status).toBe(200);
    expect(text).toBe('per req counter: 1, per rou counter: 1');
  });

  it('case 2', async () => {
    const { type, status, text } = await testAgent.get('/');
    expect(type).toBe('text/plain');
    expect(status).toBe(200);
    expect(text).toBe('per req counter: 1, per rou counter: 2');
  });

  it('case 3', async () => {
    const { type, status, text } = await testAgent.get('/');
    expect(type).toBe('text/plain');
    expect(status).toBe(200);
    expect(text).toBe('per req counter: 1, per rou counter: 3');
  });

  it('case 4', async () => {
    const { status, body, type } = await testAgent.get('/first');
    expect(status).toBe(200);
    expect(type).toBe('application/json');
    expect(body).toEqual([{ prop: 'from FirstModule' }]);
  });

  it('case 5', async () => {
    const { status, body, type } = await testAgent.get('/second');
    expect(status).toBe(200);
    expect(type).toBe('application/json');
    expect(body).toEqual([{ prop: 'from FirstModule' }, { prop: 'from SecondModule' }]);
  });

  it('case 6', async () => {
    const { status, body, type } = await testAgent.get('/third');
    expect(status).toBe(200);
    expect(type).toBe('application/json');
    expect(body).toEqual([{ prop: 'from SecondModule' }]);
  });
});