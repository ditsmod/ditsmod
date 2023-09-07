import { Logger, LoggerConfig, InputLogLevel, OutputLogLevel, methodFactory } from '@ditsmod/core';
import pino = require('pino');

export class PatchLogger {
  @methodFactory()
  patchLogger(config: LoggerConfig) {
    const logger = pino.default({ customLevels: { off: 100, all: 0 } });
    logger.level = config.level;

    // Logger must have `log` method.
    (logger as unknown as Logger).log = (level: InputLogLevel, ...args: any[]) => {
      const [arg1, ...rest] = args;
      (logger as unknown as Logger).log(level, arg1, ...rest);
    };

    // Logger must have `mergeConfig` method.
    (logger as unknown as Logger).mergeConfig = (config: LoggerConfig) => {
      logger.level = config.level;
    };

    // Logger must have `getConfig` method.
    (logger as unknown as Logger).getConfig = () => {
      return { level: logger.level as OutputLogLevel };
    };

    return logger;
  }
}
