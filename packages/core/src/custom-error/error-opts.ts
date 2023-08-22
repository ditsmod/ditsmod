import { MethodLogLevel } from '../types/logger';
import { Status } from '../utils/http-status-codes';

export class ErrorOpts {
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
   * Log level. By default - `debug`.
   */
  level?: MethodLogLevel = 'debug';
  /**
   * HTTP status.
   */
  status?: Status = Status.BAD_REQUEST;
  /**
   * The parameters that came with the HTTP request.
   */
  params?: any;

  constructor(info = {} as ErrorOpts) {
    let key: keyof ErrorOpts;
    for (key in info) {
      if (info[key] !== undefined) {
        this[key] = info[key];
      }
    }
  }
}
