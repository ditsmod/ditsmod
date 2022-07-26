import { Injectable } from '@ts-stack/di';
import { Logger, LoggerConfig } from '@ditsmod/core';
import winston = require('winston');

import { SettingsService } from '../../utils/settings.service';

@Injectable()
export class WinstonService implements Logger {
  private logger: winston.Logger;

  constructor(private settingsService: SettingsService, config: LoggerConfig) {
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

  fatal = this.settingsService.getFn(this, 'fatal');
  error = this.settingsService.getFn(this, 'error');
  warn = this.settingsService.getFn(this, 'warn');
  info = this.settingsService.getFn(this, 'info');
  debug = this.settingsService.getFn(this, 'debug');
  trace = this.settingsService.getFn(this, 'trace');
  log(level: keyof Logger, args: any[]): void {
    const fn = this.settingsService.getFn(this.logger, level);
    fn(args);
  }
}
