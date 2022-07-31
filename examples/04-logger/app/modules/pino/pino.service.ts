import { Injectable } from '@ts-stack/di';
import { Logger, LoggerConfig } from '@ditsmod/core';
import pino = require('pino');

@Injectable()
export class PinoService extends Logger {
  constructor(config: LoggerConfig) {
    super();
    this.init(config);
  }

  protected init(config: LoggerConfig) {
    const logger = pino();
    logger.level = config.level;
    this.log = (level: keyof Logger, ...args: any[]) => {
      const [arg1, ...rest] = args;
      logger[level](arg1, ...rest);
    };
  }
}
