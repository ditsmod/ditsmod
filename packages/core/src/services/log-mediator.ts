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
 * Used as DI token for `LogMediator` config.
 */
export class LogMediatorConfig {
  logFilter: LogFilter = {};
}

/**
 * Default type for Log buffer.
 */
export interface LogItem {
  date: Date;
  logFilter: LogFilter;
  currentLevel: LogLevel;
  messageLevel: LogLevel;
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
    @Optional() protected logConfig: LogMediatorConfig = new LogMediatorConfig()
  ) {}

  getLogManager() {
    return this.logManager;
  }

  protected setLog<T extends LogFilter>(level: LogLevel, logFilter: T, msg: any) {
    if (this.logManager.bufferLogs) {
      this.logManager.buffer.push({
        logger: this._logger,
        currentLevel: this._logger.config?.level || 'info',
        logFilter,
        date: new Date(),
        messageLevel: level,
        msg,
      });
    } else {
      this.logger.log(level, msg);
    }
  }

  /**
   * @todo Refactor this method.
   */
  flush() {
    const { buffer } = this.logManager;
    if (typeof global.it != 'function') {
      // This is not a test mode.
      const { logFilter } = this.logConfig;
      let filteredBuffer = buffer;
      filteredBuffer = this.filterLogs(buffer, logFilter);
      filteredBuffer.forEach((logItem) => {
        // const dateTime = log.date.toLocaleString();
        const partMsg = logItem.logFilter.tags ? ` (Tags: ${logItem.logFilter.tags.join(', ')})` : '';
        const msg = `${logItem.msg}${partMsg}`;
        logItem.logger.setLevel(logItem.currentLevel);

        if (!logItem.logger.log) {
          const loggerName = logItem.logger.constructor.name;
          const msg0 = `error: you need to implement "log" method in "${loggerName}";`;
          if (logItem.logger.error) {
            logItem.logger.error.call(logItem.logger, msg0, msg);
          } else {
            console.error(msg0, msg);
          }
        } else {
          logItem.logger.log.call(logItem.logger, logItem.messageLevel, msg);
        }
      });
    }

    buffer.splice(0);
  }

  protected filterLogs<T extends LogFilter>(buffer: LogItem[], outputConfig = {} as T) {
    return buffer.filter((item) => {
      const inputConfig = item.logFilter;
      let hasTags: boolean | undefined = true;
      let hasModuleName: boolean | undefined = true;
      let hasClassName: boolean | undefined = true;
      if (outputConfig.modulesNames) {
        hasModuleName = inputConfig.modulesNames?.some((modulesName) => outputConfig.modulesNames?.includes(modulesName));
      }
      if (outputConfig.classesNames) {
        hasClassName = inputConfig.classesNames?.some((className) => outputConfig.classesNames?.includes(className));
      }
      if (outputConfig.tags) {
        hasTags = inputConfig.tags?.some((tag) => outputConfig.tags?.includes(tag));
      }
      return hasModuleName && hasClassName && hasTags;
    });
  }

  /**
   * `"${moduleName}" has already been imported into "${moduleId}".`
   */
  moduleAlreadyImported(self: object, inputModule: ModuleType | ModuleWithParams, targetModuleId: string) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.classesNames = [className];
    const inputModuleId = getModuleName(inputModule);
    const msg = `${className}: "${inputModuleId}" has already been imported into "${targetModuleId}".`;
    this.setLog('warn', logFilter, msg);
  }

  /**
   * `${serverName} is running at ${host}:${port}.`
   */
  serverListen(self: object, serverName: string, host: string, port: number) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.classesNames = [className];
    this.setLog('info', logFilter, `${className}: ${serverName} is running at http://${host}:${port}.`);
  }

  /**
   * `start reinit the application.`
   */
  startReinitApp(self: object) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.classesNames = [className];
    this.setLog('debug', logFilter, `${className}: start reinit the application.`);
  }

  /**
   * `skipping autocommit of changes for config of moduleManager.`
   */
  skippingAutocommitModulesConfig(self: object) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.classesNames = [className];
    this.setLog('warn', logFilter, `${className}: skipping autocommit of changes for config of moduleManager.`);
  }

  /**
   * `finished reinit the application.`
   */
  finishReinitApp(self: object) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.classesNames = [className];
    this.setLog('debug', logFilter, `${className}: finished reinit the application.`);
  }

  /**
   * [log any error]
   */
  printReinitError(self: object, err: any) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.classesNames = [className];
    this.setLog('error', logFilter, err);
  }

  /**
   * `start rollback of changes for config of moduleManager during reinit the application.`
   */
  startRollbackModuleConfigChanges(self: object) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.classesNames = [className];
    const msg = `${className}: start rollback of changes for config of moduleManager during reinit the application.`;
    this.setLog('debug', logFilter, msg);
  }

  /**
   * `successful rollback of changes for config of moduleManager during reinit the application.`
   */
  successfulRollbackModuleConfigChanges(self: object) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.classesNames = [className];
    const msg = `${className}: successful rollback of changes for config of moduleManager during reinit the application.`;
    this.setLog('debug', logFilter, msg);
  }

  /**
   * `successful added "${inputModuleName}" to "${targetMetaName}".`
   */
  successfulAddedModuleToImport(self: object, inputModule: ModuleType | ModuleWithParams, targetMetaName: string) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.classesNames = [className];
    const inputModuleName = getModuleName(inputModule);
    this.setLog('debug', logFilter, `${className}: successful added "${inputModuleName}" to "${targetMetaName}".`);
  }

  /**
   * `module with ID "${moduleId}" not found.`
   */
  moduleNotFound(self: object, moduleId: string) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.classesNames = [className];
    this.setLog('warn', logFilter, `${className}: module with ID "${moduleId}" not found.`);
  }

  /**
   * `${inputMetaName} successful removed from ${targetMetaName}.`
   */
  moduleSuccessfulRemoved(self: object, inputMetaName: string, targetMetaName: string) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.classesNames = [className];
    this.setLog('debug', logFilter, `${className}: ${inputMetaName} successful removed from ${targetMetaName}.`);
  }

  /**
   * `${moduleName} has ID: "${moduleId}".`
   */
  moduleHasId(self: object, moduleName: string, moduleId: string) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.classesNames = [className];
    this.setLog('trace', logFilter, `${className}: ${moduleName} has ID: "${moduleId}".`);
  }

  /**
- AppInitializer: global providers per a module: []
- AppInitializer: global providers per a route: []
- AppInitializer: global providers per a request: []
   */
  printGlobalProviders(self: object, globalProviders: GlobalProviders) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.classesNames = [className];
    const globalProvidersPerMod = this.getProvidersNames(globalProviders.importedProvidersPerMod);
    const globalProvidersPerRou = this.getProvidersNames(globalProviders.importedProvidersPerRou);
    const globalProvidersPerReq = this.getProvidersNames(globalProviders.importedProvidersPerReq);
    const prefix = `${className}: global providers per a`;
    this.setLog('debug', logFilter, `${className}: global providers are collected.`);
    this.setLog('trace', logFilter, `${prefix} module: [${globalProvidersPerMod}]`);
    this.setLog('trace', logFilter, `${prefix} route: [${globalProvidersPerRou}]`);
    this.setLog('trace', logFilter, `${prefix} request: [${globalProvidersPerReq}]`);
  }

  protected getProvidersNames(providersMap: Map<any, ImportObj<ServiceProvider>>) {
    return getImportedTokens(providersMap).map(getProviderName).join(', ');
  }

  /**
   * ================== ModuleName ======================.
   */
  startExtensionsModuleInit(self: object, moduleName: string) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.modulesNames = [moduleName];
    logFilter.classesNames = [className];
    this.setLog('debug', logFilter, `${className}: ${'='.repeat(20)} ${moduleName} ${'='.repeat(20)}`);
  }

  /**
   * `${tokenName} start init.`
   */
  startExtensionsGroupInit(self: object, moduleName: string, unfinishedInit: Set<Extension<any> | ExtensionsGroupToken<any>>) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.modulesNames = [moduleName];
    logFilter.classesNames = [className];
    const path = this.getExtentionPath(unfinishedInit);
    this.setLog('trace', logFilter, `${className}: ${path}: start init.`);
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
    const logFilter = new LogFilter();
    logFilter.modulesNames = [moduleName];
    logFilter.classesNames = [className];
    const path = this.getExtentionPath(unfinishedInit);
    this.setLog('trace', logFilter, `${className}: ${path}: finish init.`);
  }

  /**
   * `for ${tokenName} no extensions found.`
   */
  noExtensionsFound(self: object, groupToken: any) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.classesNames = [className];
    const tokenName = getProviderName(groupToken);
    this.setLog('trace', logFilter, `${className}: for ${tokenName} no extensions found.`);
  }

  /**
   * `${path}: start init.`
   */
  startInitExtension(self: object, unfinishedInit: Set<Extension<any> | ExtensionsGroupToken<any>>) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.classesNames = [className];
    const path = this.getExtentionPath(unfinishedInit);
    this.setLog('trace', logFilter, `${className}: ${path}: start init.`);
  }

  /**
   * `${path}: finish init${withSomeValue}.`
   */
  finishInitExtension(self: object, unfinishedInit: Set<Extension<any> | ExtensionsGroupToken<any>>, data: any) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.classesNames = [className];
    const path = this.getExtentionPath(unfinishedInit);
    const withSomeValue = data === undefined ? ', no value returned' : ', returned some value';
    this.setLog('trace', logFilter, `${className}: ${path}: finish init${withSomeValue}.`);
  }

  /**
   * `total inited ${extensionsNum} extensions: ${extensionsNames}.`
   */
  totalInitedExtensions(self: object, moduleName: string, extensionsNum: number, extensionsNames: string) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.modulesNames = [moduleName];
    logFilter.classesNames = [className];
    const msg = `${className}: total inited ${extensionsNum} extensions: ${extensionsNames}.`;
    this.setLog('debug', logFilter, msg);
  }

  /**
   * [print controller error]
   */
  controllerHasError(self: object, err: any) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.classesNames = [className];
    this.setLog('error', logFilter, err);
  }

  /**
   * [internal error]
   */
  internalServerError(self: object, err: any) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.classesNames = [className];
    this.setLog('error', logFilter, err);
  }

  /**
   * `can not activate the route with URL: ${httpMethod} ${url}.`
   */
  youCannotActivateRoute(self: object, httpMethod: string, url: string) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.classesNames = [className];
    this.setLog('debug', logFilter, `${className}: can not activate the route with URL: ${httpMethod} ${url}.`);
  }

  /**
   * `the application has no routes.`
   */
  noRoutes(self: object) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.classesNames = [className];
    this.setLog('warn', logFilter, `${className}: the application has no routes.`);
  }

  /**
   * `setted route ${httpMethod} "/${path}"`.
   */
  printRoute(self: object, moduleName: string, httpMethod: string, path: string) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.classesNames = [className];
    logFilter.modulesNames = [moduleName];
    this.setLog('debug', logFilter, `${className}: setted route ${httpMethod} "/${path}".`);
  }
}
