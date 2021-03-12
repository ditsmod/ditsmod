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
  /**
   * Determines the depth of the inspect object to be logged.
   */
  depth?: number = 0;
}
