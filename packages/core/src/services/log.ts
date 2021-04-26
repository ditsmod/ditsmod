import { Injectable } from '@ts-stack/di';
import { format } from 'util';

import { Logger } from '../types/logger';

@Injectable()
export class Log {
  protected _logger: Logger;

  constructor(logger: Logger) {
    this.setLogger(logger);
  }

  setLogger(logger: Logger) {
    this._logger = logger;
  }

  get logger() {
    return this._logger;
  }

  /**
   * The module with ID `inputModule` has already been imported into `modIdStr`.
   */
  moduleAlreadyImported(level: keyof Logger, args: any[] = []) {
    this._logger.log(level, `The module with ID "${format(args[0])}" has already been imported into "${args[1]}".`);
  }

  /**
   * `serverName` is running at `host`:`port`.
   */
  serverListen(level: keyof Logger, args: any[] = []) {
    this._logger.log(level, `${args[0]} is running at ${args[1]}:${args[2]}`);
  }

  /**
   * In `moduleName` you have token `diToken` with extension-like `className`
   * that not registered in "extensions" array.
   */
  youForgotRegisterExtension(level: keyof Logger, args: any[] = []) {
    let msg = `In ${args[0]} you have token "${args[1]}" `;
    msg += `with extension-like "${args[2]}" that not registered in "extensions" array`;
    this._logger.log(level, msg);
  }

  /**
   * Start reinit the application.
   */
  startReinitApp(level: keyof Logger, args: any[] = []) {
    this._logger.log(level, 'Start reinit the application.');
  }

  /**
   * Skipping autocommit of changes for config of moduleManager.
   */
  skippingAutocommitModulesConfig(level: keyof Logger, args: any[] = []) {
    this._logger.log(level, 'Skipping autocommit of changes for config of moduleManager.');
  }

  /**
   * Finished reinit the application.
   */
  finishReinitApp(level: keyof Logger, args: any[] = []) {
    this._logger.log(level, 'Finished reinit the application.');
  }

  /**
   * [log any error]
   */
  printReinitError(level: keyof Logger, args: any[] = []) {
    this._logger.log(level, args[0]);
  }

  /**
   * Start rollback of changes for config of moduleManager during reinit the application.
   */
  startRollbackModuleConfigChanges(level: keyof Logger, args: any[] = []) {
    this._logger.log(level, 'Start rollback of changes for config of moduleManager during reinit the application.');
  }

  /**
   * Successful rollback of changes for config of moduleManager during reinit the application.
   */
  successfulRollbackModuleConfigChanges(level: keyof Logger, args: any[] = []) {
    this._logger.log(
      level,
      'Successful rollback of changes for config of moduleManager during reinit the application.'
    );
  }

  /**
   * Successful added `inputModuleName` to `targetModuleName`.
   */
  successfulAddedModuleToImport(level: keyof Logger, args: any[] = []) {
    this._logger.log(level, `Successful added "${args[0]}" to "${args[1]}".`);
  }

  /**
   * Module with ID `moduleIdOrName` not found.
   */
  moduleNotFound(level: keyof Logger, args: any[] = []) {
    this._logger.log(level, `Module with ID "${args[0]}" not found.`);
  }

  /**
   * `inputModuleName` successful removed from `hostModuleName`.
   */
  moduleSuccessfulRemoved(level: keyof Logger, args: any[] = []) {
    this._logger.log(level, `${args[0]} successful removed from ${args[1]}.`);
  }

  /**
   * `moduleName` has ID: `id`.
   */
  moduleHasId(level: keyof Logger, args: any[] = []) {
    this._logger.log(level, `${args[0]} has ID: "${args[1]}".`);
  }

  /**
   * [print global providers]
   */
  printGlobalProviders(level: keyof Logger, args: any[] = []) {
    this._logger.log(level, { globalProviders: args[0] });
  }

  /**
   * [print module metadata]
   */
  printModuleMetadata(level: keyof Logger, args: any[] = []) {
    this._logger.log(level, { modOrObj: args[0], metadata: args[1] });
  }

  /**
   * `moduleName` start init group with `groupToken`.
   */
  startExtensionsGroupInit(level: keyof Logger, args: any[] = []) {
    this._logger.log(level, `${args[0]}: start init group with ${args[1]}`);
  }

  /**
   * `moduleName` finish init group with `groupToken`.
   */
   finishExtensionsGroupInit(level: keyof Logger, args: any[] = []) {
    this._logger.log(level, `${args[0]}: finish init group with ${args[1]}`);
  }

  /**
   * Total inited `number` extensions: `listOfNames`.
   */
   totalInitedExtensions(level: keyof Logger, args: any[] = []) {
    this._logger.log(level, `Total inited ${args[0]} extensions: ${args[1]}`);
  }

  /**
   * [print controller error]
   */
   controllerHasError(level: keyof Logger, args: any[] = []) {
    this._logger.log(level, { err: args[0] });
  }

  /**
   * [internal error]
   */
   internalServerError(level: keyof Logger, args: any[] = []) {
    this._logger.log(level, { err: args[0] });
  }

  /**
   * Can not activate the route with URL: `httpMethod` `URL`.
   */
   youCannotActivateRoute(level: keyof Logger, args: any[] = []) {
    this._logger.log(level, `Can not activate the route with URL: ${args[0]} ${args[1]}`);
  }

  /**
   * `extensionsGroupToken`: no extensions found!
   */
   noExtensionsFound(level: keyof Logger, args: any[] = []) {
    this._logger.log(level, `${args[0]}: no extensions found!`);
  }

  /**
   * `id`: `className`: start init.
   */
   startInitExtension(level: keyof Logger, args: any[] = []) {
    this._logger.log(level, `${args[0]}: ${args[1]}: start init.`);
  }

  /**
   * `id`: `className`: finish init.
   */
   finishInitExtension(level: keyof Logger, args: any[] = []) {
    this._logger.log(level, `${args[0]}: ${args[1]}: finish init.`);
  }

  /**
   * `id`: `className`: init returned empty value.
   */
   extensionInitReturnsVoid(level: keyof Logger, args: any[] = []) {
    this._logger.log(level, `${args[0]}: ${args[1]}: init returned empty value.`);
  }

  /**
   * `id`: `className`: init returned some value.
   */
   extensionInitReturnsValue(level: keyof Logger, args: any[] = []) {
    this._logger.log(level, `${args[0]}: ${args[1]}: init returned some value.`);
  }
}
