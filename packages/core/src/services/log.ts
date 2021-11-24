import { Injectable, Optional } from '@ts-stack/di';
import { format } from 'util';

import { Logger } from '../types/logger';
import { AnyObj } from '../types/mix';
import { DefaultLogger } from './default-logger';
import { LogManager } from './log-manager';

type KeyOfLogger = keyof Logger;

export class FilterConfig {
  moduleName?: string;
  className?: string;
  tags?: string[];
}
export class LogConfig {
  filterConfig: FilterConfig = {};
}

/**
 * Default type for Log buffer.
 */
export interface LogItem {
  date: Date;
  filterConfig: FilterConfig;
  level: KeyOfLogger;
  msg: string;
}

/**
 * Mediator between core logger and custom user's logger.
 *
 * If you want to rewrite messages written by the core logger, you need:
 * 1. override the methods of this class in your own class;
 * 2. via DI, at the application level, replace the Log class with your class.
 */
@Injectable()
export class Log {
  /**
   * If `bufferLogs === true` then all messages will be buffered.
   *
   * If you need logging all buffered messages, call `log.flush()`.
   */
  set bufferLogs(val: boolean) {
    this.logManager.bufferLogs = val;
  }
  get bufferLogs() {
    return this.logManager.bufferLogs;
  }
  get buffer() {
    return this.logManager.buffer;
  }

  get logger() {
    return this._logger;
  }

  set logger(logger: Logger) {
    if (logger) {
      this._logger = logger;
    } else {
      throw new TypeError('Can not set empty value to logger.');
    }
  }

  constructor(
    protected logManager: LogManager,
    @Optional() protected _logger: Logger = new DefaultLogger(),
    @Optional() protected logConfig: LogConfig = new LogConfig()
  ) {}

  getLogManager() {
    return this.logManager;
  }

  protected setLog(level: KeyOfLogger, filterConfig: AnyObj, msg: any) {
    if (this.logManager.bufferLogs) {
      this.logManager.buffer.push({ filterConfig, date: new Date(), level, msg });
    } else {
      this.logger.log(level, msg);
    }
  }

  flush() {
    const { buffer } = this.logManager;
    if (typeof global.it !== 'function') {
      // This is not a test mode.
      const { filterConfig } = this.logConfig;
      let filteredBuffer = buffer;
      filteredBuffer = this.filterLogs(buffer, filterConfig);
      filteredBuffer.forEach((log) => {
        // const dateTime = log.date.toLocaleString();
        const partMsg = log.filterConfig.tags ? ` (Tags: ${log.filterConfig.tags.join(', ')})` : '';
        const msg = `${log.msg}${partMsg}`;
        this._logger.log.apply(this._logger, [log.level, msg]);
      });
    }

    buffer.splice(0);
  }

  protected filterLogs(buffer: LogItem[], outputConfig: FilterConfig = {}) {
    return buffer.filter((item) => {
      const inputConfig = item.filterConfig;
      let hasTags: boolean | undefined = true;
      let hasModuleName: boolean = true;
      let hasClassName: boolean = true;
      if (outputConfig.tags) {
        hasTags = inputConfig.tags?.some((tag) => outputConfig.tags?.includes(tag));
      }
      if (outputConfig.moduleName) {
        hasModuleName = inputConfig.moduleName == outputConfig.moduleName;
      }
      if (outputConfig.className) {
        hasClassName = inputConfig.className == outputConfig.className;
      }
      return hasModuleName && hasClassName && hasTags;
    });
  }

  /**
   * The module with ID `inputModule` has already been imported into `modIdStr`.
   */
  moduleAlreadyImported(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    const msg = `The module with ID "${format(args[0])}" has already been imported into "${args[1]}".`;
    this.setLog(level, filterConfig, msg);
  }

  /**
   * `serverName` is running at `host`:`port`.
   */
  serverListen(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    this.setLog(level, filterConfig, `${args[0]} is running at ${args[1]}:${args[2]}`);
  }

  /**
   * In `moduleName` you have token `diToken` with extension-like `className`
   * that not registered in "extensions" array.
   */
  youForgotRegisterExtension(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    let msg = `In ${args[0]} you have token "${args[1]}" `;
    msg += `with extension-like "${args[2]}" that not registered in "extensions" array`;
    this.setLog(level, filterConfig, msg);
  }

  /**
   * Start reinit the application.
   */
  startReinitApp(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    this.setLog(level, filterConfig, 'Start reinit the application.');
  }

  /**
   * Skipping autocommit of changes for config of moduleManager.
   */
  skippingAutocommitModulesConfig(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    this.setLog(level, filterConfig, 'Skipping autocommit of changes for config of moduleManager.');
  }

  /**
   * Finished reinit the application.
   */
  finishReinitApp(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    this.setLog(level, filterConfig, 'Finished reinit the application.');
  }

  /**
   * [log any error]
   */
  printReinitError(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    this.setLog(level, filterConfig, args[0]);
  }

  /**
   * Start rollback of changes for config of moduleManager during reinit the application.
   */
  startRollbackModuleConfigChanges(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    const msg = 'Start rollback of changes for config of moduleManager during reinit the application.';
    this.setLog(level, filterConfig, msg);
  }

  /**
   * Successful rollback of changes for config of moduleManager during reinit the application.
   */
  successfulRollbackModuleConfigChanges(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    const msg = 'Successful rollback of changes for config of moduleManager during reinit the application.';
    this.setLog(level, filterConfig, msg);
  }

  /**
   * Successful added `inputModuleName` to `targetModuleName`.
   */
  successfulAddedModuleToImport(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    this.setLog(level, filterConfig, `Successful added "${args[0]}" to "${args[1]}".`);
  }

  /**
   * Module with ID `moduleIdOrName` not found.
   */
  moduleNotFound(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    this.setLog(level, filterConfig, `Module with ID "${args[0]}" not found.`);
  }

  /**
   * `inputModuleName` successful removed from `hostModuleName`.
   */
  moduleSuccessfulRemoved(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    this.setLog(level, filterConfig, `${args[0]} successful removed from ${args[1]}.`);
  }

  /**
   * `moduleName` has ID: `id`.
   */
  moduleHasId(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    this.setLog(level, filterConfig, `${args[0]} has ID: "${args[1]}".`);
  }

  /**
   * [print global providers]
   */
  printGlobalProviders(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    this.setLog(level, filterConfig, { globalProviders: args[0] });
  }

  /**
   * [print module metadata]
   */
  printModuleMetadata(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    this.setLog(level, filterConfig, { modOrObj: args[0], metadata: args[1] });
  }

  /**
   * `moduleName` start init group with `groupToken`.
   */
  startExtensionsGroupInit(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    this.setLog(level, filterConfig, `${args[0]}: start init group with ${args[1]}`);
  }

  /**
   * `moduleName` finish init group with `groupToken`.
   */
  finishExtensionsGroupInit(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    this.setLog(level, filterConfig, `${args[0]}: finish init group with ${args[1]}`);
  }

  /**
   * Total inited `number` extensions: `listOfNames`.
   */
  totalInitedExtensions(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    this.setLog(level, filterConfig, `Total inited ${args[0]} extensions: ${args[1]}`);
  }

  /**
   * [print controller error]
   */
  controllerHasError(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    this.setLog(level, filterConfig, { err: args[0] });
  }

  /**
   * [internal error]
   */
  internalServerError(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    this.setLog(level, filterConfig, { err: args[0] });
  }

  /**
   * Can not activate the route with URL: `httpMethod` `URL`.
   */
  youCannotActivateRoute(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    this.setLog(level, filterConfig, `Can not activate the route with URL: ${args[0]} ${args[1]}`);
  }

  /**
   * `extensionsGroupToken`: no extensions found!
   */
  noExtensionsFound(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    this.setLog(level, filterConfig, `${args[0]}: no extensions found!`);
  }

  /**
   * `id`: `className`: start init.
   */
  startInitExtension(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    this.setLog(level, filterConfig, `${args[0]}: ${args[1]}: start init.`);
  }

  /**
   * `id`: `className`: finish init.
   */
  finishInitExtension(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    this.setLog(level, filterConfig, `${args[0]}: ${args[1]}: finish init.`);
  }

  /**
   * `id`: `className`: init returned empty value.
   */
  extensionInitReturnsVoid(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    this.setLog(level, filterConfig, `${args[0]}: ${args[1]}: init returned empty value.`);
  }

  /**
   * `id`: `className`: init returned some value.
   */
  extensionInitReturnsValue(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    this.setLog(level, filterConfig, `${args[0]}: ${args[1]}: init returned some value.`);
  }

  /**
   * The application has no routes.
   */
  noRoutes(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    this.setLog(level, filterConfig, `The ${args[0]} has no routes.`);
  }

  /**
   * [show routes].
   */
  showRoutes(level: KeyOfLogger, filterConfig: FilterConfig = {}, ...args: any[]) {
    this.setLog(level, filterConfig, args[0]);
  }
}
