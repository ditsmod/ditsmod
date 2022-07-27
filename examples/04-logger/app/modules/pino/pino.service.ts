import { Injectable } from '@ts-stack/di';
import { Logger, LoggerConfig } from '@ditsmod/core';
import pino = require('pino');

import { setCustomLogger } from '../../utils/set-custom-logger';

@Injectable()
export class PinoService extends Logger {
  constructor(config: LoggerConfig) {
    super();
    this.init(config);
  }

  protected init(config: LoggerConfig) {
    const logger = pino();
    logger.level = config.level;
    setCustomLogger(config, this, logger);
  }
}
