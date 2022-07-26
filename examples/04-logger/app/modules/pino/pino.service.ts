import { Injectable } from '@ts-stack/di';
import { Logger, LoggerConfig } from '@ditsmod/core';
import pino = require('pino');

import { SettingsService } from '../../utils/settings.service';
import { getLogMethod } from '../../utils/get-log-method';

const logger = pino();

@Injectable()
export class PinoService implements Logger {
  private logger: pino.Logger;

  constructor(private settingsService: SettingsService, config: LoggerConfig) {
    this.logger = logger;
    this.logger.level = config.level;
    this.logger.log = getLogMethod.bind(this);
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
