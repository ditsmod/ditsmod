import { Injectable } from '@ts-stack/di';
import { Logger } from '@ts-stack/mod';

/**
 * This module used directly (without its own module) in `@RootModule`,
 * because `Logger` used on an Application level. Any module cannot
 * exports services on an Application level.
 */
@Injectable()
export class LoggerService extends Logger {
  trace = (...args: any[]): any => {
    if (!args.length) {
      return true;
    }
    console.log('-------------- Log trace -------------->', ...args);
  };

  info = (...args: any[]): any => {
    console.log('-------------- Log info -------------->', ...args);
  };

  debug = (...args: any[]): any => {
    console.log('---------------- Log debug ----------------->', ...args);
  };

  warn = (...args: any[]): any => {
    console.log('-------------- Log warn -------------->', ...args);
  };

  error = (...args: any[]): any => {
    console.log('-------------- Log error -------------->', ...args);
  };

  fatal = (...args: any[]): any => {
    console.log('-------------- Log fatal -------------->', ...args);
  };
}
