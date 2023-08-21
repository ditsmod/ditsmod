import { Logger, LoggerConfig, LogLevel, methodFactory, MethodLogLevel } from '@ditsmod/core';
import { createLogger, LogLevel as BunyanLogLevel } from 'bunyan';

export class PatchLogger {
  @methodFactory()
  patchLogger(config: LoggerConfig) {
    const logger = createLogger({ name: 'bunyan-test' });
    logger.level(config.level as BunyanLogLevel);

    // Logger must have `log` method.
    (logger as unknown as Logger).log = (level: MethodLogLevel, ...args: any[]) => {
      const [arg1, ...rest] = args;
      (logger as unknown as Logger)[level](arg1, ...rest);
    };

    // Logger must have `setLevel` method.
    (logger as unknown as Logger).setLevel = (value: LogLevel) => {
      logger.level(value as BunyanLogLevel);
    };

    // Logger must have `getLevel` method.
    (logger as unknown as Logger).getLevel = () => {
      const bunyanLevels: { level: number; name: LogLevel }[] = [
        { level: 0, name: 'all' },
        { level: 10, name: 'trace' },
        { level: 20, name: 'debug' },
        { level: 30, name: 'info' },
        { level: 40, name: 'warn' },
        { level: 50, name: 'error' },
        { level: 60, name: 'fatal' },
        { level: 100, name: 'off' },
      ];
      const levelNumber = logger.level();
      const levelName = bunyanLevels.find((i) => i.level == levelNumber)?.name || config.level;
      return levelName;
    };

    return logger;
  }
}
