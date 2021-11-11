import { Injectable } from '@ts-stack/di';
import { format } from 'util';

import { Logger } from '../types/logger';
import { LogManager } from './log-manager';

/**
 * Default type for Log buffer.
 */
export interface LogItem {
  date: Date;
  level: keyof Logger;
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
  protected _logger: Logger;

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

  constructor(logger: Logger, protected logManager: LogManager) {
    this.logger = logger;
  }

  getLogManager() {
    return this.logManager;
  }

  protected setLog(level: keyof Logger, msg: any) {
    if (this.logManager.bufferLogs) {
      this.logManager.buffer.push({ date: new Date(), level, msg });
    } else {
      this.logger.log(level, msg);
    }
  }

  flush() {
    if (typeof global.it !== 'function') {
      // This is not a test mode.
      this.logManager.buffer.forEach((log) => {
        const dateTime = log.date.toLocaleString();
        const msg = `${dateTime}: ${log.msg}`;
        this._logger.log.apply(this._logger, [log.level, msg]);
      });
    }

    this.logManager.buffer.splice(0);
  }

  /**
   * The module with ID `inputModule` has already been imported into `modIdStr`.
   */
  moduleAlreadyImported(level: keyof Logger, ...args: any[]) {
    this.setLog(level, `The module with ID "${format(args[0])}" has already been imported into "${args[1]}".`);
  }

  /**
   * `serverName` is running at `host`:`port`.
   */
  serverListen(level: keyof Logger, ...args: any[]) {
    this.setLog(level, `${args[0]} is running at ${args[1]}:${args[2]}`);
  }

  /**
   * In `moduleName` you have token `diToken` with extension-like `className`
   * that not registered in "extensions" array.
   */
  youForgotRegisterExtension(level: keyof Logger, ...args: any[]) {
    let msg = `In ${args[0]} you have token "${args[1]}" `;
    msg += `with extension-like "${args[2]}" that not registered in "extensions" array`;
    this.setLog(level, msg);
  }

  /**
   * Start reinit the application.
   */
  startReinitApp(level: keyof Logger, ...args: any[]) {
    this.setLog(level, 'Start reinit the application.');
  }

  /**
   * Skipping autocommit of changes for config of moduleManager.
   */
  skippingAutocommitModulesConfig(level: keyof Logger, ...args: any[]) {
    this.setLog(level, 'Skipping autocommit of changes for config of moduleManager.');
  }

  /**
   * Finished reinit the application.
   */
  finishReinitApp(level: keyof Logger, ...args: any[]) {
    this.setLog(level, 'Finished reinit the application.');
  }

  /**
   * [log any error]
   */
  printReinitError(level: keyof Logger, ...args: any[]) {
    this.setLog(level, args[0]);
  }

  /**
   * Start rollback of changes for config of moduleManager during reinit the application.
   */
  startRollbackModuleConfigChanges(level: keyof Logger, ...args: any[]) {
    this.setLog(level, 'Start rollback of changes for config of moduleManager during reinit the application.');
  }

  /**
   * Successful rollback of changes for config of moduleManager during reinit the application.
   */
  successfulRollbackModuleConfigChanges(level: keyof Logger, ...args: any[]) {
    this.setLog(level, 'Successful rollback of changes for config of moduleManager during reinit the application.');
  }

  /**
   * Successful added `inputModuleName` to `targetModuleName`.
   */
  successfulAddedModuleToImport(level: keyof Logger, ...args: any[]) {
    this.setLog(level, `Successful added "${args[0]}" to "${args[1]}".`);
  }

  /**
   * Module with ID `moduleIdOrName` not found.
   */
  moduleNotFound(level: keyof Logger, ...args: any[]) {
    this.setLog(level, `Module with ID "${args[0]}" not found.`);
  }

  /**
   * `inputModuleName` successful removed from `hostModuleName`.
   */
  moduleSuccessfulRemoved(level: keyof Logger, ...args: any[]) {
    this.setLog(level, `${args[0]} successful removed from ${args[1]}.`);
  }

  /**
   * `moduleName` has ID: `id`.
   */
  moduleHasId(level: keyof Logger, ...args: any[]) {
    this.setLog(level, `${args[0]} has ID: "${args[1]}".`);
  }

  /**
   * [print global providers]
   */
  printGlobalProviders(level: keyof Logger, ...args: any[]) {
    this.setLog(level, { globalProviders: args[0] });
  }

  /**
   * [print module metadata]
   */
  printModuleMetadata(level: keyof Logger, ...args: any[]) {
    this.setLog(level, { modOrObj: args[0], metadata: args[1] });
  }

  /**
   * `moduleName` start init group with `groupToken`.
   */
  startExtensionsGroupInit(level: keyof Logger, ...args: any[]) {
    this.setLog(level, `${args[0]}: start init group with ${args[1]}`);
  }

  /**
   * `moduleName` finish init group with `groupToken`.
   */
  finishExtensionsGroupInit(level: keyof Logger, ...args: any[]) {
    this.setLog(level, `${args[0]}: finish init group with ${args[1]}`);
  }

  /**
   * Total inited `number` extensions: `listOfNames`.
   */
  totalInitedExtensions(level: keyof Logger, ...args: any[]) {
    this.setLog(level, `Total inited ${args[0]} extensions: ${args[1]}`);
  }

  /**
   * [print controller error]
   */
  controllerHasError(level: keyof Logger, ...args: any[]) {
    this.setLog(level, { err: args[0] });
  }

  /**
   * [internal error]
   */
  internalServerError(level: keyof Logger, ...args: any[]) {
    this.setLog(level, { err: args[0] });
  }

  /**
   * Can not activate the route with URL: `httpMethod` `URL`.
   */
  youCannotActivateRoute(level: keyof Logger, ...args: any[]) {
    this.setLog(level, `Can not activate the route with URL: ${args[0]} ${args[1]}`);
  }

  /**
   * `extensionsGroupToken`: no extensions found!
   */
  noExtensionsFound(level: keyof Logger, ...args: any[]) {
    this.setLog(level, `${args[0]}: no extensions found!`);
  }

  /**
   * `id`: `className`: start init.
   */
  startInitExtension(level: keyof Logger, ...args: any[]) {
    this.setLog(level, `${args[0]}: ${args[1]}: start init.`);
  }

  /**
   * `id`: `className`: finish init.
   */
  finishInitExtension(level: keyof Logger, ...args: any[]) {
    this.setLog(level, `${args[0]}: ${args[1]}: finish init.`);
  }

  /**
   * `id`: `className`: init returned empty value.
   */
  extensionInitReturnsVoid(level: keyof Logger, ...args: any[]) {
    this.setLog(level, `${args[0]}: ${args[1]}: init returned empty value.`);
  }

  /**
   * `id`: `className`: init returned some value.
   */
  extensionInitReturnsValue(level: keyof Logger, ...args: any[]) {
    this.setLog(level, `${args[0]}: ${args[1]}: init returned some value.`);
  }

  /**
   * The application has no routes.
   */
  noRoutes(level: keyof Logger, ...args: any[]) {
    this.setLog(level, `The application has no routes.`);
  }

  /**
   * [show routes].
   */
  showRoutes(level: keyof Logger, ...args: any[]) {
    this.setLog(level, args[0]);
  }

  /**
   * [errorDuringAddingSiblings].
   */
  errorDuringAddingSiblings(level: keyof Logger, ...args: any[]) {
    const err = args[0] as Error;
    this.setLog(level, err.message);
  }
}
