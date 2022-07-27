import { Injectable } from '@ts-stack/di';
import { Logger, LoggerConfig } from '@ditsmod/core';
import { LogLevel } from 'bunyan';
import bunyan = require('bunyan');

import { setCustomLogger } from '../../utils/set-custom-logger';

@Injectable()
export class BunyanService extends Logger {
  constructor(config: LoggerConfig) {
    super();
    this.init(config);
  }

  protected init(config: LoggerConfig) {
    const logger: Logger = bunyan.createLogger({ name: 'bunyan-test', level: config.level as LogLevel }) as any;
    setCustomLogger(config, this, logger);
  }
}
