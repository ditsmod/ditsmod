import { InputLogLevel } from '#logger/logger.js';
import { Status } from '#utils/http-status-codes.js';

export class ErrorInfo {
  code?: string;
  /**
   * Message to send it to a client.
   */
  msg1?: string = 'Internal server error';
  /**
   * A message to send it to a logger.
   */
  msg2?: string = '';
  /**
   * Arguments for error handler to send it to a client.
   */
  args1?: any;
  /**
   * Arguments for error handler to send it to a logger.
   */
  args2?: any;
  /**
   * Log level. By default - `warn`.
   */
  level?: InputLogLevel = 'warn';
  /**
   * HTTP status.
   */
  status?: Status = Status.BAD_REQUEST;
  /**
   * The parameters that came with the HTTP request.
   */
  params?: any;

  constructor(info = {} as ErrorInfo) {
    let key: keyof ErrorInfo;
    for (key in info) {
      if (info[key] !== undefined) {
        this[key] = info[key];
      }
    }
  }
}
