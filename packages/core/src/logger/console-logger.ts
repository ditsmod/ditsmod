import { injectable, optional } from '#di';
import { InputLogLevel, Logger, LoggerConfig, OutputLogLevel } from '#logger/logger.js';
import { AnyFn } from '#types/mix.js';

@injectable()
export class ConsoleLogger implements Logger {
  protected config: LoggerConfig;
  protected allLevels: OutputLogLevel[] = ['all', 'trace', 'debug', 'info', 'warn', 'error', 'fatal', 'off'];

  constructor(@optional() config?: LoggerConfig) {
    this.config = config ? { ...config } : new LoggerConfig();
  }

  log(level: InputLogLevel, ...args: any[]) {
    this.consoleLoggerFn(level)(...args);
  }

  protected consoleLoggerFn(level: InputLogLevel) {
    const callback: AnyFn = (...args: any[]) => {
      const index = this.allLevels.indexOf(this.config.level);
      const availableLevels = this.allLevels.slice(index);
      if (availableLevels.includes(level)) {
        args = args.length == 1 ? args[0] : args;
        console.log(`[ConsoleLogger:${level}]`, args);
      } else if (!this.allLevels.includes(this.config.level)) {
        console.log(
          '[ConsoleLogger]',
          `unexpected level "${this.config.level}" (available levels: ${this.allLevels.join(', ')})`,
        );
      }
    };

    return callback;
  }

  setLevel(value: OutputLogLevel) {
    this.config.level = value;
  }

  getLevel(): OutputLogLevel {
    return this.config.level || 'info';
  }
}
