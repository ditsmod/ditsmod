import { Injectable } from '@ts-stack/di';
import { Logger, LoggerConfig } from '@ditsmod/core';
import pino = require('pino');

import { getNamedLogggerMethod } from '../../utils/get-named-logger-method';
import { getLogMethod } from '../../utils/get-log-method';

const logger = pino();

@Injectable()
export class PinoService implements Logger {
  private logger: pino.Logger;

  constructor(config: LoggerConfig) {
    this.logger = logger;
    this.logger.level = config.level;
    this.logger.log = getLogMethod.bind(this);
  }

  fatal = getNamedLogggerMethod.call(this, 'fatal');
  error = getNamedLogggerMethod.call(this, 'error');
  warn = getNamedLogggerMethod.call(this, 'warn');
  info = getNamedLogggerMethod.call(this, 'info');
  debug = getNamedLogggerMethod.call(this, 'debug');
  trace = getNamedLogggerMethod.call(this, 'trace');
}
