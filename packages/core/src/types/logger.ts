import { Injectable, Optional } from '@ts-stack/di';

export class LoggerConfig {
  constructor(public level: LogLevel = 'info') {}
}

const msg = 'You need to implement "%s" method in "%s"';
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * @todo reaplace setLevel() by setConfig() method.
 */
@Injectable()
export class Logger {
    constructor(@Optional() public config?: LoggerConfig) {
    this.config = config ? { ...config } : new LoggerConfig();
  }
  trace(...args: any[]): any {
    console.warn(msg, 'trace', this.constructor.name);
  }
  debug(...args: any[]): any {
    console.warn(msg, 'debug', this.constructor.name);
  }
  info(...args: any[]): any {
    console.warn(msg, 'info', this.constructor.name);
  }
  warn(...args: any[]): any {
    console.warn(msg, 'warn', this.constructor.name);
  }
  error(...args: any[]): any {
    console.warn(msg, 'error', this.constructor.name);
  }
  fatal(...args: any[]): any {
    console.warn(msg, 'fatal', this.constructor.name);
  }
  log(level: LogLevel, ...args: any[]) {
    this[level](...args);
  }
  setLevel(value: LogLevel) {
    if (this.config?.level) {
      this.config.level = value;
    }
  }
  getLevel(): LogLevel {
    return this.config?.level || 'info';
  }
}
