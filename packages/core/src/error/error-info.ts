import { InputLogLevel } from '#logger/logger.js';
import { Status } from '#utils/http-status-codes.js';
import { AnyFn } from '#types/mix.js';

export class ErrorInfo {
  /**
   * Message to send it to a client.
   */
  msg1?: string = 'Internal server error';
  /**
   * A message to send it to a logger.
   */
  declare msg2?: string;
  /**
   * Arguments for error handler to send it to a client.
   */
  declare args1?: any;
  /**
   * Arguments for error handler to send it to a logger.
   */
  declare args2?: any;
  /**
   * Log level. By default - `warn`.
   */
  level?: InputLogLevel = 'warn';
  /**
   * HTTP status.
   */
  status?: Status = Status.INTERNAL_SERVER_ERROR;
  declare params?: any;
  /**
   * If specified, then the stack trace for this error ends at function `constructorOpt`.
   * Functions called by `constructorOpt` will not show up in the stack. This is useful when this
   * class is subclassed, and this option is passed as the second argument to
   * `Error.captureStackTrace(this, constructorOpt)`.
   */
  declare constructorOpt?: AnyFn;
  /**
   * Describes what kind of error this is. This is intended for programmatic use
   * to distinguish between different kinds of errors. Note that in modern versions of Node.js,
   * this name is ignored in the `stack` property value, but callers can still use the `name`
   * property to get at it.
   */
  declare name?: string;
  declare code?: string;
  declare skipCauseMessage?: boolean;

  constructor(info = {} as ErrorInfo) {
    let key: keyof ErrorInfo;
    for (key in info) {
      if (info[key] !== undefined) {
        this[key] = info[key];
      }
    }
  }
}
