import { injectable } from '#di';
import { ConsoleLogger } from '#logger/console-logger.js';
import { Logger } from '#logger/logger.js';
import { LogMediator } from '#logger/log-mediator.js';
import { GlobalProviders, ImportObj } from '#types/metadata-per-mod.js';
import { ModuleType } from '#types/mix.js';
import { Provider } from '#di/types-and-models.js';
import { ModuleWithParams } from '#types/module-metadata.js';
import { ExtensionClass, Extension } from '#extension/extension-types.js';
import { getImportedTokens } from '#utils/get-imports.js';
import { getProviderName } from '#utils/get-provider-name.js';
import { isInjectionToken } from '#di';
import { getDebugClassName } from '#utils/get-debug-class-name.js';

/**
 * Mediator between core logger and custom user's logger.
 *
 * If you want to rewrite messages written by the core logger, you need:
 * 1. override the methods of this class in your own class;
 * 2. via DI, at the application level, substitute the `SystemLogMediator` class with your class.
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
   * ${extensionName} attempted to call "extensionsManager.stage1(${ExtCls})", but ${ExtCls}
   * not declared in "afterExtensions" array in this module.
   */
  throwEarlyExtensionCalling(ExtCls: string, extensionName: string) {
    const msg =
      `${extensionName} attempted to call "extensionsManager.stage1(${ExtCls})", but ${ExtCls} ` +
      'not declared in "afterExtensions" array in this module.';
    throw new Error(msg);
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
   * `Starting Ditsmod application...`
   */
  startingDitsmod(self: object) {
    const className = self.constructor.name;
    const msg = `${className}: Starting Ditsmod application...`;
    this.setLog('debug', msg);
  }

  /**
   * `"${moduleName}" has already been imported into "${moduleId}".`
   */
  moduleAlreadyImported(self: object, inputModule: ModuleType | ModuleWithParams, targetModuleId: string) {
    const className = self.constructor.name;
    const inputModuleId = getDebugClassName(inputModule);
    const msg = `${className}: "${inputModuleId}" has already been imported into "${targetModuleId}".`;
    this.setLog('warn', msg);
  }

  /**
   * `${serverName}: webserver is running at ${host}:${port}.`
   */
  serverListen(self: object, host: string, port: number) {
    const className = self.constructor.name;
    this.setLog('info', `${className}: webserver is running at http://${host}:${port}.`);
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
    this.setLog('error', err.stack || err.message);
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
    const inputModuleName = getDebugClassName(inputModule);
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
- BaseAppInitializer: global providers per a module: []
- BaseAppInitializer: global providers per a route: []
- BaseAppInitializer: global providers per a request: []
   */
  printGlobalProviders(self: object, globalProviders: GlobalProviders) {
    const className = self.constructor.name;
    const globalProvidersPerMod = this.getProvidersNames(globalProviders.importedProvidersPerMod);
    // const globalProvidersPerRou = this.getProvidersNames(globalProviders.importedProvidersPerRou);
    // const globalProvidersPerReq = this.getProvidersNames(globalProviders.importedProvidersPerReq);
    const prefix = `${className}: global providers per a`;
    this.setLog('debug', `${className}: global providers are collected.`);
    this.setLog('trace', `${prefix} module: [${globalProvidersPerMod}]`);
    // this.setLog('trace', `${prefix} route: [${globalProvidersPerRou}]`);
    // this.setLog('trace', `${prefix} request: [${globalProvidersPerReq}]`);
  }

  protected getProvidersNames(providersMap: Map<any, ImportObj<Provider>>) {
    return getImportedTokens(providersMap).map(getProviderName).join(', ');
  }

  /**
   * ${className}: No extensions found.
   */
  skippingStartExtensions(self: object) {
    const className = self.constructor.name;
    this.setLog('debug', `${className}: No extensions found.`);
  }

  /**
   * ${className}: Starting extensions...
   */
  startExtensions(self: object) {
    const className = self.constructor.name;
    this.setLog('debug', `${className}: Starting extensions...`);
  }

  /**
   * `${tokenName} start init.`
   */
  startExtensionsExtensionInit(self: object, unfinishedInit: Set<Extension | ExtensionClass>) {
    const className = self.constructor.name;
    const path = this.getExtentionPath(unfinishedInit);
    this.setLog('trace', `${className}: ${path}: start init.`);
  }

  protected getExtentionPath(unfinishedInit: Set<Extension | ExtensionClass>) {
    return [...unfinishedInit]
      .map((tokenOrExtension) => {
        if (isInjectionToken(tokenOrExtension)) {
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
  finishExtensionsExtensionInit(self: object, unfinishedInit: Set<Extension | ExtensionClass>) {
    const className = self.constructor.name;
    const path = this.getExtentionPath(unfinishedInit);
    this.setLog('trace', `${className}: ${path}: finish init.`);
  }

  /**
   * `for ${tokenName} no extensions found.`
   */
  noExtensionsFound(self: object, ExtCls: any, unfinishedInit: Set<Extension | ExtensionClass>) {
    const className = self.constructor.name;
    const tokenName = getProviderName(ExtCls);
    const item = Array.from(unfinishedInit).at(-2)!;
    const itemName = getProviderName(item);
    const msgArr = [
      `${className}: ${itemName} expects ${tokenName} to be initialized, but no extension was found.`,
      'If you see many messages like this, you need to reduce the number of exported modules',
      'from the root module. Try importing all these modules directly into the modules that need them.',
    ];
    this.setLog('warn', msgArr.join(' '));
  }

  /**
   * `${path}: start init.`
   */
  startInitExtension(self: object, unfinishedInit: Set<Extension | ExtensionClass>) {
    const className = self.constructor.name;
    const path = this.getExtentionPath(unfinishedInit);
    this.setLog('trace', `${className}: ${path}: start init.`);
  }

  /**
   * `${path}: finish init${withSomeValue}.`
   */
  finishInitExtension(self: object, unfinishedInit: Set<Extension | ExtensionClass>, data: any) {
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
   * [internal error]
   */
  internalServerError(self: object, err: any, hideConsoleLoggerMsg?: boolean) {
    if (hideConsoleLoggerMsg && this.logger instanceof ConsoleLogger) {
      return;
    }
    const className = self.constructor.name;
    this.setLog('error', err.stack || err.message);
  }

  /**
   * `can not activate the route with URL: ${httpMethod} ${url}.`
   */
  youCannotActivateRoute(self: object, httpMethod: string, url: string) {
    const className = self.constructor.name;
    this.setLog('debug', `${className}: can not activate the route with URL: ${httpMethod} ${url}.`);
  }

  /**
   * `${className}: The sequence of extension group operations: ...`
   */
  sequenceOfExtensionExtensions(self: object, aOrderedExtensions: ExtensionClass[]) {
    const className = self.constructor.name;
    const msg =
      `${className}: The sequence of extension group operations: ` +
      `${aOrderedExtensions.map((g, i) => `${i + 1}. ${g}`).join(', ')}.`;
    this.setLog('trace', msg);
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
  printRoute(self: object, httpMethod: string, path: string, countOfGuards: number) {
    const className = self.constructor.name;
    let withGuards = '';
    if (countOfGuards) {
      withGuards = countOfGuards > 1 ? ` with ${countOfGuards} guards` : ' with 1 guard';
    }
    this.setLog('info', `${className}: setted route ${httpMethod} "/${path}"${withGuards}.`);
  }

  /**
   * ModuleName: ClassName: providersPerMod: ...
   */
  showProvidersInLogs(
    self: object,
    moduleName: string,
    providersPerReq: Provider[],
    providersPerRou: Provider[],
    providersPerMod: Provider[],
    providersPerApp?: Provider[],
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

/**
 * This class is needed only to access the protected methods of the `LogMediator` class.
 */
export class PublicLogMediator extends SystemLogMediator {
  override updateOutputLogLevel() {
    return super.updateOutputLogLevel();
  }
}
