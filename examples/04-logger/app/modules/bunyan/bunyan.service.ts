import { Injectable } from '@ts-stack/di';
import { Logger, LoggerConfig } from '@ditsmod/core';
import { LogLevel } from 'bunyan';
import bunyan = require('bunyan');

import { getNamedLogggerMethod } from '../../utils/get-named-logger-method';
import { getLogMethod } from '../../utils/get-log-method';

@Injectable()
export class BunyanService implements Logger {
  private logger: bunyan;

  constructor(private config: LoggerConfig) {
    this.logger = bunyan.createLogger({ name: 'bunyan-test', level: config.level as LogLevel });

    (this.logger as any).log = getLogMethod.bind(this);
  }

  fatal = getNamedLogggerMethod.call(this, 'fatal');
  error = getNamedLogggerMethod.call(this, 'error');
  warn = getNamedLogggerMethod.call(this, 'warn');
  info = getNamedLogggerMethod.call(this, 'info');
  debug = getNamedLogggerMethod.call(this, 'debug');
  trace = getNamedLogggerMethod.call(this, 'trace');
  log(level: keyof Logger, args: any[]): void {
    const fn = getNamedLogggerMethod.call(this, level, this.config);
    fn(args);
  }
}
