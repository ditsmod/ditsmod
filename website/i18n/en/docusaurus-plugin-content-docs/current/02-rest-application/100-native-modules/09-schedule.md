---
sidebar_position: 9
---

# @ditsmod/schedule

This module provides support for scheduling tasks (cron jobs, intervals, and timeouts) in Ditsmod applications.

## Installation {#installation}

```bash
yarn add @ditsmod/schedule
```

## Importing ScheduleModule {#importing-schedulemodule}

To enable scheduling, import the `ScheduleModule` in your root or feature module, and register the class containing your tasks in `providersPerMod` (or `providersPerApp`):

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

## Using decorators {#using-decorators}

Create a service and decorate its methods with `@cron`, `@interval`, or `@timeout`:

```ts
import { injectable, Logger } from '@ditsmod/core';
import { cron, interval, timeout, CronExpression } from '@ditsmod/schedule';

@injectable()
export class MyTasks {
  constructor(private logger: Logger) {}

  @cron(CronExpression.EVERY_5_SECONDS, { name: 'my-cron-job' })
  handleCron() {
    this.logger.log('info', 'Cron job ticked!');
  }

  @interval('my-interval-job', 3000)
  handleInterval() {
    this.logger.log('info', 'Interval ticked!');
  }

  @timeout('my-timeout-job', 2000)
  handleTimeout() {
    this.logger.log('info', 'Timeout triggered!');
  }
}
```

### Decorator @cron {#cron-decorator}

Allows running methods on a cron schedule. It accepts:

- The first argument: standard cron expression (e.g. `* * * * * *` for every second) or a `Date` object.
- The second argument (optional): a parameters object `CronOptions`:
  - `name`: unique name to allow getting a job reference via `SchedulerRegistry`.
  - `timeZone`: timezone for task execution.
  - `utcOffset`: offset of your timezone in minutes.
  - `disabled`: if set to `true`, the job will not automatically start when the application bootstraps.
  - `initialDelay`: delay in milliseconds before the first execution after application bootstrap.

### Decorators @interval and @timeout {#interval-and-timeout-decorators}

- `@interval(timeoutMs)` or `@interval(name, timeoutMs)` — periodic execution every `timeoutMs` milliseconds.
- `@timeout(timeoutMs)` or `@timeout(name, timeoutMs)` — single execution after `timeoutMs` milliseconds delay.

---

## Dynamic task management {#dynamic-management}

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
      intervals: this.registry.getIntervals(),
      timeouts: this.registry.getTimeouts(),
      cronJobs: Array.from(this.registry.getCronJobs().keys()),
    };
  }

  @route('POST', 'tasks/stop-interval/:name')
  stopInterval(name: string) {
    if (this.registry.doesExist('interval', name)) {
      this.registry.deleteInterval(name);
      return { message: `Interval task "${name}" stopped.` };
    }
    return { message: `Interval task "${name}" not found.` };
  }
}
```
