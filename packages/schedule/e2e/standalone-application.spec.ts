import { injectable, Logger, LoggerConfig, ProviderBuilder, rootModule, StandaloneApplication } from '@ditsmod/core';
import { ScheduleModule, cron, interval, timeout } from '#src/index.js';

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

@rootModule({
  imports: [ScheduleModule],
  providersPerMod: [MyScheduledTasks],
  providersPerApp: new ProviderBuilder().useValue(LoggerConfig, { level: 'off' }),
})
class AppModule {}

describe('StandaloneApplication with ScheduleModule', () => {
  let app: StandaloneApplication;

  beforeAll(async () => {
    // Reset counters before each run
    MyScheduledTasks.cronCalls = 0;
    MyScheduledTasks.intervalCalls = 0;
    MyScheduledTasks.timeoutCalls = 0;

    app = await StandaloneApplication.create(AppModule);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should verify tasks run successfully and increment counters', async () => {
    // Wait for at least one cron tick (1s), timeout (100ms) and multiple interval ticks (200ms)
    await new Promise((resolve) => setTimeout(resolve, 1200));

    expect(MyScheduledTasks.timeoutCalls).toBe(1);
    expect(MyScheduledTasks.intervalCalls).toBeGreaterThanOrEqual(5);
    expect(MyScheduledTasks.cronCalls).toBeGreaterThanOrEqual(1);
  });
});
