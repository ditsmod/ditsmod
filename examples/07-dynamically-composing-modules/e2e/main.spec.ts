import request from 'supertest';
import { TestApplication } from '@ditsmod/testing';
import { NodeServer } from '@ditsmod/core';

import { AppModule } from '#app/app.module.js';

describe('07-dynamically-composing-modules', () => {
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
    const { status, text, type } = await testAgent.get('/');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('first module.\n');
  });

  it('case 2', async () => {
    const { status } = await testAgent.get('/get-2');
    expect(status).toBe(501);
  });

  it('case 3', async () => {
    const { status, text, type } = await testAgent.get('/add-2');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('second successfully importing!\n');
  });

  it('case 4', async () => {
    const { status, text, type } = await testAgent.get('/get-2');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('second module.\n');
  });

  it('case 5', async () => {
    const msg = 'Validation ThirdModule failed: this module should have "providersPerApp" or some controllers, or exports, or extensions.';
    const { status, body, type } = await testAgent.get('/add-3');
    expect(status).toBe(500);
    expect(type).toBe('application/json');
    expect(body).toEqual({ error: msg });
  });

  it('case 6', async () => {
    const { status, text, type } = await testAgent.get('/');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('first module.\n');
  });

  it('case 7', async () => {
    const { status, text, type } = await testAgent.get('/get-2');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('second module.\n');
  });

  it('case 8', async () => {
    const { status, text, type } = await testAgent.get('/del-2');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('second successfully removing!\n');
  });

  it('case 9', async () => {
    const { status } = await testAgent.get('/get-2');
    expect(status).toBe(501);
  });

  it('case 10', async () => {
    const { status, text, type } = await testAgent.get('/');
    expect(status).toBe(200);
    expect(type).toBe('text/plain');
    expect(text).toBe('first module.\n');
  });
});
