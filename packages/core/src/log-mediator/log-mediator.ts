import { injectable, optional } from '#di';
import { ModuleExtract } from '#models/module-extract.js';
import { ConsoleLogger } from '#services/console-logger.js';
import { LogLevel, Logger, LoggerConfig } from '#types/logger.js';
import { LogItem } from './types.js';

/**
 * Mediator between core logger and custom user's logger.
 */
@injectable()
export abstract class LogMediator {
  /**
   * If `bufferLogs === true` then all messages will be buffered.
   *
   * If you need logging all buffered messages, call `systemLogMediator.flush()`.
   */
  static bufferLogs: boolean = true;
  static buffer: LogItem[] = [];
  protected raisedLogs: LogItem[] = [];

  constructor(
    protected moduleExtract: ModuleExtract,
    @optional() protected logger: Logger = new ConsoleLogger(),
    @optional() protected loggerConfig: LoggerConfig = new LoggerConfig(),
  ) {}

  protected setLog(inputLogLevel: LogLevel, msg: any) {
    if (LogMediator.bufferLogs) {
      const logLevel = this.getLogLevel();

      LogMediator.buffer.push({
        moduleName: this.moduleExtract.moduleName,
        logger: this.logger,
        outputLogLevel: logLevel,
        inputLogLevel,
        date: new Date(),
        msg,
      });
    } else {
      if (inputLogLevel != 'off') {
        this.logger.log(inputLogLevel, msg);
      }
    }
  }

  protected getLogLevel(): LogLevel {
    return this.logger.getConfig().level;
  }

  /**
   * Writing of logs by loggers.
   *
   * @param logLevel come only from raiseLog() call.
   */
  protected writeLogs(logItems: LogItem[], logLevel?: LogLevel) {
    const previousLogLevels = new Map<Logger, LogLevel>();

    logItems.forEach((logItem) => {
      if (!logLevel && this.raisedLogs.includes(logItem)) {
        return;
      }
      const { logger } = logItem;
      const config = logger.getConfig();
      if (!previousLogLevels.has(logger)) {
        previousLogLevels.set(logger, config.level);
      }
      const level = logLevel || logItem.outputLogLevel;
      logger.mergeConfig({ level });

      const { msg } = logItem;
      if (!logger.log) {
        const loggerName = logger.constructor.name;
        const msg0 = `error: you need to implement "log" method in "${loggerName}";`;
        if (logger.error) {
          logger.error.call(logger, msg0, msg);
        } else {
          console.error(msg0, msg);
        }
      } else {
        if (logItem.inputLogLevel != 'off') {
          logger.log.call(logger, logItem.inputLogLevel, msg);
        }
      }
    });

    // Restore previous log level for each logger.
    previousLogLevels.forEach((outputLogLevel, logger) => logger.mergeConfig({ level: outputLogLevel }));
  }
}
