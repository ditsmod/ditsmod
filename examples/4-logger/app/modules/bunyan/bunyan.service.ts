import { Injectable } from '@ts-stack/di';
import { Logger, LoggerMethod } from '@ts-stack/ditsmod';
import bunyan = require('bunyan');

import { ConfigService } from '../../services-per-app/config.service';

@Injectable()
export class BunyanService extends Logger {
  private log: bunyan;

  constructor(private config: ConfigService) {
    super();
    this.log = bunyan.createLogger({ name: 'bunyan-test', level: config.logLevel });
  }

  trace: LoggerMethod = (...args: any[]) => {
    if (!args.length) {
      return this.config.logLevel == 'trace';
    } else {
      const [param1, ...restParams] = args;
      this.log.trace(param1, ...restParams);
    }
  };
}
