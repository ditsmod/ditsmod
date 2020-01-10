import { Logger } from '../../../src/types';

export class AppLogger extends Logger {
  info(...args: any[]) {
    console.log(...args);
  }

  debug(...args: any[]) {
    console.log(...args);
  }

  fatal(error: Error, msg?: string, ...params: any[]) {
    console.log(error, msg, ...params);
  }
}
