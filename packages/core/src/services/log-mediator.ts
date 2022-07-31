import { Injectable, Optional } from '@ts-stack/di';

import { Logger } from '../types/logger';
import { GlobalProviders, ImportObj } from '../types/metadata-per-mod';
import { AnyObj, Extension, ModuleType, ModuleWithParams, ServiceProvider } from '../types/mix';
import { getImportedTokens } from '../utils/get-imports';
import { getModuleName } from '../utils/get-module-name';
import { getProviderName } from '../utils/get-provider-name';
import { ConsoleLogger } from './console-logger';
import { LogManager } from './log-manager';

type KeyOfLogger = keyof Logger;

export class FilterConfig {
  modulesNames?: string[];
  classesNames?: string[];
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

  protected setLog(level: KeyOfLogger, filterConfig: AnyObj, msg: any) {
    if (this.logManager.bufferLogs) {
      this.logManager.buffer.push({ filterConfig, date: new Date(), level, msg });
    } else {
      this.logger.log(level, msg);
    }
  }

  flush() {
    const { buffer } = this.logManager;
    if (typeof global.it != 'function') {
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
      let hasModuleName: boolean | undefined = true;
      const hasClassName: boolean | undefined = true;
      if (outputConfig.modulesNames) {
        hasModuleName = inputConfig.modulesNames?.some((tag) => outputConfig.modulesNames?.includes(tag));
      }
      if (outputConfig.classesNames) {
        hasTags = inputConfig.classesNames?.some((tag) => outputConfig.classesNames?.includes(tag));
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
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    const inputModuleId = getModuleName(inputModule);
    const msg = `${className}: "${inputModuleId}" has already been imported into "${targetModuleId}".`;
    this.setLog('warn', filterConfig, msg);
  }

  /**
   * `${serverName} is running at ${host}:${port}.`
   */
  serverListen(self: object, serverName: string, host: string, port: number) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    this.setLog('info', filterConfig, `${className}: ${serverName} is running at http://${host}:${port}.`);
  }

  /**
   * `start reinit the application.`
   */
  startReinitApp(self: object) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    this.setLog('debug', filterConfig, `${className}: start reinit the application.`);
  }

  /**
   * `skipping autocommit of changes for config of moduleManager.`
   */
  skippingAutocommitModulesConfig(self: object) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    this.setLog('warn', filterConfig, `${className}: skipping autocommit of changes for config of moduleManager.`);
  }

  /**
   * `finished reinit the application.`
   */
  finishReinitApp(self: object) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    this.setLog('debug', filterConfig, `${className}: finished reinit the application.`);
  }

  /**
   * [log any error]
   */
  printReinitError(self: object, err: any) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    this.setLog('error', filterConfig, err);
  }

  /**
   * `start rollback of changes for config of moduleManager during reinit the application.`
   */
  startRollbackModuleConfigChanges(self: object) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    const msg = `${className}: start rollback of changes for config of moduleManager during reinit the application.`;
    this.setLog('debug', filterConfig, msg);
  }

  /**
   * `successful rollback of changes for config of moduleManager during reinit the application.`
   */
  successfulRollbackModuleConfigChanges(self: object) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    const msg = `${className}: successful rollback of changes for config of moduleManager during reinit the application.`;
    this.setLog('debug', filterConfig, msg);
  }

  /**
   * `successful added "${inputModuleName}" to "${targetMetaName}".`
   */
  successfulAddedModuleToImport(self: object, inputModule: ModuleType | ModuleWithParams, targetMetaName: string) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    const inputModuleName = getModuleName(inputModule);
    this.setLog('debug', filterConfig, `${className}: successful added "${inputModuleName}" to "${targetMetaName}".`);
  }

  /**
   * `module with ID "${moduleId}" not found.`
   */
  moduleNotFound(self: object, moduleId: string) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    this.setLog('warn', filterConfig, `${className}: module with ID "${moduleId}" not found.`);
  }

  /**
   * `${inputMetaName} successful removed from ${targetMetaName}.`
   */
  moduleSuccessfulRemoved(self: object, inputMetaName: string, targetMetaName: string) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    this.setLog('debug', filterConfig, `${className}: ${inputMetaName} successful removed from ${targetMetaName}.`);
  }

  /**
   * `${moduleName} has ID: "${moduleId}".`
   */
  moduleHasId(self: object, moduleName: string, moduleId: string) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
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
    filterConfig.classesNames = [className];
    const globalProvidersPerMod = this.getProvidersNames(globalProviders.importedProvidersPerMod);
    const globalProvidersPerRou = this.getProvidersNames(globalProviders.importedProvidersPerRou);
    const globalProvidersPerReq = this.getProvidersNames(globalProviders.importedProvidersPerReq);
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
   * ================== ModuleName ======================.
   */
  startExtensionsModuleInit(self: object, moduleName: string) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.modulesNames = [moduleName];
    filterConfig.classesNames = [className];
    this.setLog('debug', filterConfig, `${className}: ${'='.repeat(20)} ${moduleName} ${'='.repeat(20)}`);
  }

  /**
   * `start init ${tokenName}.`
   */
  startExtensionsGroupInit(self: object, moduleName: string, groupToken: any) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.modulesNames = [moduleName];
    filterConfig.classesNames = [className];
    const tokenName = getProviderName(groupToken);
    this.setLog('trace', filterConfig, `${className}: start init ${tokenName}.`);
  }

  /**
   * `finish init ${tokenName}.`
   */
  finishExtensionsGroupInit(self: object, moduleName: string, groupToken: any) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.modulesNames = [moduleName];
    filterConfig.classesNames = [className];
    const tokenName = getProviderName(groupToken);
    this.setLog('trace', filterConfig, `${className}: finish init ${tokenName}.`);
  }

  /**
   * `for ${tokenName} no extensions found.`
   */
  noExtensionsFound(self: object, groupToken: any) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    const tokenName = getProviderName(groupToken);
    this.setLog('trace', filterConfig, `${className}: for ${tokenName} no extensions found.`);
  }

  /**
   * `${path}: start init.`
   */
  startInitExtension(self: object, unfinishedInitExtensions: Set<Extension<any>>) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    const path = [...unfinishedInitExtensions].map((extension) => extension.constructor.name).join(' -> ');
    this.setLog('trace', filterConfig, `${className}: ${path}: start init.`);
  }

  /**
   * `${path}: finish init${withSomeValue}.`
   */
  finishInitExtension(self: object, unfinishedInitExtensions: Set<Extension<any>>, data: any) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    const path = [...unfinishedInitExtensions].map((extension) => extension.constructor.name).join(' -> ');
    const withSomeValue = data === undefined ? ', no value returned' : ', returned some value';
    this.setLog('trace', filterConfig, `${className}: ${path}: finish init${withSomeValue}.`);
  }

  /**
   * `total inited ${extensionsNum} extensions: ${extensionsNames}.`
   */
  totalInitedExtensions(self: object, moduleName: string, extensionsNum: number, extensionsNames: string) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.modulesNames = [moduleName];
    filterConfig.classesNames = [className];
    const msg = `${className}: total inited ${extensionsNum} extensions: ${extensionsNames}.`;
    this.setLog('debug', filterConfig, msg);
  }

  /**
   * [print controller error]
   */
  controllerHasError(self: object, err: any) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    this.setLog('error', filterConfig, err);
  }

  /**
   * [internal error]
   */
  internalServerError(self: object, err: any) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    this.setLog('error', filterConfig, err);
  }

  /**
   * `can not activate the route with URL: ${httpMethod} ${url}.`
   */
  youCannotActivateRoute(self: object, httpMethod: string, url: string) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    this.setLog('debug', filterConfig, `${className}: can not activate the route with URL: ${httpMethod} ${url}.`);
  }

  /**
   * `the application has no routes.`
   */
  noRoutes(self: object) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    this.setLog('warn', filterConfig, `${className}: the application has no routes.`);
  }

  /**
   * `setted route ${httpMethod} "/${path}"`.
   */
  printRoute(self: object, moduleName: string, httpMethod: string, path: string) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    filterConfig.modulesNames = [moduleName];
    this.setLog('debug', filterConfig, `${className}: setted route ${httpMethod} "/${path}".`);
  }
}
