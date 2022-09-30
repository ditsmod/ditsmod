import { Logger, LoggerConfig, LogLevel } from '@ditsmod/core';
import { createLogger, addColors, format, transports } from 'winston';

export function patchLogger(config: LoggerConfig) {
  const logger = createLogger();

  const transport = new transports.Console({
    format: format.combine(format.colorize(), format.simple()),
  });

  const customLevels = {
    levels: {
      fatal: 1,
      error: 2,
      warn: 3,
      info: 4,
      debug: 5,
      trace: 6,
    },
    colors: {
      fatal: 'red',
      error: 'yellow',
      debug: 'green',
      info: 'blue',
      trace: 'grey',
    },
  };

  logger.configure({
    levels: customLevels.levels,
    level: config.level,
    transports: [transport],
  });

  // Logger must have `setLevel` method.
  (logger as unknown as Logger).setLevel = (value: LogLevel) => {
    logger.level = value;
  };

  // Logger must have `getLevel` method.
  (logger as unknown as Logger).getLevel = () => {
    return logger.level as LogLevel;
  };

  addColors(customLevels.colors);

  return logger;
}
