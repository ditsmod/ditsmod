import { injectable, optional } from '#di';
import { InputLogLevel, Logger, LoggerConfig, OutputLogLevel } from '#logger/logger.js';
import { AnyFn } from '#types/mix.js';
import { BaseAppOptions } from '#init/base-app-options.js';

@injectable()
export class ConsoleLogger implements Logger {
  protected level: OutputLogLevel;
  protected baseAppOptions: BaseAppOptions;
  protected allLevels: OutputLogLevel[] = ['all', 'trace', 'debug', 'info', 'warn', 'error', 'fatal', 'off'];

  constructor(
    @optional() config: LoggerConfig = new LoggerConfig(),
    @optional() baseAppOptions: BaseAppOptions = new BaseAppOptions(),
  ) {
    this.baseAppOptions = baseAppOptions;
    this.level = this.baseAppOptions.loggerConfig?.level || config.level || 'info';
  }

  log(level: InputLogLevel, ...args: any[]) {
    this.consoleLoggerFn(level)(...args);
  }

  protected consoleLoggerFn(level: InputLogLevel) {
    const callback: AnyFn = (...args: any[]) => {
      const index = this.allLevels.indexOf(this.level);
      const availableLevels = this.allLevels.slice(index);
      if (availableLevels.includes(level)) {
        args = args.length == 1 ? args[0] : args;
        console.log(level, args);
      } else if (!this.allLevels.includes(this.level)) {
        console.log(
          '[ConsoleLogger]',
          `unexpected level "${this.level}" (available levels: ${this.allLevels.join(', ')})`,
        );
      }
    };

    return callback;
  }

  setLevel(value: OutputLogLevel) {
    this.level = this.baseAppOptions.loggerConfig?.level || value;
  }

  getLevel(): OutputLogLevel {
    return this.baseAppOptions.loggerConfig?.level || this.level || 'info';
  }
}
