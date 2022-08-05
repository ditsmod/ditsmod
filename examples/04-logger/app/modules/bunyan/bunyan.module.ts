import { Logger, LoggerConfig, LogLevels, Module } from '@ditsmod/core';
import BunyanLogger, { createLogger, LogLevel, LogLevelString } from 'bunyan';

import { BunyanController } from './bunyan.controller';

const logger = createLogger({ name: 'bunyan-test' });

@Module({
  controllers: [BunyanController],
  providersPerMod: [
    { provide: Logger, useValue: logger },
    { provide: BunyanLogger, useExisting: Logger }
  ],
})
export class BunyanModule {
  constructor(config: LoggerConfig) {
    logger.level(config.level as LogLevel);

    // Logger must have `log` method.
    (logger as unknown as Logger).log = (level: LogLevelString, ...args: any[]) => {
      const [arg1, ...rest] = args;
      logger[level](arg1, ...rest);
    };


    // Logger must have `setLevel` method.
    (logger as unknown as Logger).setLevel = (value: LogLevels) => {
      logger.level(value);
    };
  }
}
