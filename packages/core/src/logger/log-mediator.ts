import { Injector, injectable, optional } from '#di';
import { ModuleExtract } from '#types/module-extract.js';
import { ConsoleLogger } from '#logger/console-logger.js';
import { Logger, LoggerConfig, InputLogLevel, OutputLogLevel } from '#logger/logger.js';
import { LogItem } from '#logger/types.js';
import { BaseAppOptions } from '#init/base-app-options.js';

/**
 * Mediator between the core logger and the user's custom logger.
 */
@injectable()
export abstract class LogMediator {
  protected static allLevels: OutputLogLevel[] = ['off', 'fatal', 'error', 'warn', 'info', 'debug', 'trace', 'all'];
  /**
   * If `bufferLogs === true` then all messages will be buffered.
   *
   * If you need logging all buffered messages, call `systemLogMediator.flush()`.
   */
  static bufferLogs?: boolean = false;
  static buffer: LogItem[] = [];
  static outputLogLevel: OutputLogLevel;
  protected static prevOutputLogLevel?: OutputLogLevel;
  protected static hasDiffLogLevels: boolean;

  constructor(
    protected moduleExtract: ModuleExtract,
    protected injector?: Injector,
    @optional() protected logger: Logger = new ConsoleLogger(),
    @optional() protected loggerConfig: LoggerConfig = new LoggerConfig(),
    @optional() protected baseAppOptions?: BaseAppOptions,
  ) {}

  protected levelIndex(level: OutputLogLevel) {
    return LogMediator.allLevels.indexOf(this.loggerConfig.level || 'info') >= LogMediator.allLevels.indexOf(level);
  }

  protected setLog(inputLogLevel: InputLogLevel, msg: string) {
    const showExternalLogs = this.baseAppOptions?.showExternalLogs ?? this.loggerConfig.showExternalLogs ?? true;
    if (LogMediator.bufferLogs) {
      LogMediator.checkDiffLogLevels(this.loggerConfig.level);
      LogMediator.buffer.push({
        isExternal: this.moduleExtract.isExternal,
        showExternalLogs,
        moduleName: this.moduleExtract.moduleName,
        inputLogLevel,
        outputLogLevel: this.loggerConfig.level || 'info',
        date: new Date(),
        msg,
      });
    } else {
      if (!this.moduleExtract.isExternal || showExternalLogs) {
        this.logger.log(inputLogLevel, `[${this.moduleExtract.moduleName}]: ${msg}`);
      }
    }
  }

  /**
   * This method is needed only for those cases when logs are written to the buffer before
   * the `OutputLogLevel` is known. At the moment, it is needed only for the `RestApplication` and `BaseAppInitializer`
   * classes, ater initializing providers at the application level, and after init extensions.
   */
  protected updateOutputLogLevel() {
    LogMediator.buffer.forEach((logItem) => {
      logItem.outputLogLevel = this.loggerConfig.level || 'info';
    });
  }

  /**
   * Sets `LogMediator.hasDiffLogLevels` to `true`, if `LogMediator.buffer` has logs with different `OutputLogLevel`s.
   */
  protected static checkDiffLogLevels(level?: OutputLogLevel) {
    if (this.hasDiffLogLevels) {
      return;
    }
    this.prevOutputLogLevel ??= level;
    if (this.prevOutputLogLevel != level) {
      this.hasDiffLogLevels = true;
    }
  }

  /**
   * Writing of logs by loggers.
   */
  protected writeLogs(logItems: LogItem[]) {
    // A separate instance of the logger is created so that changing the OutputLogLevel does not affect other loggers.
    const logger: Logger =
      this.injector?.resolveAndCreateChild([], 'child of logger').pull(Logger) || new ConsoleLogger();

    if (LogMediator.hasDiffLogLevels && logger === this.logger) {
      logger.log('warn', this.msgAboutSingletonLogger);
    }

    logItems.forEach((logItem) => {
      logger.setLevel(logItem.outputLogLevel);
      const showExternalLogs = this.baseAppOptions?.showExternalLogs ?? logItem.showExternalLogs ?? true;
      if (!logItem.isExternal || showExternalLogs) {
        logger.log(logItem.inputLogLevel, `[${logItem.moduleName}]: ${logItem.msg}`);
      }
    });

    return logger; // Needed for testing only.
  }

  protected msgAboutSingletonLogger =
    'Either set "new RestApplication().bootstrap(AppModule, { bufferLogs: false })" in main.ts, ' +
    "or don't pass the logger as a singleton that should write logs in the context of different OutputLogLevels.";
}
