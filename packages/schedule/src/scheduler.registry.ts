import { CronJob } from 'cron';
import { injectable, Logger } from '@ditsmod/core';

import { DUPLICATE_SCHEDULER, NO_SCHEDULER_FOUND } from './schedule.messages.js';

@injectable()
export class SchedulerRegistry {
  private readonly cronJobs = new Map<string, CronJob>();
  private readonly timeouts = new Map<string, any>();
  private readonly intervals = new Map<string, any>();

  constructor(private logger: Logger) {}

  doesExist(type: 'cron' | 'timeout' | 'interval', name: string): boolean {
    switch (type) {
      case 'cron':
        return this.cronJobs.has(name);
      case 'interval':
        return this.intervals.has(name);
      case 'timeout':
        return this.timeouts.has(name);
      default:
        return false;
    }
  }

  getCronJob(name: string): CronJob {
    const ref = this.cronJobs.get(name);
    if (!ref) {
      throw new Error(NO_SCHEDULER_FOUND('Cron Job', name));
    }
    return ref;
  }

  getInterval(name: string): any {
    const ref = this.intervals.get(name);
    if (typeof ref === 'undefined') {
      throw new Error(NO_SCHEDULER_FOUND('Interval', name));
    }
    return ref;
  }

  getTimeout(name: string): any {
    const ref = this.timeouts.get(name);
    if (typeof ref === 'undefined') {
      throw new Error(NO_SCHEDULER_FOUND('Timeout', name));
    }
    return ref;
  }

  addCronJob(name: string, job: CronJob): void {
    const ref = this.cronJobs.get(name);
    if (ref) {
      throw new Error(DUPLICATE_SCHEDULER('Cron Job', name));
    }

    job.fireOnTick = this.wrapFunctionInTryCatchBlocks(job.fireOnTick, job);
    this.cronJobs.set(name, job);
  }

  addInterval<T = any>(name: string, intervalId: T): void {
    const ref = this.intervals.get(name);
    if (ref) {
      throw new Error(DUPLICATE_SCHEDULER('Interval', name));
    }
    this.intervals.set(name, intervalId);
  }

  addTimeout<T = any>(name: string, timeoutId: T): void {
    const ref = this.timeouts.get(name);
    if (ref) {
      throw new Error(DUPLICATE_SCHEDULER('Timeout', name));
    }
    this.timeouts.set(name, timeoutId);
  }

  getCronJobs(): Map<string, CronJob> {
    return this.cronJobs;
  }

  deleteCronJob(name: string): void {
    const cronJob = this.getCronJob(name);
    void cronJob.stop();
    this.cronJobs.delete(name);
  }

  getIntervals(): string[] {
    return [...this.intervals.keys()];
  }

  deleteInterval(name: string): void {
    const interval = this.getInterval(name);
    clearInterval(interval);
    this.intervals.delete(name);
  }

  getTimeouts(): string[] {
    return [...this.timeouts.keys()];
  }

  deleteTimeout(name: string): void {
    const timeout = this.getTimeout(name);
    clearTimeout(timeout);
    this.timeouts.delete(name);
  }

  private wrapFunctionInTryCatchBlocks(methodRef: Function, instance: object): (...args: unknown[]) => Promise<void> {
    return async (...args: unknown[]) => {
      try {
        await methodRef.call(instance, ...args);
      } catch (error) {
        this.logger.log('error', error);
      }
    };
  }
}
