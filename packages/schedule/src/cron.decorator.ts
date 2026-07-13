import { Reflector } from '@ditsmod/core/di';
import type { CronJobParams } from 'cron';
import type { CronOptions } from './types.js';

export const cron = Reflector.makePropDecorator((cronTime: CronJobParams['cronTime'], options?: CronOptions) => ({
  ...options,
  cronTime,
}));
export type CronDecorator = typeof cron;
