import { CronJob } from 'cron';

import { injectable, Logger, BeforeShutdown } from '@ditsmod/core';

import { SchedulerRegistry } from './scheduler.registry.js';
import type { CronOptions } from './types.js';

@injectable()
export class SchedulerOrchestrator implements BeforeShutdown {
  private isMounted = false;
  private readonly pendingCron = new Map<string, { target: Function; options: CronOptions & { cronTime: any } }>();
  private readonly pendingIntervals = new Map<string, { target: Function; timeout: number }>();
  private readonly pendingTimeouts = new Map<string, { target: Function; timeout: number }>();
  private readonly initialDelayRefs = new Map<string, NodeJS.Timeout>();

  constructor(
    private registry: SchedulerRegistry,
    private logger: Logger,
  ) {}

  addCron(name: string, target: Function, options: CronOptions & { cronTime: any }): void {
    this.pendingCron.set(name, { target, options });
  }

  addInterval(name: string, target: Function, timeout: number): void {
    this.pendingIntervals.set(name, { target, timeout });
  }

  addTimeout(name: string, target: Function, timeout: number): void {
    this.pendingTimeouts.set(name, { target, timeout });
  }

  mountJobs(): void {
    if (this.isMounted) {
      return;
    }
    this.isMounted = true;

    // 1. Mount timeouts
    this.pendingTimeouts.forEach((entry, name) => {
      const ref = setTimeout(() => {
        try {
          entry.target();
        } catch (err) {
          this.logger.log('error', err);
        }
      }, entry.timeout);
      this.registry.addTimeout(name, ref);
    });

    // 2. Mount intervals
    this.pendingIntervals.forEach((entry, name) => {
      const ref = setInterval(() => {
        try {
          entry.target();
        } catch (err) {
          this.logger.log('error', err);
        }
      }, entry.timeout);
      this.registry.addInterval(name, ref);
    });

    this.pendingCron.forEach((entry, name) => {
      const { target, options } = entry;
      const jobOptions: any = {
        cronTime: options.cronTime,
        onTick: async () => {
          try {
            await target();
          } catch (err) {
            this.logger.log('error', err);
          }
        },
        start: !options.disabled && !options.initialDelay,
        unrefTimeout: options.unrefTimeout,
      };
      if (options.timeZone) {
        jobOptions.timeZone = options.timeZone;
      }
      if (options.utcOffset !== undefined) {
        jobOptions.utcOffset = options.utcOffset;
      }
      const job = CronJob.from(jobOptions);

      this.registry.addCronJob(name, job);

      if (options.initialDelay && options.initialDelay > 0 && !options.disabled) {
        const delayRef = setTimeout(() => {
          this.initialDelayRefs.delete(name);
          if (this.registry.doesExist('cron', name)) {
            job.start();
          }
        }, options.initialDelay);
        this.initialDelayRefs.set(name, delayRef);
      }
    });
  }

  beforeShutdown(): void {
    // 1. Clear any pending initial delay timeouts
    this.initialDelayRefs.forEach((ref) => {
      clearTimeout(ref);
    });
    this.initialDelayRefs.clear();

    // 2. Stop and delete all cron jobs
    const cronJobs = this.registry.getCronJobs();
    Array.from(cronJobs.keys()).forEach((name) => {
      try {
        this.registry.deleteCronJob(name);
      } catch (err) {
        this.logger.log('error', err);
      }
    });

    // 3. Clear and delete all intervals
    this.registry.getIntervals().forEach((name) => {
      try {
        this.registry.deleteInterval(name);
      } catch (err) {
        this.logger.log('error', err);
      }
    });

    // 4. Clear and delete all timeouts
    this.registry.getTimeouts().forEach((name) => {
      try {
        this.registry.deleteTimeout(name);
      } catch (err) {
        this.logger.log('error', err);
      }
    });
  }
}
