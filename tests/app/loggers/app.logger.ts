import { Logger } from '../../../src/types';

export class AppLogger extends Logger {
  trace = (...args: any[]): any => {
    if (!args.length) {
      return true;
    }
    console.log(...args);
  };

  info = (...args: any[]): any => {
    console.log(...args);
  };

  debug = (...args: any[]): any => {
    console.log(...args);
  };

  fatal = (...args: any[]): any => {
    console.log(...args);
  };
}
