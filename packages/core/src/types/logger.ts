import { injectable, optional } from '#di';

export class LoggerConfig {
  /**
   * @param level Log level (trace, debug, info etc.)
   */
  constructor(public level: OutputLogLevel = 'info') {}
}

const msg = 'You need to implement "%s" method in "%s"';

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

@injectable()
export class Logger {
  constructor(@optional() public config?: LoggerConfig) {
    this.config = config ? { ...config } : new LoggerConfig();
  }

  log(level: InputLogLevel, ...args: any[]) {
    console.warn(msg, 'log', this.constructor.name);
  }

  mergeConfig(config: LoggerConfig) {
    this.config = { ...this.config, ...config };
  }

  getConfig(): LoggerConfig {
    return this.config || new LoggerConfig();
  }
}
