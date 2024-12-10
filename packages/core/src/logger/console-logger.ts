import { injectable, optional } from '#di';
import { InputLogLevel, Logger, LoggerConfig, OutputLogLevel } from '#logger/logger.js';
import { AnyFn } from '#types/mix.js';
import { AppOptions } from '#types/app-options.js';

@injectable()
export class ConsoleLogger implements Logger {
  protected level: OutputLogLevel;
  protected appOptions: AppOptions;
  protected allLevels: OutputLogLevel[] = ['all', 'trace', 'debug', 'info', 'warn', 'error', 'fatal', 'off'];

  constructor(
    @optional() config: LoggerConfig = new LoggerConfig(),
    @optional() appOptions: AppOptions = new AppOptions(),
  ) {
    this.appOptions = appOptions;
    this.level = this.appOptions.loggerConfig?.level || config.level;
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
    this.level = this.appOptions.loggerConfig?.level || value;
  }

  getLevel(): OutputLogLevel {
    return this.appOptions.loggerConfig?.level || this.level || 'info';
  }
}
