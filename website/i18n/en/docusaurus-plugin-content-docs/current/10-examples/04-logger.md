# 04-logger

To try this example, you should first [prepare the prerequisite][1].

This example shows:
- how can you have several different loggers in one application at the same time;
- how to configure each of the loggers for compatibility with Ditsmod;
- how to set different log levels for the application or separately for the module.

Work with the following four loggers is demonstrated:

- `ConsoleLogger` is by default a logger that can be used for application development;
- [bunyan][6];
- [pino][7];
- [winston][5].

In practice, it is unlikely that you will need more than one logger, but in this example it will be useful to look at the operation of the hierarchical DI architecture, the export/import rules of providers, the mechanism for substitute a by default logger and a by default configuration for the logger.

You can run the application from the first terminal:

```bash
yarn start4
```

From the second terminal, check the work:

```bash
curl -isS localhost:3000
curl -isS localhost:3000/pino
curl -isS localhost:3000/winston
curl -isS localhost:3000/bunyan
```

## SomeModule

The easiest way to configure by default the logger that works in `SomeController`:

```ts
import { Logger } from '@ditsmod/core';
// ...
  constructor(private logger: Logger) {}
// ...
}
```

When using `Logger` in the constructor, the by default logger is essentially requested from DI, since there is no substitution for another logger in `SomeModule`. At the same time, `SomeModule` has a substitution for `LoggerConfig` and the log level has been changed:

```ts
import { LoggerConfig } from '@ditsmod/core';
// ...
const loggerConfig = new LoggerConfig('trace');
// ...
  providersPerMod: [
    { provide: LoggerConfig, useValue: loggerConfig }
  ],
  // ...
```

Because of this, all loggers within `SomeModule` will output information at the `trace` level.

## BunyanModule

To request [bunyan][6] in the controller, the class imported from `bunyan` is used by default:

```ts
import BunyanLogger from 'bunyan';
// ...
  constructor(private logger: BunyanLogger) {}
// ...
```

Note that `BunyanLogger` is actually a **class**, not an interface or anonymous function, because DI would not work with an interface or anonymous function.

But in order for DI to issue the corresponding logger using the `BunyanLogger` token, the following settings must be made in the module:

```ts
import { Logger } from '@ditsmod/core';
import { createLogger } from 'bunyan';

const logger = createLogger({ name: 'bunyan-test' });
// ...
  providersPerMod: [
    { provide: Logger, useValue: logger },
    // ...
  ],
// ...
```

As you can see, first a `bunyan` instance is created, then this instance is passed to the `providersPerMod` array using the `Logger` token imported from `@ditsmod/core`. At this stage of configuration, in any constructor within the `BunyanModule`, the `bunyan` instance can be issued by the above-mentioned `Logger` token.

But we can do better, we can issue this instance by a native class that by default is imported from `bunyan`. That is why the second element in the `providersPerMod` array is the object with the property [useExisting][8]:

```ts
  providersPerMod: [
    { provide: Logger, useValue: logger },
    { provide: BunyanLogger, useExisting: Logger }
  ],
```

In essence, an object with the `useExisting` property says: "When the DI is requested for a provider by the `BunyanLogger` token, the corresponding value must be searched for by the `Logger` token." That is, in fact, the second element of the array, in this case, refers to the first element of the array.

You can read more about `useExisting` in [documentation @ts-stack/di][8].

Let's go further. At this stage of configuration, in any controller within a `BunyanModule`, a `bunyan` instance can be issued by both a `Logger` token and a `BunyanLogger` token. By the way, it could be done more simply, instead of two instructions for DI, you could pass one instruction:

```ts
const logger = createLogger({ name: 'bunyan-test' });
  // ...
  providersPerMod: [
    { provide: BunyanLogger, useValue: logger },
  ],
  // ...
```

In this case, within `BunyanModule`, DI would issue `ConsoleLogger` on the `Logger` token, and a native instance of `bunyan` would issue on `BunyanLogger` token. This is a slightly worse option, because under the hood Ditsmod uses the `Logger` token to work with the logger, so all syslogs will be written using `ConsoleLogger`, which in most cases is only suitable for development, not for production mode.

Let's go back to our previous (correct) configuration where a `bunyan` instance can be issued by both a `Logger` token and a `BunyanLogger` token. Now it remains for us to make the `bunyan` instance compatible with the `Logger` class interface. For this, in the module constructor, the `log()` and `setLevel()` methods are added to the `bunyan` instance:

```ts
export class BunyanModule {
  constructor(config: LoggerConfig) {
    logger.level(config.level as LogLevel);

    (logger as unknown as Logger).log = (level: LogLevelString, ...args: any[]) => {
      const [arg1, ...rest] = args;
      logger[level](arg1, ...rest);
    };


    (logger as unknown as Logger).setLevel = (value: LogLevels) => {
      logger.level(value);
    };
  }
}
```

## PinoModule

In Ditsmod, the [pino][7] logger is configured similarly to `bunyan`, except for the token for DI. The fact is that currently the `pino` library only has an interface for its logger, and for DI it would be better to have a class instead of an interface. Therefore, we cannot use the [useExisting][8] property on the provider object. Instead, you will have to use the instruction:

```ts
const logger = pino();
// ...
  providersPerMod: [{ provide: Logger, useValue: logger }],
```

And in the constructor of the controller or service, you need to use `@Inject`:

```ts
import { Inject } from '@ts-stack/di';
import { Logger } from '@ditsmod/core';
import { BaseLogger as PinoLogger } from 'pino';
// ...
  constructor(@Inject(Logger) private logger: PinoLogger) {}
```

Note that `LoggerConfig` is not passed in `PinoModule` and `BunyanModule` for DI, so these modules will default to log level (`info`).

## WinstonModule

In Ditsmod, the [winston][5] logger is configured similarly to `pino`, but `winston` has additional settings. In addition, thanks to the `LoggerConfig` setting, within the `WinstonModule` the log level will be changed to `debug`:

```ts
const loggerConfig = new LoggerConfig('debug');
// ...
  providersPerMod: [
    // ...
    { provide: LoggerConfig, useValue: loggerConfig }
  ],
```

[5]: https://github.com/winstonjs/winston
[6]: https://github.com/trentm/node-bunyan
[7]: https://github.com/pinojs/pino
[8]: https://ts-stack.github.io/di/en/#useexisting
