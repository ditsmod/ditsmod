import { Injectable } from '@ts-stack/di';
import { Logger, LoggerConfig } from '@ditsmod/core';
import winston = require('winston');

@Injectable()
export class WinstonService extends Logger {
  constructor(private config: LoggerConfig) {
    super();
    const transports = [
      new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      }),
    ];

    const customLevels = {
      levels: {
        fatal: 1,
        error: 2,
        warn: 3,
        info: 4,
        debug: 5,
        trace: 6,
      },
      colors: {
        fatal: 'red',
        error: 'yellow',
        debug: 'green',
        info: 'blue',
        trace: 'grey',
      },
    };

    winston.addColors(customLevels.colors);

    const logger: Logger = winston.createLogger({
      levels: customLevels.levels,
      level: config.level,
      transports,
    }) as any;

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
