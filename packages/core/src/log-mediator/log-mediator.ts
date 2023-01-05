import { injectable, optional } from '../di';

import { Logger, LoggerConfig, LogLevel } from '../types/logger';
import { ConsoleLogger } from '../services/console-logger';
import { ModuleExtract } from '../models/module-extract';

/**
 * This class is used to limit log output by certain options.
 * Uses by `LogMediator`.
 */
export class OutputLogFilter {
  modulesNames?: string[];
  classesNames?: string[];
  tags?: string[];
}
/**
 * This class is used to generate logs that will be used for `OutputLogFilter`.
 * Uses by `LogMediator`.
 */
export class InputLogFilter {
  className?: string;
  tags?: string[];
}

/**
 * Default type for `LogMediator.buffer`.
 */
export interface LogItem {
  moduleName: string;
  date: Date;
  outputLogFilter: OutputLogFilter;
  outputLogLevel: LogLevel;
  inputLogFilter: InputLogFilter;
  inputLogLevel: LogLevel;
  msg: string;
  logger: Logger;
}

/**
 * Mediator between core logger and custom user's logger.
 */
@injectable()
export class LogMediator {
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
    @optional() protected outputLogFilter: OutputLogFilter = new OutputLogFilter(),
    @optional() protected loggerConfig: LoggerConfig = new LoggerConfig()
  ) {
    this.logger = logger || new ConsoleLogger();
    this.outputLogFilter = outputLogFilter || new OutputLogFilter();
    this.loggerConfig = loggerConfig || new LoggerConfig();
  }

  protected setLog<T extends InputLogFilter>(inputLogLevel: LogLevel, inputLogFilter: T, msg: any) {
    if (LogMediator.bufferLogs) {
      const logLevel = this.getLogLevel();

      LogMediator.buffer.push({
        moduleName: this.moduleExtract.moduleName,
        logger: this.logger,
        outputLogLevel: logLevel,
        outputLogFilter: this.outputLogFilter || new OutputLogFilter(),
        inputLogLevel,
        inputLogFilter,
        date: new Date(),
        msg,
      });
    } else {
      this.logger.log(inputLogLevel, msg);
    }
  }

  protected getLogLevel(): LogLevel {
    return typeof this.logger.getLevel == 'function' ? this.logger.getLevel() : this.loggerConfig!.level;
  }

  protected applyLogFilter(buffer: LogItem[]) {
    const uniqFilters = new Map<OutputLogFilter, string>();

    let filteredBuffer = buffer.filter((item) => {
      if (!uniqFilters.has(item.outputLogFilter)) {
        uniqFilters.set(item.outputLogFilter, item.moduleName);
      }
      return this.isFilteredLog(item, item.outputLogFilter);
    });

    if (uniqFilters.size > 1) {
      this.detectedDifferentLogFilters(uniqFilters);
    }

    if (buffer.length && !filteredBuffer.length && uniqFilters.size) {
      filteredBuffer = this.getWarnAboutEmptyFilteredLogs(uniqFilters);
    }

    return filteredBuffer;
  }

  protected applyCustomOutputLogFilter(buffer: LogItem[], outputLogFilter: OutputLogFilter, prefix?: string) {
    return buffer.filter((item) => {
      return this.isFilteredLog(item, outputLogFilter, prefix);
    });
  }

  protected isFilteredLog(item: LogItem, outputLogFilter: OutputLogFilter, prefix?: string) {
    const { inputLogFilter, moduleName } = item;
    let hasModuleName: boolean | undefined = true;
    let hasClassName: boolean | undefined = true;
    let hasTags: boolean | undefined = true;
    if (outputLogFilter.modulesNames) {
      hasModuleName = outputLogFilter!.modulesNames?.includes(moduleName);
    }
    if (outputLogFilter.classesNames) {
      hasClassName = outputLogFilter!.classesNames?.includes(inputLogFilter.className || '');
    }
    if (outputLogFilter.tags) {
      hasTags = inputLogFilter.tags?.some((tag) => outputLogFilter!.tags?.includes(tag));
    }
    this.transformMsgIfFilterApplied(item, outputLogFilter, prefix);
    return hasModuleName && hasClassName && hasTags;
  }

  protected transformMsgIfFilterApplied(item: LogItem, outputLogFilter: OutputLogFilter, prefix?: string) {
    if (outputLogFilter.modulesNames || outputLogFilter.classesNames || outputLogFilter.tags) {
      item.msg = `${prefix || ''}${item.moduleName}: ${item.msg}`;
    }
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
      if (!previousLogLevels.has(logger)) {
        previousLogLevels.set(logger, logger.getLevel());
      }
      logger.setLevel(logLevel || logItem.outputLogLevel);

      const partMsg = logItem.inputLogFilter.tags ? ` (Tags: ${logItem.inputLogFilter.tags.join(', ')})` : '';
      const msg = `${logItem.msg}${partMsg}`;
      if (!logger.log) {
        const loggerName = logger.constructor.name;
        const msg0 = `error: you need to implement "log" method in "${loggerName}";`;
        if (logger.error) {
          logger.error.call(logger, msg0, msg);
        } else {
          console.error(msg0, msg);
        }
      } else {
        logger.log.call(logger, logItem.inputLogLevel, msg);
      }
    });

    // Restore previous log level for each logger.
    previousLogLevels.forEach((outputLogLevel, logger) => logger.setLevel(outputLogLevel));
  }

  protected raiseLog(outputLogFilter: OutputLogFilter, logLevel: LogLevel) {
    if (this.loggerConfig!.disabledRaisedLogs) {
      return;
    }
    this.raisedLogs = this.applyCustomOutputLogFilter(LogMediator.buffer, outputLogFilter, 'raised log: ');
    this.writeLogs(this.raisedLogs, logLevel);
    this.raisedLogs = [];
  }

  protected getWarnAboutEmptyFilteredLogs(uniqFilters: Map<OutputLogFilter, string>): LogItem[] {
    const filters = [...uniqFilters].map(([outputLogFilter, moduleName]) => {
      return `${moduleName}: ${JSON.stringify(outputLogFilter)}`;
    });

    const msg = `There are no logs to display, the following filters are applied: ${filters.join(', ')}`;
    return [
      {
        moduleName: this.moduleExtract.moduleName,
        logger: this.logger,
        outputLogLevel: 'info',
        outputLogFilter: new OutputLogFilter(),
        inputLogLevel: 'warn',
        inputLogFilter: new InputLogFilter(),
        date: new Date(),
        msg,
      },
    ];
  }

  protected detectedDifferentLogFilters(uniqFilters: Map<OutputLogFilter, string>) {
    const filtersStr: string[] = [];
    uniqFilters.forEach((moduleName, filter) => {
      filtersStr.push(`${moduleName} ${JSON.stringify(filter)}`);
    });

    this.logger.log.call(
      this.logger,
      'warn',
      `LogMediator: detected ${uniqFilters.size} different OutputLogFilters: ${filtersStr.join(', ')}`
    );
  }
}
