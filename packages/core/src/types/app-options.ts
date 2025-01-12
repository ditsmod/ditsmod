import { LoggerConfig } from '#logger/logger.js';

export class AppOptions {
  /**
   * If `{ bufferLogs: true }`, all messages are buffered during application initialization
   * and flushed afterwards. This can be useful if you want all messages to be logged by
   * the final logger, which is configured after the application is fully initialized.
   * 
   * Set this option to `false` if you are debugging and want logs to be written without delays.
   * 
   * Default - `true`.
   */
  bufferLogs?: boolean = true;
  /**
   * This logger config is not added to the providers array as a separate provider but can be directly
   * used by end consumers (i.e., the loggers).
   * 
   * If you want this option to have higher priority for your loggers at any level, it is recommended
   * to [create your logger using a `FactoryProvider`][1], where you override the logger methods to set
   * the `OutputLogLevel` based on `appOptions.loggerConfig?.level`.
   * 
   * [1]: https://github.com/ditsmod/ditsmod/blob/main/examples/04-logger/src/app/modules/pino/patch-logger.ts
   */
  loggerConfig?: LoggerConfig;
}
