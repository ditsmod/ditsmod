import {
  Logger,
  LoggerConfig,
  InputLogLevel,
  OutputLogLevel,
  factoryMethod,
  optional,
  BaseAppOptions,
} from '@ditsmod/core';
import { createLogger, LogLevel as BunyanLogLevel } from 'bunyan';
import * as BunyanLogger from 'bunyan';

export class PatchLogger {
  @factoryMethod()
  patchLogger(
    @optional() config: LoggerConfig = new LoggerConfig(),
    @optional() appOptions: BaseAppOptions = new BaseAppOptions(),
  ) {
    const logger = createLogger({ name: 'bunyan-test' });
    this.setLogLeveL(appOptions, logger, config.level);

    // Logger must have `log` method.
    (logger as unknown as Logger).log = (level: InputLogLevel, ...args: any[]) => {
      const [arg1, ...rest] = args;
      (logger as any)[level](arg1, ...rest);
    };

    // Logger must have `setLevel` method.
    (logger as unknown as Logger).setLevel = (value: OutputLogLevel) => {
      this.setLogLeveL(appOptions, logger, value);
    };

    // Logger must have `getLevel` method.
    (logger as unknown as Logger).getLevel = () => {
      const bunyanLevels: { level: number; name: OutputLogLevel }[] = [
        { level: 0, name: 'all' },
        { level: 10, name: 'trace' },
        { level: 20, name: 'debug' },
        { level: 30, name: 'info' },
        { level: 40, name: 'warn' },
        { level: 50, name: 'error' },
        { level: 60, name: 'fatal' },
        { level: 100, name: 'off' },
      ];
      const levelNumber = appOptions.loggerConfig?.level || logger.level();
      const levelName = bunyanLevels.find((i) => i.level == levelNumber)?.name || config.level || 'info';
      return levelName;
    };

    return logger;
  }

  protected setLogLeveL(appOptions: BaseAppOptions, logger: BunyanLogger, logLevel?: OutputLogLevel) {
    const level = appOptions.loggerConfig?.level || logLevel;
    if (level == 'off') {
      logger.level(100);
    } else if (level == 'all') {
      logger.level(0);
    } else {
      logger.level(level as BunyanLogLevel);
    }
  }
}
