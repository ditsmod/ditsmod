---
sidebar_position: 8
---

# Logger

Ditsmod використовує клас [Logger][100] у якості інтерфейсу, а також як DI-токен. Для записування логів, по-дефолту використовується [ConsoleLogger][101]. Усього є 8 рівнів логування (запозичено у [log4j][102]):

- `off` - жодні логи не пишуться. Призначений для тестування, його не рекомендується використовувати в продуктовому режимі.
- `fatal` - фатальна подія, яка перешкоджає продовженню роботи програми.
- `error` - помилка в застосунку, яку можна виправити.
- `warn` - подія, яка може призвести до помилки.
- `info` - подія з інформаційною метою.
- `debug` - загальна подія зневадження.
- `trace` - детальне повідомлення про зневадження, яке зазвичай фіксує потік через програму.
- `all` - усі події повинні реєструватися.

Якщо ви хочете щоб системні логи, які пише Ditsmod, писались вашим власним логером, він повинен впроваджувати інтерфейс [Logger][100]. Після чого його можна передавати до DI на рівні застосунку:

```ts
import { Logger, rootModule } from '@ditsmod/core';
import { MyLogger } from './my-loggegr.js';

@rootModule({
  // ...
  providersPerApp: [
    { token: Logger, useClass: MyLogger }
  ],
})
export class AppModule {}
```

Але, швидше за все, ви захочете використовувати якийсь вже готовий, широко-відомий логер. І велика ймовірність, що його інтерфейс відрізняється від інтерфейсу [Logger][100]. Але, як правило, це теж не проблема, бо перед передачою інстанса логера до DI, його можна пропатчити таким чином, щоб він впроваджував необхідний інтерфейс. Для цього використовується провайдер з властивістю `useFactory`.

Давайте спочатку напишемо код для цього провайдера. На даний момент (2023-09-02), одним із самих популярних серед Node.js-логерів є [winston][103]. Для патчінгу ми написали метод класу, перед яким додали декоратор `methodFactory`:

```ts {42-44,47-49}
import { Logger, LoggerConfig, OutputLogLevel, methodFactory } from '@ditsmod/core';
import { createLogger, addColors, format, transports } from 'winston';

export class PatchLogger {
  @methodFactory()
  patchLogger(config: LoggerConfig) {
    const logger = createLogger();

    const transport = new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    });

    const customLevels = {
      levels: {
        off: 0,
        fatal: 1,
        error: 2,
        warn: 3,
        info: 4,
        debug: 5,
        trace: 6,
        all: 7,
      },
      colors: {
        fatal: 'red',
        error: 'brown',
        warn: 'yellow',
        info: 'blue',
        debug: 'green',
        trace: 'grey',
        all: 'grey',
      },
    };

    logger.configure({
      levels: customLevels.levels,
      level: config.level,
      transports: [transport],
    });

    // Logger must have `mergeConfig` method.
    (logger as unknown as Logger).mergeConfig = (config: LoggerConfig) => {
      logger.level = config.level;
    };

    // Logger must have `getConfig` method.
    (logger as unknown as Logger).getConfig = () => {
      return { level: logger.level as OutputLogLevel };
    };

    addColors(customLevels.colors);

    return logger;
  }
}
```

Як бачите, окрім звичних налаштувань для `winston`, у виділених рядках до його інстансу додаються два методи - `mergeConfig` та `getConfig` - які у нього відсутні, але які є необхідними для того, щоб Ditsmod правильно взаємодіяв з ним.

І тепер вже цей клас можна передавати до DI на рівні застосунку:

```ts
import { Logger, rootModule } from '@ditsmod/core';
import { PatchLogger } from './patch-logger.js';

@rootModule({
  // ...
  providersPerApp: [
    { token: Logger, useFactory: [PatchLogger, PatchLogger.prototype.patchLogger] }
  ],
})
export class AppModule {}
```

Готові приклади з логерами ви можете проглянути [в репозиторії Ditsmod][104].

## Робота з логером в продуктовому режимі

Щоб змінити рівень логування в продуктовому режимі (іншими словами - "на продакті"), не обов'язково заходити в скомпільований код. Для цієї мети ви можете створити спеціальний контролер, захистити його ґардом, а потім викликати відповідний роут для зміни рівня логування, який ви вкажете в URL:

```ts
import { AnyObj, controller, inject, Logger, LogLevel, QUERY_PARAMS, Res, route } from '@ditsmod/core';

import { requirePermissions } from '../auth/guards-utils.js';
import { Permission } from '../auth/types.js';

@controller()
export class SomeController {
  @route('GET', 'set-loglevel', [requirePermissions(Permission.canSetLogLevel)])
  setLogLevel(@inject(QUERY_PARAMS) queryParams: AnyObj, logger: Logger, res: Res) {
    const level = queryParams.logLevel as LogLevel;
    try {
      logger.mergeConfig({ level });
      res.send('Setting logLevel successful!');
    } catch (error: any) {
      res.send(`Setting logLevel is failed: ${error.message}`);
    }
  }
}
```

Як бачите, тут створюється роут `/set-loglevel`, із захистом через ґард, який перевіряє права на таку дію. Тут використовується `requirePermissions()`, про який ви можете прочитати у розділі [Хелпери для ґардів з параметрами][1].





[1]: /components-of-ditsmod-app/guards#хелпери-для-ґардів-з-параметрами

[100]: https://github.com/ditsmod/ditsmod/blob/core-2.47.0/packages/core/src/types/logger.ts#L40
[101]: https://github.com/ditsmod/ditsmod/blob/core-2.47.0/packages/core/src/services/console-logger.ts
[102]: https://logging.apache.org/log4j/2.x/log4j-api/apidocs/org/apache/logging/log4j/Level.html
[103]: https://github.com/winstonjs/winston
[104]: https://github.com/ditsmod/ditsmod/tree/core-2.47.0/examples/04-logger/src/app/modules
