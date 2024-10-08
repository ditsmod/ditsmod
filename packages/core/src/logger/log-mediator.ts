import { Injector, injectable, optional } from '#di';
import { ModuleExtract } from '#types/module-extract.js';
import { ConsoleLogger } from '#logger/console-logger.js';
import { Logger, LoggerConfig, InputLogLevel, OutputLogLevel } from '#logger/logger.js';
import { LogItem } from '#logger/types.js';

/**
 * Mediator between the core logger and the user's custom logger.
 */
@injectable()
export abstract class LogMediator {
  /**
   * If `bufferLogs === true` then all messages will be buffered.
   *
   * If you need logging all buffered messages, call `systemLogMediator.flush()`.
   */
  static bufferLogs?: boolean = false;
  static buffer: LogItem[] = [];
  protected static outputLogLevel: OutputLogLevel;
  protected static hasDiffLogLevels: boolean;

  constructor(
    protected moduleExtract: ModuleExtract,
    protected injector?: Injector,
    @optional() protected logger: Logger = new ConsoleLogger(),
    @optional() protected loggerConfig: LoggerConfig = new LoggerConfig(),
  ) {}

  protected setLog(inputLogLevel: InputLogLevel, msg: string) {
    if (LogMediator.bufferLogs) {
      LogMediator.checkDiffLogLevels(this.loggerConfig.level);
      LogMediator.buffer.push({
        isExternal: this.moduleExtract.isExternal,
        showExternalLogs: this.loggerConfig.showExternalLogs,
        moduleName: this.moduleExtract.moduleName,
        inputLogLevel,
        outputLogLevel: this.loggerConfig.level,
        date: new Date(),
        msg,
      });
    } else {
      if (!this.moduleExtract.isExternal || this.loggerConfig.showExternalLogs) {
        this.logger.log(inputLogLevel, `[${this.moduleExtract.moduleName}]: ${msg}`);
      }
    }
  }

  /**
   * This method is needed only for those cases when logs are written to the buffer before
   * the `OutputLogLevel` is known. At the moment, it is needed only for the `Application`
   * class, before initializing providers at the application level.
   */
  protected updateOutputLogLevel() {
    LogMediator.buffer.forEach((logItem) => {
      logItem.outputLogLevel = this.loggerConfig.level;
    });
  }

  /**
   * Sets `LogMediator.hasDiffLogLevels` to `true`, if `LogMediator.buffer` has logs with different `OutputLogLevel`s.
   */
  protected static checkDiffLogLevels(level: OutputLogLevel) {
    if (this.hasDiffLogLevels) {
      return;
    }
    this.outputLogLevel ??= level;
    if (this.outputLogLevel != level) {
      this.hasDiffLogLevels = true;
    }
  }

  /**
   * Writing of logs by loggers.
   */
  protected writeLogs(logItems: LogItem[]) {
    // A separate instance of the logger is created so that changing the OutputLogLevel does not affect other loggers.
    const logger: Logger = this.injector?.resolveAndCreateChild([]).pull(Logger) || new ConsoleLogger();

    if (LogMediator.hasDiffLogLevels && logger === this.logger) {
      logger.log('warn', this.msgAboutSingletonLogger);
    }

    logItems.forEach((logItem) => {
      logger.setLevel(logItem.outputLogLevel);
      if (!logItem.isExternal || logItem.showExternalLogs) {
        logger.log(logItem.inputLogLevel, `[${logItem.moduleName}]: ${logItem.msg}`);
      }
    });

    return logger; // Needed for testing only.
  }

  protected msgAboutSingletonLogger =
    'Either set "new Application().bootstrap(AppModule, { bufferLogs: false })" in main.ts, ' +
    "or don't pass the logger as a singleton that should write logs in the context of different OutputLogLevels.";
}
