import { Injectable, Optional } from '@ts-stack/di';

import { Logger, LoggerConfig, LogLevel } from '../types/logger';
import { ConsoleLogger } from '../services/console-logger';
import { ModuleExtract } from '../models/module-extract';

/**
 * Uses by LogMediator.
 */
export class LogFilter {
  modulesNames?: string[];
  classesNames?: string[];
  tags?: string[];
}
/**
 * Uses by LogMediator.
 */
export class MsgLogFilter {
  className?: string;
  tags?: string[];
}

/**
 * Default type for Log buffer.
 */
export interface LogItem {
  moduleName: string;
  date: Date;
  msgLogFilter: MsgLogFilter;
  loggerLogFilter: LogFilter;
  loggerLevel: LogLevel;
  msgLevel: LogLevel;
  msg: string;
  logger: Logger;
}

/**
 * Mediator between core logger and custom user's logger.
 */
@Injectable()
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
    @Optional() protected logger: Logger = new ConsoleLogger(),
    @Optional() protected logFilter: LogFilter = new LogFilter(),
    @Optional() protected loggerConfig: LoggerConfig = new LoggerConfig()
  ) {
    this.logger = logger || new ConsoleLogger();
    this.logFilter = logFilter || new LogFilter();
    this.loggerConfig = loggerConfig || new LoggerConfig();
  }

  protected setLog<T extends MsgLogFilter>(msgLevel: LogLevel, msgLogFilter: T, msg: any) {
    if (LogMediator.bufferLogs) {
      const loggerLevel: LogLevel =
        typeof this.logger.getLevel == 'function' ? this.logger.getLevel() : this.loggerConfig!.level;

      LogMediator.buffer.push({
        moduleName: this.moduleExtract.moduleName,
        logger: this.logger,
        loggerLevel,
        loggerLogFilter: this.logFilter || new LogFilter(),
        msgLevel,
        msgLogFilter,
        date: new Date(),
        msg,
      });
    } else {
      this.logger.log(msgLevel, msg);
    }
  }

  protected applyLogFilter(buffer: LogItem[]) {
    const uniqFilters = new Map<LogFilter, string>();

    let filteredBuffer = buffer.filter((item) => {
      if (!uniqFilters.has(item.loggerLogFilter)) {
        uniqFilters.set(item.loggerLogFilter, item.moduleName);
      }
      return this.filteredLog(item, item.loggerLogFilter);
    });

    if (uniqFilters.size > 1) {
      this.detectedDifferentLogFilters(uniqFilters);
    }

    if (buffer.length && !filteredBuffer.length && uniqFilters.size) {
      filteredBuffer = this.getWarnAboutEmptyFilteredLogs(uniqFilters);
    }

    return filteredBuffer;
  }

  protected applyCustomLogFilter(buffer: LogItem[], loggerLogFilter: LogFilter, prefix?: string) {
    return buffer.filter((item) => {
      return this.filteredLog(item, loggerLogFilter, prefix);
    });
  }

  protected filteredLog(item: LogItem, loggerLogFilter: LogFilter, prefix?: string) {
    const { msgLogFilter, moduleName } = item;
    let hasModuleName: boolean | undefined = true;
    let hasClassName: boolean | undefined = true;
    let hasTags: boolean | undefined = true;
    if (loggerLogFilter.modulesNames) {
      hasModuleName = loggerLogFilter!.modulesNames?.includes(moduleName);
    }
    if (loggerLogFilter.classesNames) {
      hasClassName = loggerLogFilter!.classesNames?.includes(msgLogFilter.className || '');
    }
    if (loggerLogFilter.tags) {
      hasTags = msgLogFilter.tags?.some((tag) => loggerLogFilter!.tags?.includes(tag));
    }
    this.transformMsgIfFilterApplied(item, loggerLogFilter, prefix);
    return hasModuleName && hasClassName && hasTags;
  }

  protected transformMsgIfFilterApplied(item: LogItem, loggerLogFilter: LogFilter, prefix?: string) {
    if (loggerLogFilter.modulesNames || loggerLogFilter.classesNames || loggerLogFilter.tags) {
      item.msg = `${prefix || ''}${item.moduleName}: ${item.msg}`;
    }
  }

  /**
   * @param logLevel has only from raiseLog() call.
   */
  protected renderLogs(logItems: LogItem[], logLevel?: LogLevel) {
    logItems.forEach((logItem) => {
      if (!logLevel && this.raisedLogs.includes(logItem)) {
        return;
      }
      // const dateTime = log.date.toLocaleString();
      const partMsg = logItem.msgLogFilter.tags ? ` (Tags: ${logItem.msgLogFilter.tags.join(', ')})` : '';
      const msg = `${logItem.msg}${partMsg}`;
      logItem.logger.setLevel(logLevel || logItem.loggerLevel);

      if (!logItem.logger.log) {
        const loggerName = logItem.logger.constructor.name;
        const msg0 = `error: you need to implement "log" method in "${loggerName}";`;
        if (logItem.logger.error) {
          logItem.logger.error.call(logItem.logger, msg0, msg);
        } else {
          console.error(msg0, msg);
        }
      } else {
        logItem.logger.log.call(logItem.logger, logItem.msgLevel, msg);
      }
    });
  }

  protected raiseLog(logFilter: LogFilter, logLevel: LogLevel) {
    if (this.loggerConfig!.disableRaisedLogs) {
      return;
    }
    this.raisedLogs = this.applyCustomLogFilter(LogMediator.buffer, logFilter, 'raised log: ');
    this.renderLogs(this.raisedLogs, logLevel);
    this.raisedLogs = [];
  }

  protected getWarnAboutEmptyFilteredLogs(uniqFilters: Map<LogFilter, string>): LogItem[] {
    const filters = [...uniqFilters].map(([logFilter, moduleName]) => {
      return `${moduleName}: ${JSON.stringify(logFilter)}`;
    });

    const msg = `There are no logs to display, the following filters are applied: ${filters.join(', ')}`;
    return [
      {
        moduleName: this.moduleExtract.moduleName,
        logger: this.logger,
        loggerLevel: 'info',
        loggerLogFilter: new LogFilter(),
        msgLevel: 'warn',
        msgLogFilter: new MsgLogFilter(),
        date: new Date(),
        msg,
      },
    ];
  }

  protected detectedDifferentLogFilters(uniqFilters: Map<LogFilter, string>) {
    const filtersStr: string[] = [];
    uniqFilters.forEach((moduleName, filter) => {
      filtersStr.push(`${moduleName} ${JSON.stringify(filter)}`);
    });

    this.logger.log.call(
      this.logger,
      'warn',
      `LogMediator: detected ${uniqFilters.size} different LogFilters: ${filtersStr.join(', ')}`
    );
  }
}
