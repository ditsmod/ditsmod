import { inspect } from 'util';
import { Injectable } from '@ts-stack/di';

import { Logger, LoggerConfig, LoggerMethod } from '../types/logger';

function defaultLoggerFn(fnLevel: keyof Logger, config: LoggerConfig) {
  const callback = (...args: any[]) => {
    const allLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
    const index = allLevels.indexOf(config.level);
    const availableLevels = allLevels.slice(index);
    const delimiter = '-'.repeat(80);
    if (availableLevels.includes(fnLevel)) {
      args = args.length == 1 ? args[0] : args;
      if (config.depth) {
        console.log(`[DefaultLogger:${fnLevel}]`, inspect(args, false, config.depth, true));
      } else {
        console.log(`[DefaultLogger:${fnLevel}]`, args);
      }
      console.log(delimiter);
    } else if (!allLevels.includes(config.level)) {
      console.log('[DefaultLogger]', `unexpected level "${config.level}" (available levels: ${allLevels.join(', ')})`);
      console.log(delimiter);
    }
  };

  return callback as LoggerMethod;
}

@Injectable()
export class DefaultLogger extends Logger {
  constructor(private config: LoggerConfig) {
    super();
  }
  trace = defaultLoggerFn('trace', this.config);
  debug = defaultLoggerFn('debug', this.config);
  info = defaultLoggerFn('info', this.config);
  warn = defaultLoggerFn('warn', this.config);
  error = defaultLoggerFn('error', this.config);
  fatal = defaultLoggerFn('fatal', this.config);
  log(level: keyof Logger, args: any[]): void {
    const fn = defaultLoggerFn(level, this.config);
    fn(args);
  }
}
