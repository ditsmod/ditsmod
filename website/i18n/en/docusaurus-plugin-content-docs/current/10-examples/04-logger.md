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
import { LoggerConfig, Providers } from '@ditsmod/core';

// ...
  providersPerMod: [
    ...new Providers().useLogConfig({ level: 'trace' })
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

Note that `BunyanLogger` is actually a **class**, not an interface or anonymous function, because DI would not work with an interface or anonymous function. But in order for DI to issue the corresponding logger using the `BunyanLogger` token, the following settings can be made in the module:

```ts
import { createLogger } from 'bunyan';

const logger = createLogger({ name: 'bunyan-test' });
  // ...
  providersPerMod: [
    { token: Logger, useValue: logger },
    { token: BunyanLogger, useToken: Logger }
  ],
  // ...
```

In essence, an object with the `useToken` property says: "When the DI is queried for a provider by the `BunyanLogger` token, the corresponding value must be searched for by the `Logger` token." That is, in fact, the second element of the array refers to the first element of the array.

You can read more about `useToken` in [documentation @ts-stack/di][8].

Let's go further. At this stage of configuration, in any controller within a `BunyanModule`, a `bunyan` instance can be issued by both a `Logger` token and a `BunyanLogger` token. By the way, it could be done more simply, instead of two instructions for DI, you could pass one instruction:

```ts
import { createLogger } from 'bunyan';

const logger = createLogger({ name: 'bunyan-test' });
  // ...
  providersPerMod: [
    { token: BunyanLogger, useValue: logger },
  ],
  // ...
```

In this case, within the limits of `BunyanModule`, DI would issue `ConsoleLogger` on the `Logger` token, and a native instance of `bunyan` would issue on the `BunyanLogger` token. This is a slightly worse option, because under the hood Ditsmod uses the `Logger` token to work with the logger, so all syslogs will be written using `ConsoleLogger`, which in most cases is only suitable for development, not for production mode.

Let's go back to our previous (correct) setup where a `bunyan` instance can be issued by both a `Logger` token and a `BunyanLogger` token. Now it remains for us to make the `bunyan` instance compatible with the `Logger` class interface, that is, we need to add `log()`, `getLevel()` and `setLevel()` methods to the `bunyan` instance. This is best done in a separate `patchLogger()` function, which can then be passed to DI:

```ts
import { Logger, LoggerConfig, featureModule } from '@ditsmod/core';
import BunyanLogger from 'bunyan';

import { patchLogger } from './patch-logger';

@featureModule({
  // ...
  providersPerMod: [
    { token: Logger, useFactory: patchLogger, deps: [LoggerConfig] }
    { token: BunyanLogger, useToken: Logger }
  ],
})
export class BunyanModule {}
```

DI will call `patchLogger()` on the first `Logger` request and pass the `LoggerConfig` instance (which we specified in the `deps` array as a dependency) as the first argument.

## PinoModule

In Ditsmod, the [pino][7] logger is configured similarly to `bunyan`, except for the token for DI. The fact is that currently the `pino` library only has an interface for its logger, and for DI it would be better to have a class instead of an interface. Therefore, we cannot use the [useToken][8] property on the provider object. In this case, you need to use `@inject` in the constructor of the controller or service:

```ts
import { inject } from '@ditsmod/core';
import { Logger } from '@ditsmod/core';
import { BaseLogger as PinoLogger } from 'pino';
// ...
  constructor(@inject(Logger) private logger: PinoLogger) {}
```

Note that `LoggerConfig` is not passed to `PinoModule` and `BunyanModule` for DI, so these modules will default to the information output level (`info`).

## WinstonModule

In this Ditsmod application, the [winston][5] logger is configured similarly to `pino`, but `winston` has additional settings. Also, by setting `LoggerConfig`, within `WinstonModule`, the output level will be changed to `debug`.

[5]: https://github.com/winstonjs/winston
[6]: https://github.com/trentm/node-bunyan
[7]: https://github.com/pinojs/pino
[8]: https://ts-stack.github.io/di/en/#useexisting
