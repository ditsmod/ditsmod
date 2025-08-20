import { Class, injectable } from '#di';
import { ConsoleLogger } from '#logger/console-logger.js';
import { Logger } from '#logger/logger.js';
import { LogMediator } from '#logger/log-mediator.js';
import { GlobalProviders, ProviderImport } from '#types/metadata-per-mod.js';
import { ModRefId } from '#types/mix.js';
import { Provider } from '#di/types-and-models.js';
import { ExtensionClass, Extension } from '#extension/extension-types.js';
import { getImportedTokens } from '#utils/get-imports.js';
import { getProviderName } from '#utils/get-provider-name.js';
import { getDebugClassName } from '#utils/get-debug-class-name.js';
import { LoggerNotSet } from '#errors';
import { CustomError } from '#error/custom-error.js';

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
  protected colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    green: '\x1b[32m',
  };

  flush() {
    const { buffer } = LogMediator;
    this.writeLogs(buffer);
    buffer.splice(0);
    LogMediator.hasDiffLogLevels = false;
  }

  preserveLogger() {
    SystemLogMediator.previousLogger = this.logger;
  }

  restorePreviousLogger() {
    if (!SystemLogMediator.previousLogger) {
      throw new LoggerNotSet();
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
   * `${className}: Rescan of root module is forbidden: it must only be loaded once at startup.`
   */
  forbiddenRescanRootModule(self: object) {
    const className = self.constructor.name;
    this.setLog('warn', `${className}: Rescan of root module is forbidden: it must only be loaded once at startup.`);
  }

  /**
   * `"${moduleName}" has already been imported into "${moduleId}".`
   */
  moduleAlreadyImported(self: object, inputModule: ModRefId, targetModuleId: string) {
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
  successfulAddedModuleToImport(self: object, inputModule: ModRefId, targetMetaName: string) {
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

  protected getProvidersNames(providersMap: Map<any, ProviderImport<Provider>>) {
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
      .map((extension) => {
        if (extension.constructor.name == 'Function') {
          return `[${(extension as Class).name} group]`;
        } else {
          return extension.constructor.name;
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
  internalServerError(self: object, err: Error, appendMsg?: string) {
    const className = self.constructor.name;
    if (err instanceof CustomError) {
      let stack = CustomError.getFullStack(err)!;
      stack = appendMsg ? `${appendMsg}: ${stack}` : stack;
      if (!LogMediator.bufferLogs && this.logger instanceof ConsoleLogger) {
        stack = this.formatStackTrace(stack);
      }
      this.setLog(err.info.level || 'fatal', `${className}: ${stack}`);
    } else {
      this.setLog('error', `${className}: ${err.stack || err.message}`);
    }
  }

  protected formatStackTrace(stack: string): string {
    const lines = stack.split('\n');
    const clr = this.colors;
    const errorMessage = `${clr.red}${lines[0]}${clr.reset}`;
    const formattedTrace = lines
      .slice(1)
      .map((line) => {
        if (line.includes('caused by: ERR')) {
          return `${clr.red}${line}${clr.reset}`;
        }
        if (line.includes('@ditsmod/') || line.includes('ditsmod/packages') || line.includes('Array.')) {
          return `${clr.gray}${line}${clr.reset}`;
        }
        return line;
      })
      .join('\n');

    return `${errorMessage}\n${formattedTrace}`;
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
  sequenceOfExtensions(self: object, aOrderedExtensions: ExtensionClass[]) {
    const className = self.constructor.name;
    const msg =
      `${className}: The sequence of extension group operations: ` +
      `${aOrderedExtensions.map((e, i) => `${i + 1}. ${getDebugClassName(e)}`).join(', ')}.`;
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
