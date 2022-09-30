import { Logger, LoggerConfig, LogLevel } from '@ditsmod/core';
import pino from 'pino';

export function patchLogger(config: LoggerConfig) {
  const logger = pino();
  logger.level = config.level;

  // Logger must have `log` method.
  (logger as unknown as Logger).log = (level: string, ...args: any[]) => {
    const [arg1, ...rest] = args;
    logger[level](arg1, ...rest);
  };

  // Logger must have `setLevel` method.
  (logger as unknown as Logger).setLevel = (value: LogLevel) => {
    logger.level = value;
  };

  // Logger must have `getLevel` method.
  (logger as unknown as Logger).getLevel = () => {
    return logger.level as LogLevel;
  };

  return logger;
}
