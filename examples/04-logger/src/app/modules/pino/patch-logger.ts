import {
  Logger,
  LoggerConfig,
  InputLogLevel,
  OutputLogLevel,
  factoryMethod,
  optional,
  BaseAppOptions,
} from '@ditsmod/core';
import pino from 'pino';

export class PatchLogger {
  @factoryMethod()
  patchLogger(
    @optional() config: LoggerConfig = new LoggerConfig(),
    @optional() appOptions: BaseAppOptions = new BaseAppOptions(),
  ) {
    const logger = pino.default({ customLevels: { off: 100, all: 0 } });
    logger.level = appOptions.loggerConfig?.level || config.level || 'info';

    // Logger must have `log` method.
    (logger as unknown as Logger).log = (level: InputLogLevel, ...args: any[]) => {
      const [arg1, ...rest] = args;
      logger[level](arg1, ...rest);
    };

    // Logger must have `setLevel` method.
    (logger as unknown as Logger).setLevel = (value: OutputLogLevel) => {
      logger.level = appOptions.loggerConfig?.level || value;
    };

    // Logger must have `getLevel` method.
    (logger as unknown as Logger).getLevel = () => {
      return appOptions.loggerConfig?.level || (logger.level as OutputLogLevel);
    };

    return logger;
  }
}
