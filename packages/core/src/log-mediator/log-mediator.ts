import { injectable, optional } from '#di';
import { ModuleExtract } from '#models/module-extract.js';
import { ConsoleLogger } from '#services/console-logger.js';
import { Logger, LoggerConfig, InputLogLevel } from '#types/logger.js';
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
  static bufferLogs: boolean = false;
  static buffer: LogItem[] = [];

  constructor(
    protected moduleExtract: ModuleExtract,
    @optional() protected logger: Logger = new ConsoleLogger(),
    @optional() protected loggerConfig: LoggerConfig = new LoggerConfig(),
  ) {}

  protected setLog(inputLogLevel: InputLogLevel, msg: any) {
    if (LogMediator.bufferLogs) {
      LogMediator.buffer.push({
        moduleName: this.moduleExtract.moduleName,
        logger: this.logger,
        inputLogLevel,
        date: new Date(),
        msg,
      });
    } else {
      this.logger.log(inputLogLevel, msg);
    }
  }

  protected getLoggerConfig(): LoggerConfig {
    return this.logger.getConfig();
  }

  /**
   * Writing of logs by loggers.
   */
  protected writeLogs(logItems: LogItem[]) {
    logItems.forEach((logItem) => {
      logItem.logger.log.call(logItem.logger, logItem.inputLogLevel, logItem.msg);
    });
  }
}
