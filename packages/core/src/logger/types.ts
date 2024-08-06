import { InputLogLevel, OutputLogLevel } from '#logger/logger.js';

/**
 * Default type for `LogMediator.buffer`.
 */
export interface LogItem {
  /**
   * Specifies whether logs are written from an external module or not. An external module
   * is a module that you install using package managers (npm, yarn, etc.).
   */
  isExternal?: boolean;
  /**
   * Specifies whether to show logs from external modules. An external module
   * is a module that you install using package managers (npm, yarn, etc.).
   */
  showExternalLogs?: boolean;
  moduleName: string;
  date: Date;
  /**
   * The log level for a particular message. This particular message may or may not be logged,
   * it all depends on the `OutputLogLevel`.
   */
  inputLogLevel: InputLogLevel;
  /**
   * The Log level that is set for all log messages that should be logged at this time.
   */
  outputLogLevel: OutputLogLevel;
  msg: string;
}
