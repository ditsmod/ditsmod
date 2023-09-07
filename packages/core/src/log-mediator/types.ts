import { Logger, InputLogLevel } from '#types/logger.js';

/**
 * Default type for `LogMediator.buffer`.
 */
export interface LogItem {
  moduleName: string;
  date: Date;
  /**
   * The log level for a particular message. This particular message may or may not be logged,
   * it all depends on the `OutputLogLevel`.
   */
  inputLogLevel: InputLogLevel;
  msg: string;
}
