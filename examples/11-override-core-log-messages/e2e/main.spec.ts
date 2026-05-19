import request from 'supertest';
import type { HttpServer } from '@ditsmod/rest';
import { TestRestApplication } from '@ditsmod/rest-testing';

import { AppModule } from '#app/app.module.js';

describe('11-override-core-log-messages', () => {
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await TestRestApplication.createTestApp(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  it('controller works', async () => {
    const { status, text } = await testAgent.get('/');
    expect(status).toBe(200);
    expect(text).toBe("I'm OtherController\n");
  });
});
