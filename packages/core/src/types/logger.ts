import { injectable, optional } from '#di';

export class LoggerConfig {
  /**
   * @param level Log level (trace, debug, info etc.)
   * @param disabledRaisedLogs If `LogMediator` is used to throw an error,
   * this option allows you to raise the log level. For example,
   * if you set the log level to `info` and the router throws an error
   * about duplicates in routes paths, allowRaisedLog allows you to filter
   * and show relevant logs, even if they have log level `debug`.
   *
   * Default - false.
   */
  constructor(
    public level: LogLevel = 'info',
    public disabledRaisedLogs?: boolean,
  ) {}
}

const msg = 'You need to implement "%s" method in "%s"';
/**
 * Typically, configuring a level in a filter or on a logger will cause logging events
 * of that level and those that are more specific to pass through the filter.
 * A special level, ALL, is guaranteed to capture all levels when used in logging configurations.
 *
 * This log levels implements [log4j log levels](https://logging.apache.org/log4j/2.x/log4j-api/apidocs/org/apache/logging/log4j/Level.html)
 */
export type LogLevel = 'all' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'off';

/**
 * This type is identical to the `LogLevel` type, except for the `off` level.
 * It is intended to define a list of logger methods that are intended for logging.
 */
export type MethodLogLevel = Exclude<LogLevel, 'off'>;

/**
 * @todo reaplace setLevel() by setConfig() method.
 */
@injectable()
export class Logger {
  constructor(@optional() public config?: LoggerConfig) {
    this.config = config ? { ...config } : new LoggerConfig();
  }
  /**
   * All events should be logged.
   */
  all(...args: any[]): any {
    console.warn(msg, 'all', this.constructor.name);
  }
  /**
   * A fine-grained debug message, typically capturing the flow through the application.
   */
  trace(...args: any[]): any {
    console.warn(msg, 'trace', this.constructor.name);
  }
  /**
   * A general debugging event.
   */
  debug(...args: any[]): any {
    console.warn(msg, 'debug', this.constructor.name);
  }
  /**
   * An event for informational purposes.
   */
  info(...args: any[]): any {
    console.warn(msg, 'info', this.constructor.name);
  }
  /**
   * An event that might possible lead to an error.
   */
  warn(...args: any[]): any {
    console.warn(msg, 'warn', this.constructor.name);
  }
  /**
   * An error in the application, possibly recoverable.
   */
  error(...args: any[]): any {
    console.warn(msg, 'error', this.constructor.name);
  }
  /**
   * A fatal event that will prevent the application from continuing.
   */
  fatal(...args: any[]): any {
    console.warn(msg, 'fatal', this.constructor.name);
  }
  log(level: MethodLogLevel, ...args: any[]) {
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
