import { injectable } from '#di';
import { ConsoleLogger } from '#logger/console-logger.js';
import { Logger } from '#logger/logger.js';
import { LogMediator } from '#logger/log-mediator.js';
import { GlobalProviders, ImportObj } from '#types/metadata-per-mod.js';
import { Extension, ExtensionsGroupToken, ModuleType, ModuleWithParams, ServiceProvider } from '#types/mix.js';
import { getImportedTokens } from '#utils/get-imports.js';
import { getModuleName } from '#utils/get-module-name.js';
import { getProviderName } from '#utils/get-provider-name.js';
import { isInjectionToken } from '#utils/type-guards.js';

/**
 * Mediator between core logger and custom user's logger.
 *
 * If you want to rewrite messages written by the core logger, you need:
 * 1. override the methods of this class in your own class;
 * 2. via DI, at the application level, substitute the `LogMediator` class with your class.
 */
@injectable()
export class SystemLogMediator extends LogMediator {
  protected static previousLogger: Logger;

  flush() {
    const { buffer } = LogMediator;
    this.writeLogs(buffer);
    buffer.splice(0);
    LogMediator.hasDiffLogLevels = false;
  }

  preserveLogger() {
    SystemLogMediator.previousLogger = this.logger;
  }

  /**
   * @todo Move throwing an error to ErrorMediator.
   */
  restorePreviousLogger() {
    if (!SystemLogMediator.previousLogger) {
      throw new TypeError('The logger was not previously seted.');
    }
    this.logger = SystemLogMediator.previousLogger;
  }

  /**
   * `"${moduleName}" has already been imported into "${moduleId}".`
   */
  moduleAlreadyImported(self: object, inputModule: ModuleType | ModuleWithParams, targetModuleId: string) {
    const className = self.constructor.name;
    const inputModuleId = getModuleName(inputModule);
    const msg = `${className}: "${inputModuleId}" has already been imported into "${targetModuleId}".`;
    this.setLog('warn', msg);
  }

  /**
   * `${serverName} is running at ${host}:${port}.`
   */
  serverListen(self: object, host: string, port: number) {
    const className = self.constructor.name;
    this.setLog('info', `${className}: Node.js is running at http://${host}:${port}.`);
  }

  /**
   * `start reinit the application.`
   */
  startReinitApp(self: object) {
    const className = self.constructor.name;
    this.setLog('debug', `${className}: start reinit the application.`);
  }

  /**
   * `skipping autocommit of changes for config of moduleManager.`
   */
  skippingAutocommitModulesConfig(self: object) {
    const className = self.constructor.name;
    this.setLog('warn', `${className}: skipping autocommit of changes for config of moduleManager.`);
  }

  /**
   * `finished reinit the application.`
   */
  finishReinitApp(self: object) {
    const className = self.constructor.name;
    this.setLog('debug', `${className}: finished reinit the application.`);
  }

  /**
   * [log any error]
   */
  printReinitError(self: object, err: any) {
    const className = self.constructor.name;
    this.setLog('error', err);
  }

  /**
   * `start rollback of changes for config of moduleManager during reinit the application.`
   */
  startRollbackModuleConfigChanges(self: object) {
    const className = self.constructor.name;
    const msg = `${className}: start rollback of changes for config of moduleManager during reinit the application.`;
    this.setLog('debug', msg);
  }

  /**
   * `successful rollback of changes for config of moduleManager during reinit the application.`
   */
  successfulRollbackModuleConfigChanges(self: object) {
    const className = self.constructor.name;
    const msg = `${className}: successful rollback of changes for config of moduleManager during reinit the application.`;
    this.setLog('debug', msg);
  }

  /**
   * `successful added "${inputModuleName}" to "${targetMetaName}".`
   */
  successfulAddedModuleToImport(self: object, inputModule: ModuleType | ModuleWithParams, targetMetaName: string) {
    const className = self.constructor.name;
    const inputModuleName = getModuleName(inputModule);
    this.setLog('debug', `${className}: successful added "${inputModuleName}" to "${targetMetaName}".`);
  }

  /**
   * `module with ID "${moduleId}" not found.`
   */
  moduleNotFound(self: object, moduleId: string) {
    const className = self.constructor.name;
    this.setLog('warn', `${className}: module with ID "${moduleId}" not found.`);
  }

  /**
   * `${inputMetaName} successful removed from ${targetMetaName}.`
   */
  moduleSuccessfulRemoved(self: object, inputMetaName: string, targetMetaName: string) {
    const className = self.constructor.name;
    this.setLog('debug', `${className}: ${inputMetaName} successful removed from ${targetMetaName}.`);
  }

  /**
   * `${moduleName} has ID: "${moduleId}".`
   */
  moduleHasId(self: object, moduleId: string) {
    const className = self.constructor.name;
    this.setLog('trace', `${className}: ${this.moduleExtract.moduleName} has ID: "${moduleId}".`);
  }

  /**
- AppInitializer: global providers per a module: []
- AppInitializer: global providers per a route: []
- AppInitializer: global providers per a request: []
   */
  printGlobalProviders(self: object, globalProviders: GlobalProviders) {
    const className = self.constructor.name;
    const globalProvidersPerMod = this.getProvidersNames(globalProviders.importedProvidersPerMod);
    const globalProvidersPerRou = this.getProvidersNames(globalProviders.importedProvidersPerRou);
    const globalProvidersPerReq = this.getProvidersNames(globalProviders.importedProvidersPerReq);
    const prefix = `${className}: global providers per a`;
    this.setLog('debug', `${className}: global providers are collected.`);
    this.setLog('trace', `${prefix} module: [${globalProvidersPerMod}]`);
    this.setLog('trace', `${prefix} route: [${globalProvidersPerRou}]`);
    this.setLog('trace', `${prefix} request: [${globalProvidersPerReq}]`);
  }

  protected getProvidersNames(providersMap: Map<any, ImportObj<ServiceProvider>>) {
    return getImportedTokens(providersMap).map(getProviderName).join(', ');
  }

  /**
   * ================== ModuleName ======================.
   */
  startExtensionsModuleInit(self: object) {
    const className = self.constructor.name;
    this.setLog(
      'debug',
      `${className}: ${'='.repeat(20)} ${this.moduleExtract.moduleName} ${'='.repeat(20)}`,
    );
  }

  /**
   * `${tokenName} start init.`
   */
  startExtensionsGroupInit(self: object, unfinishedInit: Set<Extension<any> | ExtensionsGroupToken<any>>) {
    const className = self.constructor.name;
    const path = this.getExtentionPath(unfinishedInit);
    this.setLog('trace', `${className}: ${path}: start init.`);
  }

  protected getExtentionPath(unfinishedInit: Set<Extension<any> | ExtensionsGroupToken<any>>) {
    return [...unfinishedInit]
      .map((tokenOrExtension) => {
        if (isInjectionToken(tokenOrExtension) || typeof tokenOrExtension == 'string') {
          return getProviderName(tokenOrExtension);
        } else {
          return tokenOrExtension.constructor.name;
        }
      })
      .join(' -> ');
  }

  /**
   * `finish init ${tokenName}.`
   */
  finishExtensionsGroupInit(self: object, unfinishedInit: Set<Extension<any> | ExtensionsGroupToken<any>>) {
    const className = self.constructor.name;
    const path = this.getExtentionPath(unfinishedInit);
    this.setLog('trace', `${className}: ${path}: finish init.`);
  }

  /**
   * `for ${tokenName} no extensions found.`
   */
  noExtensionsFound(self: object, groupToken: any) {
    const className = self.constructor.name;
    const tokenName = getProviderName(groupToken);
    this.setLog('trace', `${className}: for ${tokenName} no extensions found.`);
  }

  /**
   * `${path}: start init.`
   */
  startInitExtension(self: object, unfinishedInit: Set<Extension<any> | ExtensionsGroupToken<any>>) {
    const className = self.constructor.name;
    const path = this.getExtentionPath(unfinishedInit);
    this.setLog('trace', `${className}: ${path}: start init.`);
  }

  /**
   * `${path}: finish init${withSomeValue}.`
   */
  finishInitExtension(self: object, unfinishedInit: Set<Extension<any> | ExtensionsGroupToken<any>>, data: any) {
    const className = self.constructor.name;
    const path = this.getExtentionPath(unfinishedInit);
    const withSomeValue = data === undefined ? ', no value returned' : ', returned some value';
    this.setLog('trace', `${className}: ${path}: finish init${withSomeValue}.`);
  }

  /**
   * `total inited ${extensionsNum} extensions: ${extensionsNames}.`
   */
  totalInitedExtensions(self: object, extensionsNum: number, extensionsNames: string) {
    const className = self.constructor.name;
    const msg = `${className}: total inited ${extensionsNum} extensions: ${extensionsNames}.`;
    this.setLog('debug', msg);
  }

  /**
   * [print controller error]
   */
  controllerHasError(self: object, err: any) {
    const className = self.constructor.name;
    this.setLog('error', err);
  }

  /**
   * [internal error]
   */
  internalServerError(self: object, err: any, hideConsoleLoggerMsg?: boolean) {
    if (hideConsoleLoggerMsg && this.logger instanceof ConsoleLogger) {
      return;
    }
    const className = self.constructor.name;
    this.setLog('error', err);
  }

  /**
   * `can not activate the route with URL: ${httpMethod} ${url}.`
   */
  youCannotActivateRoute(self: object, httpMethod: string, url: string) {
    const className = self.constructor.name;
    this.setLog('debug', `${className}: can not activate the route with URL: ${httpMethod} ${url}.`);
  }

  /**
   * `the application has no routes.`
   */
  noRoutes(self: object) {
    const className = self.constructor.name;
    this.setLog('warn', `${className}: the application has no routes.`);
  }

  /**
   * `setted route ${httpMethod} "/${path}"`.
   */
  printRoute(self: object, httpMethod: string, path: string) {
    const className = self.constructor.name;
    this.setLog('debug', `${className}: setted route ${httpMethod} "/${path}".`);
  }

  /**
   * ModuleName: ClassName: providersPerMod: ...
   */
  showProvidersInLogs(
    self: object,
    moduleName: string,
    providersPerReq: ServiceProvider[],
    providersPerRou: ServiceProvider[],
    providersPerMod: ServiceProvider[],
    providersPerApp?: ServiceProvider[],
  ) {
    const className = self.constructor.name;

    const startStr = `${moduleName}: ${className}: providersPer`;
    const perAppNames = (providersPerApp || []).map(getProviderName).join(', ') || '[]';
    const perModNames = providersPerMod.map(getProviderName).join(', ') || '[]';
    const perRouNames = providersPerRou.map(getProviderName).join(', ') || '[]';
    const perReqNames = providersPerReq.map(getProviderName).join(', ') || '[]';

    if (providersPerApp) {
      this.setLog('trace', `${startStr}App: ${perAppNames}.`);
    }
    this.setLog('trace', `${startStr}Mod: ${perModNames}.`);
    this.setLog('trace', `${startStr}Rou: ${perRouNames}.`);
    this.setLog('trace', `${startStr}Req: ${perReqNames}.`);
  }
}
