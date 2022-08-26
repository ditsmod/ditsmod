import { Injectable, Optional } from '@ts-stack/di';

import { isInjectionToken } from '../utils/type-guards';
import { Logger, LogLevel } from '../types/logger';
import { GlobalProviders, ImportObj } from '../types/metadata-per-mod';
import { Extension, ExtensionsGroupToken, ModuleType, ModuleWithParams, ServiceProvider } from '../types/mix';
import { getImportedTokens } from '../utils/get-imports';
import { getModuleName } from '../utils/get-module-name';
import { getProviderName } from '../utils/get-provider-name';
import { ConsoleLogger } from './console-logger';
import { LogManager } from './log-manager';

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
  modulesName?: string;
  classesName?: string;
  tags?: string[];
}

/**
 * Default type for Log buffer.
 */
export interface LogItem {
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
 *
 * If you want to rewrite messages written by the core logger, you need:
 * 1. override the methods of this class in your own class;
 * 2. via DI, at the application level, substitute the `LogMediator` class with your class.
 */
@Injectable()
export class LogMediator {
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
    @Optional() protected _logger: Logger = new ConsoleLogger(),
    @Optional() protected logFilter: LogFilter = new LogFilter()
  ) {}

  getLogManager() {
    return this.logManager;
  }

  protected setLog<T extends MsgLogFilter>(msgLevel: LogLevel, msgLogFilter: T, msg: any) {
    if (this.logManager.bufferLogs) {
      const loggerLevel: LogLevel = typeof this._logger.getLevel == 'function' ? this._logger.getLevel() : 'info';

      this.logManager.buffer.push({
        logger: this._logger,
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

  /**
   * @todo Refactor this method.
   */
  flush() {
    const { buffer } = this.logManager;
    if (typeof (global as any).it != 'function') {
      // This is not a test mode.
      let filteredBuffer = buffer;
      filteredBuffer = this.filterLogs(buffer);
      filteredBuffer.forEach((logItem) => {
        // const dateTime = log.date.toLocaleString();
        const partMsg = logItem.msgLogFilter.tags ? ` (Tags: ${logItem.msgLogFilter.tags.join(', ')})` : '';
        const msg = `${logItem.msg}${partMsg}`;
        logItem.logger.setLevel(logItem.loggerLevel);

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

    buffer.splice(0);
  }

  protected filterLogs(buffer: LogItem[]) {
    return buffer.filter((item) => {
      const { msgLogFilter, loggerLogFilter } = item;
      let hasTags: boolean | undefined = true;
      let hasModuleName: boolean | undefined = true;
      let hasClassName: boolean | undefined = true;
      if (loggerLogFilter!.modulesNames) {
        hasModuleName = loggerLogFilter!.modulesNames?.includes(msgLogFilter.modulesName || '');
      }
      if (loggerLogFilter!.classesNames) {
        hasClassName = loggerLogFilter!.classesNames?.includes(msgLogFilter.classesName || '');
      }
      if (loggerLogFilter!.tags) {
        hasTags = msgLogFilter.tags?.some((tag) => loggerLogFilter!.tags?.includes(tag));
      }
      return hasModuleName && hasClassName && hasTags;
    });
  }

  /**
   * `"${moduleName}" has already been imported into "${moduleId}".`
   */
  moduleAlreadyImported(self: object, inputModule: ModuleType | ModuleWithParams, targetModuleId: string) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    const inputModuleId = getModuleName(inputModule);
    const msg = `${className}: "${inputModuleId}" has already been imported into "${targetModuleId}".`;
    this.setLog('warn', msgLogFilter, msg);
  }

  /**
   * `${serverName} is running at ${host}:${port}.`
   */
  serverListen(self: object, serverName: string, host: string, port: number) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    this.setLog('info', msgLogFilter, `${className}: ${serverName} is running at http://${host}:${port}.`);
  }

  /**
   * `start reinit the application.`
   */
  startReinitApp(self: object) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    this.setLog('debug', msgLogFilter, `${className}: start reinit the application.`);
  }

  /**
   * `skipping autocommit of changes for config of moduleManager.`
   */
  skippingAutocommitModulesConfig(self: object) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    this.setLog('warn', msgLogFilter, `${className}: skipping autocommit of changes for config of moduleManager.`);
  }

  /**
   * `finished reinit the application.`
   */
  finishReinitApp(self: object) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    this.setLog('debug', msgLogFilter, `${className}: finished reinit the application.`);
  }

  /**
   * [log any error]
   */
  printReinitError(self: object, err: any) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    this.setLog('error', msgLogFilter, err);
  }

  /**
   * `start rollback of changes for config of moduleManager during reinit the application.`
   */
  startRollbackModuleConfigChanges(self: object) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    const msg = `${className}: start rollback of changes for config of moduleManager during reinit the application.`;
    this.setLog('debug', msgLogFilter, msg);
  }

  /**
   * `successful rollback of changes for config of moduleManager during reinit the application.`
   */
  successfulRollbackModuleConfigChanges(self: object) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    const msg = `${className}: successful rollback of changes for config of moduleManager during reinit the application.`;
    this.setLog('debug', msgLogFilter, msg);
  }

  /**
   * `successful added "${inputModuleName}" to "${targetMetaName}".`
   */
  successfulAddedModuleToImport(self: object, inputModule: ModuleType | ModuleWithParams, targetMetaName: string) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    const inputModuleName = getModuleName(inputModule);
    this.setLog('debug', msgLogFilter, `${className}: successful added "${inputModuleName}" to "${targetMetaName}".`);
  }

  /**
   * `module with ID "${moduleId}" not found.`
   */
  moduleNotFound(self: object, moduleId: string) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    this.setLog('warn', msgLogFilter, `${className}: module with ID "${moduleId}" not found.`);
  }

  /**
   * `${inputMetaName} successful removed from ${targetMetaName}.`
   */
  moduleSuccessfulRemoved(self: object, inputMetaName: string, targetMetaName: string) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    this.setLog('debug', msgLogFilter, `${className}: ${inputMetaName} successful removed from ${targetMetaName}.`);
  }

  /**
   * `${moduleName} has ID: "${moduleId}".`
   */
  moduleHasId(self: object, moduleName: string, moduleId: string) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    this.setLog('trace', msgLogFilter, `${className}: ${moduleName} has ID: "${moduleId}".`);
  }

  /**
- AppInitializer: global providers per a module: []
- AppInitializer: global providers per a route: []
- AppInitializer: global providers per a request: []
   */
  printGlobalProviders(self: object, globalProviders: GlobalProviders) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    const globalProvidersPerMod = this.getProvidersNames(globalProviders.importedProvidersPerMod);
    const globalProvidersPerRou = this.getProvidersNames(globalProviders.importedProvidersPerRou);
    const globalProvidersPerReq = this.getProvidersNames(globalProviders.importedProvidersPerReq);
    const prefix = `${className}: global providers per a`;
    this.setLog('debug', msgLogFilter, `${className}: global providers are collected.`);
    this.setLog('trace', msgLogFilter, `${prefix} module: [${globalProvidersPerMod}]`);
    this.setLog('trace', msgLogFilter, `${prefix} route: [${globalProvidersPerRou}]`);
    this.setLog('trace', msgLogFilter, `${prefix} request: [${globalProvidersPerReq}]`);
  }

  protected getProvidersNames(providersMap: Map<any, ImportObj<ServiceProvider>>) {
    return getImportedTokens(providersMap).map(getProviderName).join(', ');
  }

  /**
   * ================== ModuleName ======================.
   */
  startExtensionsModuleInit(self: object, moduleName: string) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.modulesName = moduleName;
    msgLogFilter.classesName = className;
    this.setLog('debug', msgLogFilter, `${className}: ${'='.repeat(20)} ${moduleName} ${'='.repeat(20)}`);
  }

  /**
   * `${tokenName} start init.`
   */
  startExtensionsGroupInit(self: object, moduleName: string, unfinishedInit: Set<Extension<any> | ExtensionsGroupToken<any>>) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.modulesName = moduleName;
    msgLogFilter.classesName = className;
    const path = this.getExtentionPath(unfinishedInit);
    this.setLog('trace', msgLogFilter, `${className}: ${path}: start init.`);
  }

  protected getExtentionPath(unfinishedInit: Set<Extension<any> | ExtensionsGroupToken<any>>) {
    return [...unfinishedInit].map((tokenOrExtension) => {
      if (isInjectionToken(tokenOrExtension) || typeof tokenOrExtension == 'string') {
        return getProviderName(tokenOrExtension);
      } else {
        return tokenOrExtension.constructor.name;
      }
    }).join(' -> ');
  }

  /**
   * `finish init ${tokenName}.`
   */
  finishExtensionsGroupInit(self: object, moduleName: string, unfinishedInit: Set<Extension<any> | ExtensionsGroupToken<any>>) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.modulesName = moduleName;
    msgLogFilter.classesName = className;
    const path = this.getExtentionPath(unfinishedInit);
    this.setLog('trace', msgLogFilter, `${className}: ${path}: finish init.`);
  }

  /**
   * `for ${tokenName} no extensions found.`
   */
  noExtensionsFound(self: object, groupToken: any) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    const tokenName = getProviderName(groupToken);
    this.setLog('trace', msgLogFilter, `${className}: for ${tokenName} no extensions found.`);
  }

  /**
   * `${path}: start init.`
   */
  startInitExtension(self: object, unfinishedInit: Set<Extension<any> | ExtensionsGroupToken<any>>) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    const path = this.getExtentionPath(unfinishedInit);
    this.setLog('trace', msgLogFilter, `${className}: ${path}: start init.`);
  }

  /**
   * `${path}: finish init${withSomeValue}.`
   */
  finishInitExtension(self: object, unfinishedInit: Set<Extension<any> | ExtensionsGroupToken<any>>, data: any) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    const path = this.getExtentionPath(unfinishedInit);
    const withSomeValue = data === undefined ? ', no value returned' : ', returned some value';
    this.setLog('trace', msgLogFilter, `${className}: ${path}: finish init${withSomeValue}.`);
  }

  /**
   * `total inited ${extensionsNum} extensions: ${extensionsNames}.`
   */
  totalInitedExtensions(self: object, moduleName: string, extensionsNum: number, extensionsNames: string) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.modulesName = moduleName;
    msgLogFilter.classesName = className;
    const msg = `${className}: total inited ${extensionsNum} extensions: ${extensionsNames}.`;
    this.setLog('debug', msgLogFilter, msg);
  }

  /**
   * [print controller error]
   */
  controllerHasError(self: object, err: any) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    this.setLog('error', msgLogFilter, err);
  }

  /**
   * [internal error]
   */
  internalServerError(self: object, err: any) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    this.setLog('error', msgLogFilter, err);
  }

  /**
   * `can not activate the route with URL: ${httpMethod} ${url}.`
   */
  youCannotActivateRoute(self: object, httpMethod: string, url: string) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    this.setLog('debug', msgLogFilter, `${className}: can not activate the route with URL: ${httpMethod} ${url}.`);
  }

  /**
   * `the application has no routes.`
   */
  noRoutes(self: object) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    this.setLog('warn', msgLogFilter, `${className}: the application has no routes.`);
  }

  /**
   * `setted route ${httpMethod} "/${path}"`.
   */
  printRoute(self: object, moduleName: string, httpMethod: string, path: string) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    msgLogFilter.modulesName = moduleName;
    this.setLog('debug', msgLogFilter, `${className}: setted route ${httpMethod} "/${path}".`);
  }
}
