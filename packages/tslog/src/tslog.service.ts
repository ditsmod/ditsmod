import { Logger, LoggerConfig } from '@ditsmod/core';
import { Injectable } from '@ts-stack/di';
import { Logger as Tslog, TLogLevelName } from 'tslog';

@Injectable()
export class TslogService extends Logger {
  constructor(private config: LoggerConfig) {
    super();
    this.init();
  }

  protected init() {
    const logger: Logger = new Tslog({ minLevel: this.config.level as TLogLevelName, displayFilePath: 'hidden', displayFunctionName: false }) as any;
    const levels: (keyof Logger)[] = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];
    levels.forEach((level) => {
      this[level] = (...args: any[]) => {
        if (!args.length) {
          return this.config.level == level;
        } else {
          this.log(level, ...args);
        }
      };
    });

    this.log = (level: keyof Logger, ...args: any[]) => {
      const [arg1, ...rest] = args;
      logger[level](arg1, ...rest);
    };
  }
}
