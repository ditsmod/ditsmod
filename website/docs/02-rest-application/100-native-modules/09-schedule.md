---
sidebar_position: 9
---

# @ditsmod/schedule

Цей модуль забезпечує підтримку планування завдань (cron-задач, інтервалів та таймаутів) у застосунках Ditsmod.

## Встановлення {#installation}

```bash
yarn add @ditsmod/schedule
```

## Підключення ScheduleModule {#importing-schedulemodule}

Для активації планування імпортуйте `ScheduleModule` у ваш кореневий або фіче-модуль, а також зареєструйте клас із завданнями в `providersPerMod` (або `providersPerApp`):

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

## Використання декораторів {#using-decorators}

Створіть сервіс та декоруйте його методи за допомогою `@cron`, `@interval` або `@timeout`:

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

### Декоратор @cron {#cron-decorator}

Дозволяє запускати методи за розкладом cron. Він приймає:

- Перший аргумент: стандартний cron-вираз (наприклад, `* * * * * *` для виконання щосекунди) або об'єкт `Date`.
- Другий аргумент (опціонально): об'єкт параметрів `CronOptions`:
  - `name`: унікальне ім'я для можливості отримання посилання через `SchedulerRegistry`.
  - `timeZone`: часовий пояс для виконання завдання.
  - `utcOffset`: зміщення часового поясу в хвилинах.
  - `disabled`: якщо встановлено в `true`, завдання не буде автоматично запущено при старті застосунку.
  - `initialDelay`: затримка в мілісекундах перед першим запуском після старту застосунку.

### Декоратори @interval та @timeout {#interval-and-timeout-decorators}

- `@interval(timeoutMs)` або `@interval(name, timeoutMs)` — періодичне виконання кожні `timeoutMs` мілісекунд.
- `@timeout(timeoutMs)` або `@timeout(name, timeoutMs)` — одноразове виконання після затримки у `timeoutMs` мілісекунд.

---

## Динамічне керування завданнями {#dynamic-management}

Ви можете впровадити `SchedulerRegistry` у свої сервіси або контролери для динамічного пошуку, запуску, зупинки чи видалення зареєстрованих завдань:

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
