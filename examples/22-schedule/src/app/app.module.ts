import { LoggerConfig, ProviderBuilder, injectable, Logger, ctx, AnyObj } from '@ditsmod/core';
import { controller, route, restRootModule, PATH_PARAMS } from '@ditsmod/rest';
import { ScheduleModule, SchedulerRegistry, cron, interval, timeout } from '@ditsmod/schedule';

@injectable()
export class MyScheduledTasks {
  constructor(private logger: Logger) {}

  @cron('*/5 * * * * *', { name: 'cron-job' })
  handleCron() {
    this.logger.log('info', 'Cron job tick! executed every 5 seconds.');
  }

  @interval('interval-job', 3000)
  handleInterval() {
    this.logger.log('info', 'Interval tick! executed every 3 seconds.');
  }

  @timeout('timeout-job', 2000)
  handleTimeout() {
    this.logger.log('info', 'Timeout tick! executed once after 2 seconds.');
  }
}

@controller()
export class ScheduleController {
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
  providersPerApp: new ProviderBuilder().useValue(LoggerConfig, { level: 'info' }),
})
export class AppModule {}
