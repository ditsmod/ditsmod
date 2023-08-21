import { injectable } from '../di';

import { AnyFn } from '../types/mix';
import { Logger, LogLevel } from '../types/logger';

@injectable()
export class ConsoleLogger extends Logger {
  override all = this.consoleLoggerFn('all');
  override trace = this.consoleLoggerFn('trace');
  override debug = this.consoleLoggerFn('debug');
  override info = this.consoleLoggerFn('info');
  override warn = this.consoleLoggerFn('warn');
  override error = this.consoleLoggerFn('error');
  override fatal = this.consoleLoggerFn('fatal');

  protected consoleLoggerFn(level: LogLevel) {
    const callback: AnyFn = (...args: any[]) => {
      const allLevels: LogLevel[] = ['all', 'trace', 'debug', 'info', 'warn', 'error', 'fatal', 'off'];
      const index = allLevels.indexOf(this.config!.level);
      const availableLevels = allLevels.slice(index);
      if (availableLevels.includes(level)) {
        if (level != 'off') {
          args = args.length == 1 ? args[0] : args;
          console.log(`[ConsoleLogger:${level}]`, args);
        }
      } else if (!allLevels.includes(this.config!.level)) {
        console.log(
          '[ConsoleLogger]',
          `unexpected level "${this.config!.level}" (available levels: ${allLevels.join(', ')})`,
        );
      }
    };

    return callback;
  }
}
