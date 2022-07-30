import { Injectable, Optional } from '@ts-stack/di';

import { Logger, LoggerConfig, LoggerMethod } from '../types/logger';

function consoleLoggerFn(fnLevel: keyof Logger, config: LoggerConfig) {
  const callback = (...args: any[]) => {
    const allLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
    const index = allLevels.indexOf(config.level);
    const availableLevels = allLevels.slice(index);
    if (availableLevels.includes(fnLevel)) {
      args = args.length == 1 ? args[0] : args;
      console.log(`[ConsoleLogger:${fnLevel}]`, args);
    } else if (!allLevels.includes(config.level)) {
      console.log('[ConsoleLogger]', `unexpected level "${config.level}" (available levels: ${allLevels.join(', ')})`);
    }
  };

  return callback as LoggerMethod;
}

@Injectable()
export class ConsoleLogger extends Logger {
  constructor(@Optional() private config: LoggerConfig = new LoggerConfig()) {
    super();
  }
  override trace = consoleLoggerFn('trace', this.config);
  override debug = consoleLoggerFn('debug', this.config);
  override info = consoleLoggerFn('info', this.config);
  override warn = consoleLoggerFn('warn', this.config);
  override error = consoleLoggerFn('error', this.config);
  override fatal = consoleLoggerFn('fatal', this.config);
  override log(level: keyof Logger, args: any[]): void {
    const fn = consoleLoggerFn(level, this.config);
    fn(args);
  }
}
