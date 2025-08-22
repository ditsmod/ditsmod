import request from 'supertest';
import { TestApplication } from '@ditsmod/testing';
import { HttpServer } from '@ditsmod/rest';

import { AppModule } from '#app/app.module.js';

describe('07-dynamically-composing-modules', () => {
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await TestApplication.createTestApp(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  it('case 1', async () => {
    const { status, text } = await testAgent.get('/');
    expect(status).toBe(200);
    expect(text).toBe('first module.\n');
  });

  it('case 2', async () => {
    const { status } = await testAgent.get('/get-2');
    expect(status).toBe(501);
  });

  it('case 3', async () => {
    const { status, text } = await testAgent.get('/add-2');
    expect(status).toBe(200);
    expect(text).toBe('second successfully importing!\n');
  });

  it('case 4', async () => {
    const { status, text } = await testAgent.get('/get-2');
    expect(status).toBe(200);
    expect(text).toBe('second module.\n');
  });

  it('case 5', async () => {
    const { status, body, type } = await testAgent.get('/add-3');
    expect(status).toBe(500);
    expect(type).toBe('application/json');
    const expectStr = expect.stringContaining('ThirdModule-WithParams failed: this module should have');
    expect(body).toEqual({ error: expectStr, code: 'NormalizationFailed' });
  });

  it('case 6', async () => {
    const { status, text } = await testAgent.get('/');
    expect(status).toBe(200);
    expect(text).toBe('first module.\n');
  });

  it('case 7', async () => {
    const { status, text } = await testAgent.get('/get-2');
    expect(status).toBe(200);
    expect(text).toBe('second module.\n');
  });

  it('case 8', async () => {
    const { status, text } = await testAgent.get('/del-2');
    expect(status).toBe(200);
    expect(text).toBe('second successfully removing!\n');
  });

  it('case 9', async () => {
    const { status } = await testAgent.get('/get-2');
    expect(status).toBe(501);
  });

  it('case 10', async () => {
    const { status, text } = await testAgent.get('/');
    expect(status).toBe(200);
    expect(text).toBe('first module.\n');
  });
});
