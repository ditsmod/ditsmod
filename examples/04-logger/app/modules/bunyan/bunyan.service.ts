import { Injectable } from '@ts-stack/di';
import { Logger, LoggerConfig } from '@ditsmod/core';
import { LogLevel } from 'bunyan';
import bunyan = require('bunyan');

@Injectable()
export class BunyanService extends Logger {
  constructor(config: LoggerConfig) {
    super();
    this.init(config);
  }

  protected init(config: LoggerConfig) {
    const logger: Logger = bunyan.createLogger({ name: 'bunyan-test', level: config.level as LogLevel }) as any;
    this.log = (level: keyof Logger, ...args: any[]) => {
      const [arg1, ...rest] = args;
      logger[level](arg1, ...rest);
    };
  }
}
