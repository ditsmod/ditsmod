import { Injectable } from '@ts-stack/di';

import { Logger, LoggerConfig, LoggerMethod } from '../types/logger';

function defaultLoggerFn(fnLevel: keyof Logger, config: LoggerConfig) {
  const callback = (...args: any[]) => {
    const allLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
    const index = allLevels.indexOf(config.level);
    const availableLevels = allLevels.slice(index);
    if (availableLevels.includes(fnLevel)) {
      args = args.length == 1 ? args[0] : args;
      console.log(`[DefaultLogger:${fnLevel}]`, args);
    } else if (!allLevels.includes(config.level)) {
      console.log('[DefaultLogger]', `unexpected level "${config.level}" (available levels: ${allLevels.join(', ')})`);
    }
  };

  return callback as LoggerMethod;
}

@Injectable()
export class DefaultLogger extends Logger {
  constructor(private config: LoggerConfig) {
    super();
  }
  override trace = defaultLoggerFn('trace', this.config);
  override debug = defaultLoggerFn('debug', this.config);
  override info = defaultLoggerFn('info', this.config);
  override warn = defaultLoggerFn('warn', this.config);
  override error = defaultLoggerFn('error', this.config);
  override fatal = defaultLoggerFn('fatal', this.config);
  override log(level: keyof Logger, args: any[]): void {
    const fn = defaultLoggerFn(level, this.config);
    fn(args);
  }
}
