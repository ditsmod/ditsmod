import { Injectable } from '@ts-stack/di';

export interface LoggerMethod {
  /**
   * Is the log.<level>() enabled?
   *
   * Usages:
  ```ts
  if (log.info()) {
  // info level is enabled
  }
  ```
    */
  (): boolean;
  /**
   * Log a simple string message (or number).
   */
  (msg: string | number): void;
  /**
   * Special case to log an `Error` instance to the record.
   * This adds an `err` field with exception details
   * (including the stack) and sets `msg` to the exception
   * message or you can specify the `msg`.
   */
  (error: Error, msg?: string, ...params: any[]): void;
  /**
   * The first field can optionally be a `fields` object, which
   * is merged into the log record.
   *
   * To pass in an Error *and* other fields, use the `err`
   * field name for the Error instance.
   */
  (obj: object, msg?: string, ...params: any[]): void;
  /**
   * Uses `util.format` for msg formatting.
   */
  (format: any, ...params: any[]): void;
}

export class Logger {
  trace: LoggerMethod = (...args: any[]): any => {};
  debug: LoggerMethod = (...args: any[]): any => {};
  info: LoggerMethod = (...args: any[]): any => {};
  warn: LoggerMethod = (...args: any[]): any => {};
  error: LoggerMethod = (...args: any[]): any => {};
  fatal: LoggerMethod = (...args: any[]): any => {};
}

export class LoggerConfig {
  level: string = 'info';
}

function defaultLoggerFn(fnLevel: keyof Logger, config: LoggerConfig) {
  const callback = (...args: any[]) => {
    const allLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
    const index = allLevels.indexOf(config.level);
    const availableLevels = allLevels.slice(index);
    if (availableLevels.includes(fnLevel)) {
      console.log(`[DefaultLogger:${fnLevel}]`, ...args);
    } else if (!allLevels.includes(config.level)) {
      console.log(`[DefaultLogger]`, `unexpected level "${config.level}" (available levels: ${allLevels.join(', ')})`);
    }
  };

  return callback as LoggerMethod;
}

@Injectable()
export class DefaultLogger extends Logger {
  constructor(private config: LoggerConfig) {
    super();
  }
  trace = defaultLoggerFn('trace', this.config);
  debug = defaultLoggerFn('debug', this.config);
  info = defaultLoggerFn('info', this.config);
  warn = defaultLoggerFn('warn', this.config);
  error = defaultLoggerFn('error', this.config);
  fatal = defaultLoggerFn('fatal', this.config);
}
