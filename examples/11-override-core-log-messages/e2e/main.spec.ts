import request from 'supertest';
import { NodeServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';

describe('11-override-core-log-messages', () => {
  let server: NodeServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await new TestApplication(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  it('controller works', async () => {
    const { type, status, text } = await testAgent.get('/');
    expect(type).toBe('text/plain');
    expect(status).toBe(200);
    expect(text).toBe("I'm OtherController\n");
  });
});
