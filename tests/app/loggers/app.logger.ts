import { Logger } from '../../../src/types';

export class AppLogger extends Logger {
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
