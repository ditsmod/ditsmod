import { Injectable } from '@ts-stack/di';
import { Logger, LoggerConfig } from '@ditsmod/core';
import { LogLevel } from 'bunyan';
import bunyan = require('bunyan');

@Injectable()
export class BunyanService extends Logger {
  constructor(private config: LoggerConfig) {
    super();
    const logger: Logger = bunyan.createLogger({ name: 'bunyan-test', level: config.level as LogLevel }) as any;

    logger.log = (level: keyof Logger, ...args: any[]) => {
      const [arg1, ...rest] = args;
      logger[level](arg1, ...rest);
    };

    const levels: (keyof Logger)[] = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];
    levels.forEach(level => {
      this[level] = (...args: any[]) => {
        if (!args.length) {
          return this.config.level == level;
        } else {
          this.log(level, ...args);
        }
      };
    });

    this.log = (level: (keyof Logger), ...args: any[]) => {
      const [arg1, ...rest] = args;
      logger[level](arg1, ...rest);
    };
  }
}
