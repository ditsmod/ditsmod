import 'reflect-metadata/lite';
import { jest } from '@jest/globals';
import { CronJob } from 'cron';

import type { Logger } from '@ditsmod/core';

import { SchedulerOrchestrator } from './scheduler.orchestrator.js';
import { SchedulerRegistry } from './scheduler.registry.js';

describe('SchedulerRegistry & SchedulerOrchestrator', () => {
  let registry: SchedulerRegistry;
  let orchestrator: SchedulerOrchestrator;
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(() => {
    loggerMock = {
      log: jest.fn(),
    } as any;

    registry = new SchedulerRegistry(loggerMock);
    orchestrator = new SchedulerOrchestrator(registry, loggerMock);

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('SchedulerRegistry', () => {
    it('should add, check, get and delete a cron job', () => {
      const job = new CronJob('* * * * * *', () => {});
      expect(registry.doesExist('cron', 'job1')).toBe(false);

      registry.addCronJob('job1', job);
      expect(registry.doesExist('cron', 'job1')).toBe(true);
      expect(registry.getCronJob('job1')).toBe(job);

      registry.deleteCronJob('job1');
      expect(registry.doesExist('cron', 'job1')).toBe(false);
      expect(() => registry.getCronJob('job1')).toThrow();
    });

    it('should add, check, get and delete an interval', () => {
      const ref = setInterval(() => {}, 1000);
      expect(registry.doesExist('interval', 'int1')).toBe(false);

      registry.addInterval('int1', ref);
      expect(registry.doesExist('interval', 'int1')).toBe(true);
      expect(registry.getInterval('int1')).toBe(ref);

      registry.deleteInterval('int1');
      expect(registry.doesExist('interval', 'int1')).toBe(false);
      expect(() => registry.getInterval('int1')).toThrow();
    });

    it('should add, check, get and delete a timeout', () => {
      const ref = setTimeout(() => {}, 1000);
      expect(registry.doesExist('timeout', 't1')).toBe(false);

      registry.addTimeout('t1', ref);
      expect(registry.doesExist('timeout', 't1')).toBe(true);
      expect(registry.getTimeout('t1')).toBe(ref);

      registry.deleteTimeout('t1');
      expect(registry.doesExist('timeout', 't1')).toBe(false);
      expect(() => registry.getTimeout('t1')).toThrow();
    });

    it('should throw when adding duplicate keys', () => {
      const job = new CronJob('* * * * * *', () => {});
      registry.addCronJob('job1', job);
      expect(() => registry.addCronJob('job1', job)).toThrow();

      const ref = setInterval(() => {}, 1000);
      registry.addInterval('int1', ref);
      expect(() => registry.addInterval('int1', ref)).toThrow();

      const ref2 = setTimeout(() => {}, 1000);
      registry.addTimeout('t1', ref2);
      expect(() => registry.addTimeout('t1', ref2)).toThrow();
    });
  });

  describe('SchedulerOrchestrator', () => {
    it('should mount pending timeouts, execute them and clean up on beforeShutdown', () => {
      const fn = jest.fn();
      orchestrator.addTimeout('t1', fn, 100);

      orchestrator.mountJobs();
      expect(registry.doesExist('timeout', 't1')).toBe(true);

      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);

      orchestrator.beforeShutdown();
      expect(registry.doesExist('timeout', 't1')).toBe(false);
    });

    it('should mount pending intervals, tick them and clean up on beforeShutdown', () => {
      const fn = jest.fn();
      orchestrator.addInterval('int1', fn, 100);

      orchestrator.mountJobs();
      expect(registry.doesExist('interval', 'int1')).toBe(true);

      jest.advanceTimersByTime(250);
      expect(fn).toHaveBeenCalledTimes(2);

      orchestrator.beforeShutdown();
      expect(registry.doesExist('interval', 'int1')).toBe(false);
    });

    it('should mount pending cron jobs, tick them and clean up on beforeShutdown', async () => {
      const fn = jest.fn();
      orchestrator.addCron('cron1', fn, { cronTime: '* * * * * *' });

      orchestrator.mountJobs();
      expect(registry.doesExist('cron', 'cron1')).toBe(true);

      const job = registry.getCronJob('cron1');
      // Manually trigger the tick to verify it works (testing real timer ticks on cron v4 is complex)
      await job.fireOnTick();
      expect(fn).toHaveBeenCalledTimes(1);

      orchestrator.beforeShutdown();
      expect(registry.doesExist('cron', 'cron1')).toBe(false);
    });

    it('should clear pending initialDelay timeouts on beforeShutdown', () => {
      const fn = jest.fn();
      orchestrator.addCron('cronDelay', fn, { cronTime: '* * * * * *', initialDelay: 5000 });

      orchestrator.mountJobs();
      expect(registry.doesExist('cron', 'cronDelay')).toBe(true);

      const job = registry.getCronJob('cronDelay');
      expect(job.isActive).toBe(false);

      orchestrator.beforeShutdown();
      // Advance past the 5s delay — the job should not start because it was cleared
      jest.advanceTimersByTime(5000);
      expect(job.isActive).toBe(false);
    });

    it('should wrap callbacks in try/catch and log error on failure', async () => {
      const fn = jest.fn().mockImplementation(() => {
        throw new Error('callback failure');
      });
      orchestrator.addTimeout('tFail', fn, 100);

      orchestrator.mountJobs();
      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(loggerMock.log).toHaveBeenCalledWith('error', expect.any(Error));
    });
  });
});
