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

However, better type support is provided by the [ProviderBuilder][2] helper:

```ts {5}
import { rootModule, ProviderBuilder, LoggerConfig } from '@ditsmod/core';
// ...
@rootModule({
  // ...
  providersPerApp: new ProviderBuilder().useValue(LoggerConfig, { level: 'info' }),
})
export class AppModule {}
```

As you can see, `LoggerConfig` is provided at the application level. If you need a different logging level in a specific module, you should provide both the logging configuration and a provider with the `Logger` token:

```ts {7-9}
import { Logger, ProviderBuilder } from '@ditsmod/core';
import { restModule } from '@ditsmod/rest';
import { PatchLogger } from './patch-logger.js';
// ...
@restModule({
  // ...
  providersPerMod: new ProviderBuilder()
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

In this documentation, when we talk about "log levels", we mean the "level of log detail". The highest level of detail is `all`, and the lowest level of detail is `off`.

In Ditsmod system messages, you may encounter two types that denote the log level:

- **InputLogLevel** - this type denotes the log level assigned to a specific message. Note that the `off` level is not present in `InputLogLevel`. For example, in the following entry, the log level `info` is used:
  ```ts
  logger.log('info', 'some message');
  ```
- **OutputLogLevel** - this type is used to set the upper level in the log filter. The logger will record all logs whose level is equal to or lower than the configured `OutputLogLevel`. For example, in the following entry, the log level `debug` is set:
  ```ts
  logger.setLevel('debug');
  ```

In other words, the `InputLogLevel` type is used to set the level of a specific message, while the `OutputLogLevel` type is used to filter all messages depending on their level. For example:

```ts
logger.setLevel('debug');
logger.log('info', 'some message');
```

As you can see in the first line, using `OutputLogLevel`, the maximum level of message detail is limited to `debug`. Thus, messages with detail levels `debug`, `info`, `warn`, `error`, or `fatal` will be recorded by the logger. In this example, the detail level is `info`, so the logger will record it.

Now let us look at a case where the message "filter" allows only messages with a detail level of `warn` or higher:

```ts
logger.setLevel('warn');
logger.log('info', 'some message');
```

In this case, the logger will not record anything, because the log filter is set to `warn`, while the `InputLogLevel` is set to `info`.

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

But, most likely, you will want to use some ready-made, well-known logger. And there is a good chance that its interface is different from that of [Logger][100]. However, as a rule, this is not a problem either, because before passing the logger instance to DI, it can be patched using a `FactoryProvider` in such a way that it implements the required interface.

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
import { AnyObj, ctx, Logger, InputLogLevel } from '@ditsmod/core';
import { route, QUERY_PARAMS, RequestContext, controller } from '@ditsmod/rest';

import { requirePermissions } from '../auth/guards-utils.js';
import { Permission } from '../auth/types.js';

@controller()
export class SomeController {
  @route('GET', 'set-loglevel', [requirePermissions(Permission.canSetLogLevel)])
  setLogLevel(@ctx(QUERY_PARAMS) queryParams: AnyObj, logger: Logger, ctx: RequestContext) {
    const level = queryParams.logLevel as InputLogLevel;
    try {
      logger.setLevel(level);
      ctx.send('Setting logLevel successful!');
    } catch (error: any) {
      ctx.send(`Setting logLevel is failed: ${error.message}`);
    }
  }
}
```

As you can see, the route path `/set-loglevel` is created here, with protection through a guard that checks the permissions for such an action. This uses `requirePermissions()`, which you can read about in [Helpers for guards with parameters][1].





[1]: /rest-application/guards#helpers-for-guards-with-parameters
[2]: /basic-components/providers-helper/

[100]: https://github.com/ditsmod/ditsmod/blob/3.0.0-next.15/packages/core/src/logger/logger.ts
[101]: https://github.com/ditsmod/ditsmod/blob/3.0.0-next.15/packages/core/src/logger/console-logger.ts
[102]: https://logging.apache.org/log4j/2.x/log4j-api/apidocs/org/apache/logging/log4j/Level.html
[103]: https://github.com/winstonjs/winston
[104]: https://github.com/ditsmod/ditsmod/tree/3.0.0-next.15/examples/04-logger/src/app/modules
