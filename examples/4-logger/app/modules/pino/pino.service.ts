import { Injectable } from '@ts-stack/di';
import { Logger, LoggerMethod } from '@ts-stack/ditsmod';
import pino = require('pino');

import { PinoConfigService } from './pino-config.service';

const log = pino();

@Injectable()
export class PinoService extends Logger {
  constructor(config: PinoConfigService) {
    super();
    log.level = config.logLevel;
  }

  trace: LoggerMethod = (...args: any[]) => {
    if (!args.length) {
      return log.level == 'trace';
    } else {
      const [param1, ...restParams] = args;
      log.trace(param1, ...restParams);
    }
  };
}
