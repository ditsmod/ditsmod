import { Logger, LoggerConfig, LogLevel, methodFactory } from '@ditsmod/core';
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
      return { level: logger.level as LogLevel };
    };

    addColors(customLevels.colors);

    return logger;
  }
}
