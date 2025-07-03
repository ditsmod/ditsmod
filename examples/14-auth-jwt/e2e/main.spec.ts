import request from 'supertest';
import { HttpServer } from '@ditsmod/rest';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';

describe('14-auth-jwt', () => {
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
    expect(text).toBe('Hello, World!\n');
  });

  it('case 2', async () => {
    const response1 = await testAgent.get('/get-token-for/Kostia');
    expect(response1.status).toBe(200);
    expect(response1.text).toBeDefined();

    const response2 = await testAgent.get('/profile');
    expect(response2.status).toBe(401);

    const response3 = await testAgent.get('/profile').set('Authorization', `Bearer ${response1.text}`);
    expect(response3.status).toBe(200);
    expect(response3.text).toBe('Hello, Kostia! You have successfully authorized.');
  });
});
