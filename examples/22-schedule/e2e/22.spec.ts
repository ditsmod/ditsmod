import request from 'supertest';
import type { HttpServer } from '@ditsmod/rest';
import { TestRestApplication } from '@ditsmod/rest-testing';

import { AppModule } from '#app/app.module.js';

describe('22-schedule', () => {
  let app: TestRestApplication;
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    app = TestRestApplication.createTestApp(AppModule);
    server = await app.getServer();
    testAgent = request(server);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list registered tasks', async () => {
    const { status, body } = await testAgent.get('/tasks');
    expect(status).toBe(200);
    expect(body.intervals).toContain('interval-job');
    expect(body.timeouts).toContain('timeout-job');
    expect(body.cronJobs).toContain('cron-job');
  });

  it('should stop and delete interval job dynamically', async () => {
    const stopResponse = await testAgent.post('/tasks/stop-interval/interval-job');
    expect(stopResponse.status).toBe(200);
    expect(stopResponse.body.message).toContain('stopped and deleted successfully');

    const { status, body } = await testAgent.get('/tasks');
    expect(status).toBe(200);
    expect(body.intervals).not.toContain('interval-job');
  });

  it('should stop and delete cron job dynamically', async () => {
    const stopResponse = await testAgent.post('/tasks/stop-cron/cron-job');
    expect(stopResponse.status).toBe(200);
    expect(stopResponse.body.message).toContain('stopped and deleted successfully');

    const { status, body } = await testAgent.get('/tasks');
    expect(status).toBe(200);
    expect(body.cronJobs).not.toContain('cron-job');
  });
});
