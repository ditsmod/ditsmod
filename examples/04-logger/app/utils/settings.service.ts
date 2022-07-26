import { AnyObj, Logger, LoggerConfig } from '@ditsmod/core';
import { Injectable } from '@ts-stack/di';

@Injectable()
export class SettingsService {
  constructor(private config: LoggerConfig) {}

  getFn(logger: AnyObj, fnLevel: keyof Logger) {
    return (...args: any[]) => {
      if (!args.length) {
        return this.config.level == fnLevel;
      } else {
        const [param1, ...restParams] = args;
        logger.log(fnLevel, param1, ...restParams);
      }
    };
  }
}
