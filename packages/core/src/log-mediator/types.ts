import { Logger, LogLevel } from '#types/logger.js';

/**
 * Default type for `LogMediator.buffer`.
 */
export interface LogItem {
  moduleName: string;
  date: Date;
  outputLogLevel: LogLevel;
  inputLogLevel: LogLevel;
  msg: string;
  logger: Logger;
}
