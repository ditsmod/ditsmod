import { Injectable } from '@ts-stack/di';
import { Logger, LoggerMethod } from '@ts-stack/ditsmod';
import winston = require('winston');

import { ConfigService } from '../../services-per-app/config.service';

@Injectable()
export class WinstonService extends Logger {
  private log: winston.Logger;

  constructor(private config: ConfigService) {
    super();

    const level = this.translateLevel(config.logLevel);

    this.log = winston.createLogger({
      level,
      transports: [
        new winston.transports.Console({
          format: winston.format.simple(),
        }),
      ],
    });
  }

  private translateLevel(level: keyof Logger) {
    switch (level) {
      case 'trace':
        return 'debug';
    }
  }

  trace: LoggerMethod = (...args: any[]) => {
    if (!args.length) {
      return this.config.logLevel == 'trace';
    } else {
      const [param1, ...restParams] = args;
      this.log.debug(param1, ...restParams);
    }
  };
}
