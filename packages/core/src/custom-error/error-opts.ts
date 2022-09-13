import { LogLevel } from '../types/logger';
import { Status } from '../utils/http-status-codes';

export class ErrorOpts {
  /**
   * Message to the client.
   */
  msg1?: string = 'Internal server error';
  /**
   * A message to the server.
   */
  msg2?: string = '';
  /**
   * Log level. By default - `debug`.
   */
  level?: LogLevel = 'debug';
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
