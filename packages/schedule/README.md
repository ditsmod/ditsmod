# @ditsmod/schedule

This is a Ditsmod module that provides support for scheduling tasks: cron jobs, intervals, and timeouts. It leverages the robust `cron` npm library under the hood.

## Installation

```bash
yarn add @ditsmod/schedule
```

## Setup

To enable scheduling, import the `ScheduleModule` in your root or feature module, and register the class containing your scheduled tasks in `providersPerMod` (or `providersPerApp`):

```ts
import { restRootModule } from '@ditsmod/rest';
import { ScheduleModule } from '@ditsmod/schedule';
import { MyTasks } from './my-tasks.service.js';

@restRootModule({
  imports: [ScheduleModule],
  providersPerMod: [MyTasks],
})
export class AppModule {}
```

## Usage

Create a class and decorate its methods with `@cron`, `@interval`, or `@timeout`.

```ts
import { injectable, Logger } from '@ditsmod/core';
import { cron, interval, timeout, CronExpression } from '@ditsmod/schedule';

@injectable()
export class MyTasks {
  constructor(private logger: Logger) {}

  // Run every 5 seconds using predefined CronExpression
  @cron(CronExpression.EVERY_5_SECONDS, { name: 'my-cron-job' })
  handleCron() {
    this.logger.log('info', 'Cron job ticked!');
  }

  // Run every 3 seconds (3000ms) with a custom name
  @interval('my-interval-job', 3000)
  handleInterval() {
    this.logger.log('info', 'Interval ticked!');
  }

  // Run once after 2 seconds (2000ms)
  @timeout('my-timeout-job', 2000)
  handleTimeout() {
    this.logger.log('info', 'Timeout triggered!');
  }
}
```

### Decorators

#### `@cron(cronTime, options?)`

- `cronTime`: `string` (standard cron expression, e.g. `* * * * * *` for every second) or `Date` object.
- `options`: `CronOptions`
  - `name`: `string` — A unique name for the cron job to retrieve it later from `SchedulerRegistry`.
  - `timeZone`: `string` — Timezone for execution.
  - `utcOffset`: `number` — Offset of your timezone.
  - `disabled`: `boolean` — Whether the job is disabled at startup (default is `false`).
  - `initialDelay`: `number` — Delay in milliseconds before the first execution.

#### `@interval(timeoutMs)` or `@interval(name, timeoutMs)`

- `name`: `string` — Custom identifier (optional).
- `timeoutMs`: `number` — Execution interval in milliseconds.

#### `@timeout(timeoutMs)` or `@timeout(name, timeoutMs)`

- `name`: `string` — Custom identifier (optional).
- `timeoutMs`: `number` — Execution delay in milliseconds.

---

## Dynamic Management via `SchedulerRegistry`

You can inject `SchedulerRegistry` into your services or controllers to query, start, stop, or delete registered tasks dynamically:

```ts
import { controller, route } from '@ditsmod/rest';
import { SchedulerRegistry } from '@ditsmod/schedule';

@controller()
export class ScheduleController {
  constructor(private registry: SchedulerRegistry) {}

  @route('GET', 'tasks')
  listTasks() {
    return {
      intervals: this.registry.getIntervals(), // Returns array of interval names
      timeouts: this.registry.getTimeouts(), // Returns array of timeout names
      cronJobs: Array.from(this.registry.getCronJobs().keys()),
    };
  }

  @route('POST', 'tasks/stop-interval/:name')
  stopInterval(name: string) {
    if (this.registry.doesExist('interval', name)) {
      this.registry.deleteInterval(name); // Stops and deletes the interval
      return { message: `Interval task "${name}" stopped.` };
    }
    return { message: `Interval task "${name}" not found.` };
  }
}
```

### `SchedulerRegistry` API Reference

- `doesExist(type: 'cron' | 'timeout' | 'interval', name: string): boolean` — Checks if a job exists.
- `getCronJobs(): Map<string, CronJob>` — Returns all registered cron jobs.
- `getCronJob(name: string): CronJob` — Gets a specific cron job reference.
- `deleteCronJob(name: string): void` — Stops and deletes a cron job.
- `getIntervals(): string[]` — Returns all active interval names.
- `deleteInterval(name: string): void` — Clears and deletes a registered interval.
- `getTimeouts(): string[]` — Returns all active timeout names.
- `deleteTimeout(name: string): void` — Clears and deletes a registered timeout.
