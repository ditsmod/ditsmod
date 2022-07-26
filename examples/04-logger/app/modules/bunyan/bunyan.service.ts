import { Injectable } from '@ts-stack/di';
import { Logger, LoggerConfig } from '@ditsmod/core';
import { LogLevel } from 'bunyan';
import bunyan = require('bunyan');

import { SettingsService } from '../../utils/settings.service';
import { getLogMethod } from '../../utils/get-log-method';

@Injectable()
export class BunyanService implements Logger {
  private logger: bunyan;

  constructor(private settingsService: SettingsService, config: LoggerConfig) {
    this.logger = bunyan.createLogger({ name: 'bunyan-test', level: config.level as LogLevel });

    (this.logger as any).log = getLogMethod.bind(this);
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
