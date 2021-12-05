import { Injectable, Optional } from '@ts-stack/di';

import { Logger } from '../types/logger';
import { GlobalProviders, ImportObj } from '../types/metadata-per-mod';
import { AnyObj, Extension, ModuleType, ModuleWithParams, ServiceProvider } from '../types/mix';
import { getImportedTokens } from '../utils/get-imports';
import { getModuleName } from '../utils/get-module-name';
import { getProviderName } from '../utils/get-provider-name';
import { DefaultLogger } from './default-logger';
import { LogManager } from './log-manager';

type KeyOfLogger = keyof Logger;

export class FilterConfig {
  moduleName?: string;
  className?: string;
  tags?: string[];
}
/**
 * Used as DI token for `LogMediator` config.
 */
export class LogMediatorConfig {
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
    @Optional() protected _logger: Logger = new DefaultLogger(),
    @Optional() protected logConfig: LogMediatorConfig = new LogMediatorConfig()
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
   * The module with ID `inputModule` has already been imported into `moduleId`.
   */
  moduleAlreadyImported(self: object, inputModule: ModuleType | ModuleWithParams, moduleId: string) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.className = className;
    const moduleName = getModuleName(inputModule);
    const msg = `${className}: the module with ID "${moduleName}" has already been imported into "${moduleId}".`;
    this.setLog('warn', filterConfig, msg);
  }

  /**
   * `serverName` is running at `host`:`port`.
   */
  serverListen(self: object, serverName: string, host: string, port: number) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.className = className;
    this.setLog('info', filterConfig, `${className}: ${serverName} is running at ${host}:${port}`);
  }

  /**
   * Start reinit the application.
   */
  startReinitApp(self: object) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.className = className;
    this.setLog('debug', filterConfig, `${className}: start reinit the application.`);
  }

  /**
   * Skipping autocommit of changes for config of moduleManager.
   */
  skippingAutocommitModulesConfig(self: object) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.className = className;
    this.setLog('warn', filterConfig, `${className}: skipping autocommit of changes for config of moduleManager.`);
  }

  /**
   * Finished reinit the application.
   */
  finishReinitApp(self: object) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.className = className;
    this.setLog('debug', filterConfig, `${className}: finished reinit the application.`);
  }

  /**
   * [log any error]
   */
  printReinitError(self: object, err: any) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.className = className;
    this.setLog('error', filterConfig, { err, info: className });
  }

  /**
   * Start rollback of changes for config of moduleManager during reinit the application.
   */
  startRollbackModuleConfigChanges(self: object) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.className = className;
    const msg = `${className}: start rollback of changes for config of moduleManager during reinit the application.`;
    this.setLog('debug', filterConfig, msg);
  }

  /**
   * Successful rollback of changes for config of moduleManager during reinit the application.
   */
  successfulRollbackModuleConfigChanges(self: object) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.className = className;
    const msg = `${className}: successful rollback of changes for config of moduleManager during reinit the application.`;
    this.setLog('debug', filterConfig, msg);
  }

  /**
   * Successful added `inputModuleName` to `targetModuleName`.
   */
  successfulAddedModuleToImport(self: object, inputModule: ModuleType | ModuleWithParams, targetMetaName: string) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.className = className;
    const inputModuleName = getModuleName(inputModule);
    this.setLog('debug', filterConfig, `${className}: successful added "${inputModuleName}" to "${targetMetaName}".`);
  }

  /**
   * Module with ID `moduleIdOrName` not found.
   */
  moduleNotFound(self: object, moduleId: string) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.className = className;
    this.setLog('warn', filterConfig, `${className}: module with ID "${moduleId}" not found.`);
  }

  /**
   * `inputModuleName` successful removed from `hostModuleName`.
   */
  moduleSuccessfulRemoved(self: object, inputMetaName: string, targetMetaName: string) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.className = className;
    this.setLog('debug', filterConfig, `${className}: ${inputMetaName} successful removed from ${targetMetaName}.`);
  }

  /**
   * `moduleName` has ID: `id`.
   */
  moduleHasId(self: object, moduleName: string, moduleId: string) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.className = className;
    this.setLog('trace', filterConfig, `${className}: ${moduleName} has ID: "${moduleId}".`);
  }

  /**
- AppInitializer: global providers per a module: []
- AppInitializer: global providers per a route: []
- AppInitializer: global providers per a request: []
   */
  printGlobalProviders(self: object, globalProviders: GlobalProviders) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.className = className;
    const globalProvidersPerMod = this.getProvidersNames(globalProviders.importsPerMod);
    const globalProvidersPerRou = this.getProvidersNames(globalProviders.importsPerRou);
    const globalProvidersPerReq = this.getProvidersNames(globalProviders.importsPerReq);
    const prefix = `${className}: global providers per a`;
    this.setLog('debug', filterConfig, `${className}: global providers are collected.`);
    this.setLog('trace', filterConfig, `${prefix} module: [${globalProvidersPerMod}]`);
    this.setLog('trace', filterConfig, `${prefix} route: [${globalProvidersPerRou}]`);
    this.setLog('trace', filterConfig, `${prefix} request: [${globalProvidersPerReq}]`);
  }

  protected getProvidersNames(providersMap: Map<any, ImportObj<ServiceProvider>>) {
    return getImportedTokens(providersMap).map(getProviderName).join(', ');
  }

  /**
   * [moduleName] start init group with [groupToken].
   */
  startExtensionsModuleInit(self: object, moduleName: string) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.moduleName = moduleName;
    filterConfig.className = className;
    this.setLog('trace', filterConfig, `${className}: ${'='.repeat(20)} ${moduleName} ${'='.repeat(20)}`);
  }

  /**
   * [moduleName] start init group with [groupToken].
   */
  startExtensionsGroupInit(self: object, moduleName: string, groupToken: any) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.moduleName = moduleName;
    filterConfig.className = className;
    const tokenName = getProviderName(groupToken);
    this.setLog('trace', filterConfig, `${className}: start init ${tokenName}`);
  }

  /**
   * [moduleName] finish init group with [groupToken].
   */
  finishExtensionsGroupInit(self: object, moduleName: string, groupToken: any) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.moduleName = moduleName;
    filterConfig.className = className;
    const tokenName = getProviderName(groupToken);
    this.setLog('trace', filterConfig, `${className}: finish init ${tokenName}`);
  }

  /**
   * `extensionsGroupToken`: no extensions found.
   */
  noExtensionsFound(self: object, groupToken: any) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.className = className;
    const tokenName = getProviderName(groupToken);
    this.setLog('trace', filterConfig, `${className}: for ${tokenName} no extensions found.`);
  }

  /**
   * `id`: `className`: start init.
   */
  startInitExtension(self: object, unfinishedInitExtensions: Set<Extension<any>>) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.className = className;
    const path = [...unfinishedInitExtensions].map((extension) => extension.constructor.name).join(' -> ');
    this.setLog('trace', filterConfig, `${className}: ${path}: start init.`);
  }

  /**
   * `id`: `className`: finish init.
   */
  finishInitExtension(self: object, unfinishedInitExtensions: Set<Extension<any>>, data: any) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.className = className;
    const path = [...unfinishedInitExtensions].map((extension) => extension.constructor.name).join(' -> ');
    const withSomeValue = data === undefined ? ', no value returned' : ', returned some value';
    this.setLog('trace', filterConfig, `${className}: ${path}: finish init${withSomeValue}.`);
  }

  /**
   * Total inited `number` extensions: `listOfNames`.
   */
  totalInitedExtensions(self: object, moduleName: string, extensionsNum: number, extensionsNames: string) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.moduleName = moduleName;
    filterConfig.className = className;
    const msg = `${className}: in ${moduleName} total inited ${extensionsNum} extensions: ${extensionsNames}`;
    this.setLog('debug', filterConfig, msg);
  }

  /**
   * [print controller error]
   */
  controllerHasError(self: object, err: any) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.className = className;
    this.setLog('error', filterConfig, { err, info: { className } });
  }

  /**
   * [internal error]
   */
  internalServerError(self: object, err: any) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.className = className;
    this.setLog('error', filterConfig, { err, info: { className } });
  }

  /**
   * Can not activate the route with URL: `httpMethod` `URL`.
   */
  youCannotActivateRoute(self: object, httpMethod: string, url: string) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.className = className;
    this.setLog('debug', filterConfig, `${className}: can not activate the route with URL: ${httpMethod} ${url}`);
  }

  /**
   * The application has no routes.
   */
  noRoutes(self: object) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.className = className;
    this.setLog('warn', filterConfig, `${className}: the application has no routes.`);
  }

  /**
   * [show routes].
   */
  printRoute(self: object, moduleName: string, httpMethod: string, path: string) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.className = className;
    filterConfig.moduleName = moduleName;
    this.setLog('trace', filterConfig, `${className}: setted route ${httpMethod} "/${path}"`);
  }
}
