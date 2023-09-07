import { injectable } from '#di';
import { InputLogLevel, Logger, OutputLogLevel } from '#types/logger.js';
import { AnyFn } from '#types/mix.js';

@injectable()
export class ConsoleLogger extends Logger {
  protected allLevels: OutputLogLevel[] = ['all', 'trace', 'debug', 'info', 'warn', 'error', 'fatal', 'off'];

  override log(level: InputLogLevel, ...args: any[]) {
    this.consoleLoggerFn(level)(...args);
  }

  protected consoleLoggerFn(level: InputLogLevel) {
    const callback: AnyFn = (...args: any[]) => {
      const index = this.allLevels.indexOf(this.config!.level);
      const availableLevels = this.allLevels.slice(index);
      if (availableLevels.includes(level)) {
        args = args.length == 1 ? args[0] : args;
        console.log(`[ConsoleLogger:${level}]`, args);
      } else if (!this.allLevels.includes(this.config!.level)) {
        console.log(
          '[ConsoleLogger]',
          `unexpected level "${this.config!.level}" (available levels: ${this.allLevels.join(', ')})`,
        );
      }
    };

    return callback;
  }
}
