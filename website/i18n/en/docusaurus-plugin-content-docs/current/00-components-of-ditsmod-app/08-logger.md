---
sidebar_position: 8
---

# Logger

The logging level can be set by passing a provider with the `LoggerConfig` token:

```ts {5}
import { rootModule } from '@ditsmod/core';
// ...
@rootModule({
  // ...
  providersPerApp: [{ token: LoggerConfig, useValue: { level: 'info' } }],
})
export class AppModule {}
```

However, better type support is provided by the `Providers` helper:

```ts {5}
import { rootModule, Providers } from '@ditsmod/core';
// ...
@rootModule({
  // ...
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
```

As you can see, `LoggerConfig` is provided at the application level. If you need a different logging level in a specific module, you should provide both the logging configuration and a provider with the `Logger` token:

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

Please note that these providers are passed at the module level.

Ditsmod uses the [Logger][100] class as an interface as well as a DI token. By default, [ConsoleLogger][101] is used for logging. There are 8 logging levels in total (borrowed from [log4j][102]):

- `all`- All events should be logged.
- `trace` - A fine-grained debug message, typically capturing the flow through the application.
- `debug` - A general debugging event.
- `info` - An event for informational purposes.
- `warn` - An event that might possible lead to an error.
- `error` - An error in the application, possibly recoverable.
- `fatal` - A fatal event that will prevent the application from continuing.
- `off` - No events will be logged. Intended for testing, it is not recommended to use it in product mode.

In this documentation, when we talk about "logging levels", we mean "log level of detail". The highest level of detail is `all`, the lowest level of detail is `off`.

Sometimes in this documentation, or in the Ditsmod system messages, you may come across two types indicating the logging level:

- **InputLogLevel** - this type indicates the log level intended for a specific message. For example, the following entry uses the log level - `info`:
  ```ts
  logger.log('info', 'some message');
  ```
- **OutputLogLevel** - this type indicates the limit level of logs above which messages are ignored. For example, the following entry sets the logging level to `debug`:
  ```ts
  logger.setLevel('debug');
  ```

If `InputLogLevel` is equal to or lower than `OutputLogLevel`, the message is writed by the logger, otherwise it is ignored. For example, the following combination will write a message:

```ts
logger.setLevel('debug');
logger.log('info', 'some message');
```

And in the following - it will be ignored:

```ts
logger.setLevel('warn');
logger.log('info', 'some message');
```

## Substitution the system logger {#substitution-the-system-logger}

If you want the system logs written by Ditsmod to be written by your own logger, it must implement the [Logger][100] interface. It can then be passed to DI at the application level:

```ts
import { Logger, rootModule } from '@ditsmod/core';
import { MyLogger } from './my-loggegr.js';

@rootModule({
  // ...
  providersPerApp: [{ token: Logger, useClass: MyLogger }],
})
export class AppModule {}
```

But, most likely, you will want to use some ready-made, well-known logger. And there is a good chance that its interface is different from that of [Logger][100]. But, as a rule, this is also not a problem, because before transferring the logger instance to DI, it can be patched so that it implements the necessary interface. For this, a provider with the `useFactory` property is used.

Let's write the code for this provider first. At the moment (2023-09-02), one of the most popular Node.js loggers is [winston][103]. For patching, we wrote a class method before which we added the `factoryMethod` decorator:

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

As you can see, in addition to the usual settings for `winston`, the highlighted lines add two methods to his instance - `setLevel` and `getLevel` - which it does not have, but which are necessary for Ditsmod to interact with it properly.

And now this class can be passed to DI at the application level:

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

You can view finished examples with loggers [in the Ditsmod repository][104].

## Using the logger in production mode {#using-the-logger-in-production-mode}

To change the logging level in production mode, you do not need to change the compiled code. You can create a custom controller, guard it, and then call the appropriate route to change the logging level that you specify in the URL:

```ts
import { AnyObj, inject, Logger, InputLogLevel } from '@ditsmod/core';
import { route, QUERY_PARAMS, Res, controller } from '@ditsmod/rest';

import { requirePermissions } from '../auth/guards-utils.js';
import { Permission } from '../auth/types.js';

@controller()
export class SomeController {
  @route('GET', 'set-loglevel', [requirePermissions(Permission.canSetLogLevel)])
  setLogLevel(@inject(QUERY_PARAMS) queryParams: AnyObj, logger: Logger, res: Res) {
    const level = queryParams.logLevel as InputLogLevel;
    try {
      logger.setLevel(level);
      res.send('Setting logLevel successful!');
    } catch (error: any) {
      res.send(`Setting logLevel is failed: ${error.message}`);
    }
  }
}
```

As you can see, the route path `/set-loglevel` is created here, with protection through a guard that checks the permissions for such an action. This uses `requirePermissions()`, which you can read about in [Helpers for guards with parameters][1].





[1]: /components-of-ditsmod-app/guards#helpers-for-guards-with-parameters

[100]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/src/logger/logger.ts
[101]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/src/logger/console-logger.ts
[102]: https://logging.apache.org/log4j/2.x/log4j-api/apidocs/org/apache/logging/log4j/Level.html
[103]: https://github.com/winstonjs/winston
[104]: https://github.com/ditsmod/ditsmod/tree/core-2.54.0/examples/04-logger/src/app/modules
