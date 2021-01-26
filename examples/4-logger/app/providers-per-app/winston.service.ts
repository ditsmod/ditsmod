import { Injectable } from '@ts-stack/di';
import { Logger, LoggerConfig } from '@ts-stack/ditsmod';
import winston = require('winston');

import { getNamedLogggerMethod } from '../utils/get-named-logger-method';

@Injectable()
export class WinstonService implements Logger {
  private logger: winston.Logger;

  constructor(private config: LoggerConfig) {
    const transports = [
      new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      }),
    ];

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

    winston.addColors(customLevels.colors);

    this.logger = winston.createLogger({
      levels: customLevels.levels,
      level: config.level,
      transports,
    });
  }

  fatal = getNamedLogggerMethod.call(this, 'fatal');
  error = getNamedLogggerMethod.call(this, 'error');
  warn = getNamedLogggerMethod.call(this, 'warn');
  info = getNamedLogggerMethod.call(this, 'info');
  debug = getNamedLogggerMethod.call(this, 'debug');
  trace = getNamedLogggerMethod.call(this, 'trace');
}
