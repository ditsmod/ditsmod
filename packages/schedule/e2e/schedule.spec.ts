import request from 'supertest';

import { injectable, Logger, ctx, AnyObj, LoggerConfig, ProviderBuilder } from '@ditsmod/core';
import type { HttpServer } from '@ditsmod/rest';
import { controller, route, restRootModule, PATH_PARAMS } from '@ditsmod/rest';
import { TestRestApplication } from '@ditsmod/rest-testing';

import { ScheduleModule, SchedulerRegistry, cron, interval, timeout } from '#src/index.js';

@injectable()
class MyScheduledTasks {
  static cronCalls = 0;
  static intervalCalls = 0;
  static timeoutCalls = 0;

  constructor(private logger: Logger) {}

  @cron('*/1 * * * * *', { name: 'cron-job' })
  handleCron() {
    MyScheduledTasks.cronCalls++;
    this.logger.log('info', 'E2E Cron job tick!');
  }

  @interval('interval-job', 200)
  handleInterval() {
    MyScheduledTasks.intervalCalls++;
    this.logger.log('info', 'E2E Interval tick!');
  }

  @timeout('timeout-job', 100)
  handleTimeout() {
    MyScheduledTasks.timeoutCalls++;
    this.logger.log('info', 'E2E Timeout tick!');
  }
}

@controller()
class ScheduleController {
  constructor(private registry: SchedulerRegistry) {}

  @route('GET', 'tasks')
  listTasks() {
    return {
      intervals: this.registry.getIntervals(),
      timeouts: this.registry.getTimeouts(),
      cronJobs: Array.from(this.registry.getCronJobs().keys()),
    };
  }

  @route('POST', 'tasks/stop-interval/:name')
  stopInterval(@ctx(PATH_PARAMS) pathParams: AnyObj) {
    const { name } = pathParams;
    if (this.registry.doesExist('interval', name)) {
      this.registry.deleteInterval(name);
      return { message: `Interval task "${name}" stopped and deleted successfully.` };
    }
    return { message: `Interval task "${name}" does not exist.` };
  }

  @route('POST', 'tasks/stop-cron/:name')
  stopCron(@ctx(PATH_PARAMS) pathParams: AnyObj) {
    const { name } = pathParams;
    if (this.registry.doesExist('cron', name)) {
      this.registry.deleteCronJob(name);
      return { message: `Cron job "${name}" stopped and deleted successfully.` };
    }
    return { message: `Cron job "${name}" does not exist.` };
  }
}

@restRootModule({
  imports: [ScheduleModule],
  controllers: [ScheduleController],
  providersPerMod: [MyScheduledTasks],
  providersPerApp: new ProviderBuilder().useValue(LoggerConfig, { level: 'off' }),
})
class AppModule {}

describe('Schedule E2E', () => {
  let app: TestRestApplication;
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    // Reset counters before each run
    MyScheduledTasks.cronCalls = 0;
    MyScheduledTasks.intervalCalls = 0;
    MyScheduledTasks.timeoutCalls = 0;

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

  it('should verify tasks run successfully and increment counters', async () => {
    // Wait for at least one cron tick (1s), timeout (100ms) and multiple interval ticks (200ms)
    await new Promise((resolve) => setTimeout(resolve, 1200));

    expect(MyScheduledTasks.timeoutCalls).toBe(1);
    expect(MyScheduledTasks.intervalCalls).toBeGreaterThanOrEqual(5);
    expect(MyScheduledTasks.cronCalls).toBeGreaterThanOrEqual(1);
  });

  it('should dynamically stop and delete an interval job', async () => {
    const stopResponse = await testAgent.post('/tasks/stop-interval/interval-job');
    expect(stopResponse.status).toBe(200);
    expect(stopResponse.body.message).toContain('stopped and deleted successfully');

    const { status, body } = await testAgent.get('/tasks');
    expect(status).toBe(200);
    expect(body.intervals).not.toContain('interval-job');

    const intervalCallsBefore = MyScheduledTasks.intervalCalls;
    // Wait for another 500ms to verify that the interval calls do not increase anymore
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(MyScheduledTasks.intervalCalls).toBe(intervalCallsBefore);
  });

  it('should dynamically stop and delete a cron job', async () => {
    const stopResponse = await testAgent.post('/tasks/stop-cron/cron-job');
    expect(stopResponse.status).toBe(200);
    expect(stopResponse.body.message).toContain('stopped and deleted successfully');

    const { status, body } = await testAgent.get('/tasks');
    expect(status).toBe(200);
    expect(body.cronJobs).not.toContain('cron-job');

    const cronCallsBefore = MyScheduledTasks.cronCalls;
    // Wait for another 1200ms to verify that the cron calls do not increase anymore
    await new Promise((resolve) => setTimeout(resolve, 1200));
    expect(MyScheduledTasks.cronCalls).toBe(cronCallsBefore);
  });
});
