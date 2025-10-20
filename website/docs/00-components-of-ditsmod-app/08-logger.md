---
sidebar_position: 8
---

# Logger

Встановити рівень логування можна за допомогою передачі провайдера, що має токен `LoggerConfig`:

```ts {5}
import { rootModule } from '@ditsmod/core';
// ...
@rootModule({
  // ...
  providersPerApp: [{ token: LoggerConfig, useValue: { level: 'info' } }],
})
export class AppModule {}
```

Але кращу підтримку типів має хелпер `Providers`:

```ts {5}
import { rootModule, Providers } from '@ditsmod/core';
// ...
@rootModule({
  // ...
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
```

Як бачите, тут `LoggerConfig` передається на рівні застосунку. Якщо вам потрібно щоб у певному модулі діяв інший рівень логування, разом з конфігом для логування необхідно передавати й провайдер з токеном `Logger`:

```ts {7-9}
import { Logger, Providers } from '@ditsmod/core';
import { restModule } from '@ditsmod/rest';
import { PatchLogger } from './patch-logger.js';
// ...
@restModule({
  // ...
  providersPerMod: new Providers()
    .useFactory(Logger, [PatchLogger, PatchLogger.prototype.patchLogger])
    .useLogConfig({ level: 'debug' }),
})
export class SomeModule {}
```

Зверніть увагу, що ці провайдери передаються на рівні модуля.

Ditsmod використовує клас [Logger][100] у якості інтерфейсу, а також як DI-токен. Для записування логів, по-дефолту використовується [ConsoleLogger][101]. Усього є 8 рівнів логування (запозичено у [log4j][102]):

- `all` - усі події повинні реєструватися.
- `trace` - детальне повідомлення про зневадження, яке зазвичай фіксує потік через програму.
- `debug` - загальна подія зневадження.
- `info` - подія з інформаційною метою.
- `warn` - подія, яка може призвести до помилки.
- `error` - помилка в застосунку, яку можна виправити.
- `fatal` - фатальна подія, яка перешкоджає продовженню роботи програми.
- `off` - жодні логи не пишуться. Призначений для тестування, його не рекомендується використовувати в продуктовому режимі.

У цій документації, коли ми кажемо про "рівні логування", ми маємо на увазі "рівень деталізації логів". Найвищий рівень деталізації - `all`, найнижчий рівень деталізації - `off`.

Інколи в документації, або у системних повідомленнях Ditsmod, ви можете зустріти два типи, що позначають рівень логування:

- **InputLogLevel** - цим типом позначають рівень логів, що призначений для конкретного повідомлення. Наприклад, у наступному записі використовується рівень логів - `info`:
  ```ts
  logger.log('info', 'some message');
  ```
- **OutputLogLevel** - цим типом позначають граничний рівень логів, вище якого повідомлення ігноруються. Наприклад, у наступному записі встановлюється рівень логів `debug`:
  ```ts
  logger.setLevel('debug');
  ```

Якщо `InputLogLevel` є рівним або нижчим від `OutputLogLevel`, то повідомлення записується логером, в противному разі - ігнорується. Наприклад, у наступній комбінації повідомлення запишеться:

```ts
logger.setLevel('debug');
logger.log('info', 'some message');
```

А в наступному - буде проігнороване:

```ts
logger.setLevel('warn');
logger.log('info', 'some message');
```

## Підміна системного логера {#substitution-the-system-logger}

Якщо ви хочете щоб системні логи, які пише Ditsmod, писались вашим власним логером, він повинен впроваджувати інтерфейс [Logger][100]. Після чого його можна передавати до DI на рівні застосунку:

```ts
import { Logger, rootModule } from '@ditsmod/core';
import { MyLogger } from './my-loggegr.js';

@rootModule({
  // ...
  providersPerApp: [{ token: Logger, useClass: MyLogger }],
})
export class AppModule {}
```

Але, швидше за все, ви захочете використовувати якийсь вже готовий, широко-відомий логер. І велика ймовірність, що його інтерфейс відрізняється від інтерфейсу [Logger][100]. Але, як правило, це теж не проблема, бо перед передачою інстанса логера до DI, його можна пропатчити таким чином, щоб він впроваджував необхідний інтерфейс. Для цього використовується провайдер з властивістю `useFactory`.

Давайте спочатку напишемо код для цього провайдера. На даний момент (2023-09-02), одним із самих популярних серед Node.js-логерів є [winston][103]. Для патчінгу ми написали метод класу, перед яким додали декоратор `factoryMethod`:

```ts {42-44,47-49}
import { Logger, LoggerConfig, OutputLogLevel, factoryMethod, optional } from '@ditsmod/core';
import { createLogger, addColors, format, transports } from 'winston';

export class PatchLogger {
  @factoryMethod()
  patchLogger(@optional() config: LoggerConfig = new LoggerConfig()) {
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

    // Logger must have `setLevel` method.
    (logger as unknown as Logger).setLevel = (value: OutputLogLevel) => {
      logger.level = value;
    };

    // Logger must have `getLevel` method.
    (logger as unknown as Logger).getLevel = () => {
      return logger.level as OutputLogLevel;
    };

    addColors(customLevels.colors);

    return logger;
  }
}
```

Як бачите, окрім звичних налаштувань для `winston`, у виділених рядках до його інстансу додаються два методи - `setLevel` та `getLevel` - які у нього відсутні, але які є необхідними для того, щоб Ditsmod правильно взаємодіяв з ним.

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

## Робота з логером в продуктовому режимі {#using-the-logger-in-production-mode}

Щоб змінити рівень логування в продуктовому режимі (іншими словами - "на продакті"), не обов'язково заходити в скомпільований код. Для цієї мети ви можете створити спеціальний контролер, захистити його ґардом, а потім викликати відповідний роут для зміни рівня логування, який ви вкажете в URL:

```ts
import { AnyObj, controller, inject, Logger, LogLevel, QUERY_PARAMS, Res } from '@ditsmod/core';
import { route } from '@ditsmod/rest';

import { requirePermissions } from '../auth/guards-utils.js';
import { Permission } from '../auth/types.js';

@controller()
export class SomeController {
  @route('GET', 'set-loglevel', [requirePermissions(Permission.canSetLogLevel)])
  setLogLevel(@inject(QUERY_PARAMS) queryParams: AnyObj, logger: Logger, res: Res) {
    const level = queryParams.logLevel as LogLevel;
    try {
      logger.setLevel(level);
      res.send('Setting logLevel successful!');
    } catch (error: any) {
      res.send(`Setting logLevel is failed: ${error.message}`);
    }
  }
}
```

Як бачите, тут створюється роут `/set-loglevel`, із захистом через ґард, який перевіряє права на таку дію. Тут використовується `requirePermissions()`, про який ви можете прочитати у розділі [Хелпери для ґардів з параметрами][1].





[1]: /components-of-ditsmod-app/guards#helpers-for-guards-with-parameters

[100]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/src/logger/logger.ts
[101]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/src/logger/console-logger.ts
[102]: https://logging.apache.org/log4j/2.x/log4j-api/apidocs/org/apache/logging/log4j/Level.html
[103]: https://github.com/winstonjs/winston
[104]: https://github.com/ditsmod/ditsmod/tree/core-2.54.0/examples/04-logger/src/app/modules
