import { Logger, LoggerConfig, LogLevel, Module } from '@ditsmod/core';
import pino from 'pino';

import { PinoController } from './pino.controller';

const logger = pino();

@Module({
  controllers: [PinoController],
  providersPerMod: [{ provide: Logger, useValue: logger }],
})
export class PinoModule {
  constructor(config: LoggerConfig) {
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
  }
}
