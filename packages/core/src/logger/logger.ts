export class LoggerConfig {
  /**
   * @param level Log level (trace, debug, info etc.)
   */
  constructor(public level: OutputLogLevel = 'info') {}
}

/**
 * The log level for a particular message. This particular message may or may not be logged,
 * it all depends on the `OutputLogLevel`.
 * This type is identical to the `LogLevel` type, except for the `off` level.
 * It is intended to define a list of logger methods that are intended for logging.
 */
export type InputLogLevel = Exclude<OutputLogLevel, 'off'>;
/**
 * The Log level that is set for all log messages that should be logged at this time.
 *
 * Borrowed from [log4j log levels](https://logging.apache.org/log4j/2.x/log4j-api/apidocs/org/apache/logging/log4j/Level.html)
 */
export type OutputLogLevel = 'all' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'off';

export class Logger {
  log(level: InputLogLevel, ...args: any[]) {
    console.warn('You need to implement "log" method in "%s"', this.constructor.name);
  }

  setLevel(value: OutputLogLevel) {
    console.warn('You need to implement "setLevel" method in "%s"', this.constructor.name);
  }

  getLevel(): OutputLogLevel {
    console.warn('You need to implement "getLevel" method in "%s"', this.constructor.name);
    return 'info';
  }
}
