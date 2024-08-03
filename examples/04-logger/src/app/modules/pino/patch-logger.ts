import { Logger, LoggerConfig, InputLogLevel, OutputLogLevel, methodFactory, optional } from '@ditsmod/core';
import pino from 'pino';

export class PatchLogger {
  @methodFactory()
  patchLogger(@optional() config: LoggerConfig = new LoggerConfig()) {
    const logger = pino.default({ customLevels: { off: 100, all: 0 } });
    logger.level = config.level;

    // Logger must have `log` method.
    (logger as unknown as Logger).log = (level: InputLogLevel, ...args: any[]) => {
      const [arg1, ...rest] = args;
      logger[level](arg1, ...rest);
    };

    // Logger must have `setLevel` method.
    (logger as unknown as Logger).setLevel = (value: OutputLogLevel) => {
      logger.level = value;
    };

    // Logger must have `getLevel` method.
    (logger as unknown as Logger).getLevel = () => {
      return logger.level as OutputLogLevel;
    };

    return logger;
  }
}
