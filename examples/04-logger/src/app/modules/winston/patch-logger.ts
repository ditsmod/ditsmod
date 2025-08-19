import { BaseAppOptions, Logger, LoggerConfig, OutputLogLevel, factoryMethod, optional } from '@ditsmod/core';
import { createLogger, addColors, format, transports } from 'winston';

export class PatchLogger {
  @factoryMethod()
  patchLogger(
    @optional() config: LoggerConfig = new LoggerConfig(),
    @optional() appOptions: BaseAppOptions = new BaseAppOptions(),
  ) {
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
      level: appOptions.level || config.level,
      transports: [transport],
    });

    // Logger must have `setLevel` method.
    (logger as unknown as Logger).setLevel = (value: OutputLogLevel) => {
      logger.level = appOptions.level || value;
    };

    // Logger must have `getLevel` method.
    (logger as unknown as Logger).getLevel = () => {
      return appOptions.level || (logger.level as OutputLogLevel);
    };

    addColors(customLevels.colors);

    return logger;
  }
}
