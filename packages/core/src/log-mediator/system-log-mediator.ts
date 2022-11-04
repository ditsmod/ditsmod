import { Injectable } from '@ts-stack/di';

import { isInjectionToken } from '../utils/type-guards';
import { GlobalProviders, ImportObj } from '../types/metadata-per-mod';
import { Extension, ExtensionsGroupToken, ModuleType, ModuleWithParams, ServiceProvider } from '../types/mix';
import { getImportedTokens } from '../utils/get-imports';
import { getModuleName } from '../utils/get-module-name';
import { getProviderName } from '../utils/get-provider-name';
import { LogMediator, MsgLogFilter } from './log-mediator';

/**
 * Mediator between core logger and custom user's logger.
 *
 * If you want to rewrite messages written by the core logger, you need:
 * 1. override the methods of this class in your own class;
 * 2. via DI, at the application level, substitute the `LogMediator` class with your class.
 */
@Injectable()
export class SystemLogMediator extends LogMediator {

  /**
   * `"${moduleName}" has already been imported into "${moduleId}".`
   */
  moduleAlreadyImported(self: object, inputModule: ModuleType | ModuleWithParams, targetModuleId: string) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    const inputModuleId = getModuleName(inputModule);
    const msg = `${className}: "${inputModuleId}" has already been imported into "${targetModuleId}".`;
    this.setLog('warn', msgLogFilter, msg);
  }

  /**
   * `${serverName} is running at ${host}:${port}.`
   */
  serverListen(self: object, host: string, port: number) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    this.setLog('info', msgLogFilter, `${className}: Node.js is running at http://${host}:${port}.`);
  }

  /**
   * `start reinit the application.`
   */
  startReinitApp(self: object) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    this.setLog('debug', msgLogFilter, `${className}: start reinit the application.`);
  }

  /**
   * `skipping autocommit of changes for config of moduleManager.`
   */
  skippingAutocommitModulesConfig(self: object) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    this.setLog('warn', msgLogFilter, `${className}: skipping autocommit of changes for config of moduleManager.`);
  }

  /**
   * `finished reinit the application.`
   */
  finishReinitApp(self: object) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    this.setLog('debug', msgLogFilter, `${className}: finished reinit the application.`);
  }

  /**
   * [log any error]
   */
  printReinitError(self: object, err: any) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    this.setLog('error', msgLogFilter, err);
  }

  /**
   * `start rollback of changes for config of moduleManager during reinit the application.`
   */
  startRollbackModuleConfigChanges(self: object) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    const msg = `${className}: start rollback of changes for config of moduleManager during reinit the application.`;
    this.setLog('debug', msgLogFilter, msg);
  }

  /**
   * `successful rollback of changes for config of moduleManager during reinit the application.`
   */
  successfulRollbackModuleConfigChanges(self: object) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    const msg = `${className}: successful rollback of changes for config of moduleManager during reinit the application.`;
    this.setLog('debug', msgLogFilter, msg);
  }

  /**
   * `successful added "${inputModuleName}" to "${targetMetaName}".`
   */
  successfulAddedModuleToImport(self: object, inputModule: ModuleType | ModuleWithParams, targetMetaName: string) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    const inputModuleName = getModuleName(inputModule);
    this.setLog('debug', msgLogFilter, `${className}: successful added "${inputModuleName}" to "${targetMetaName}".`);
  }

  /**
   * `module with ID "${moduleId}" not found.`
   */
  moduleNotFound(self: object, moduleId: string) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    this.setLog('warn', msgLogFilter, `${className}: module with ID "${moduleId}" not found.`);
  }

  /**
   * `${inputMetaName} successful removed from ${targetMetaName}.`
   */
  moduleSuccessfulRemoved(self: object, inputMetaName: string, targetMetaName: string) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    this.setLog('debug', msgLogFilter, `${className}: ${inputMetaName} successful removed from ${targetMetaName}.`);
  }

  /**
   * `${moduleName} has ID: "${moduleId}".`
   */
  moduleHasId(self: object, moduleId: string) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    this.setLog('trace', msgLogFilter, `${className}: ${this.moduleExtract.moduleName} has ID: "${moduleId}".`);
  }

  /**
- AppInitializer: global providers per a module: []
- AppInitializer: global providers per a route: []
- AppInitializer: global providers per a request: []
   */
  printGlobalProviders(self: object, globalProviders: GlobalProviders) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
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
  startExtensionsModuleInit(self: object) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    this.setLog(
      'debug',
      msgLogFilter,
      `${className}: ${'='.repeat(20)} ${this.moduleExtract.moduleName} ${'='.repeat(20)}`
    );
  }

  /**
   * `${tokenName} start init.`
   */
  startExtensionsGroupInit(self: object, unfinishedInit: Set<Extension<any> | ExtensionsGroupToken<any>>) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    const path = this.getExtentionPath(unfinishedInit);
    this.setLog('trace', msgLogFilter, `${className}: ${path}: start init.`);
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
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    const path = this.getExtentionPath(unfinishedInit);
    this.setLog('trace', msgLogFilter, `${className}: ${path}: finish init.`);
  }

  /**
   * `for ${tokenName} no extensions found.`
   */
  noExtensionsFound(self: object, groupToken: any) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    const tokenName = getProviderName(groupToken);
    this.setLog('trace', msgLogFilter, `${className}: for ${tokenName} no extensions found.`);
  }

  /**
   * `${path}: start init.`
   */
  startInitExtension(self: object, unfinishedInit: Set<Extension<any> | ExtensionsGroupToken<any>>) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    const path = this.getExtentionPath(unfinishedInit);
    this.setLog('trace', msgLogFilter, `${className}: ${path}: start init.`);
  }

  /**
   * `${path}: finish init${withSomeValue}.`
   */
  finishInitExtension(self: object, unfinishedInit: Set<Extension<any> | ExtensionsGroupToken<any>>, data: any) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    const path = this.getExtentionPath(unfinishedInit);
    const withSomeValue = data === undefined ? ', no value returned' : ', returned some value';
    this.setLog('trace', msgLogFilter, `${className}: ${path}: finish init${withSomeValue}.`);
  }

  /**
   * `total inited ${extensionsNum} extensions: ${extensionsNames}.`
   */
  totalInitedExtensions(self: object, extensionsNum: number, extensionsNames: string) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    const msg = `${className}: total inited ${extensionsNum} extensions: ${extensionsNames}.`;
    this.setLog('debug', msgLogFilter, msg);
  }

  /**
   * [print controller error]
   */
  controllerHasError(self: object, err: any) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    this.setLog('error', msgLogFilter, err);
  }

  /**
   * [internal error]
   */
  internalServerError(self: object, err: any) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    this.setLog('error', msgLogFilter, err);
  }

  /**
   * `can not activate the route with URL: ${httpMethod} ${url}.`
   */
  youCannotActivateRoute(self: object, httpMethod: string, url: string) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    this.setLog('debug', msgLogFilter, `${className}: can not activate the route with URL: ${httpMethod} ${url}.`);
  }

  /**
   * `the application has no routes.`
   */
  noRoutes(self: object) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    msgLogFilter.tags = ['route'];
    this.setLog('warn', msgLogFilter, `${className}: the application has no routes.`);
  }

  /**
   * `setted route ${httpMethod} "/${path}"`.
   */
  printRoute(self: object, httpMethod: string, path: string) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    msgLogFilter.tags = ['route'];
    this.setLog('debug', msgLogFilter, `${className}: setted route ${httpMethod} "/${path}".`);
  }

  /**
   * no provider for ${tokenName}! ${partMsg}.
   */
  throwNoProviderDuringResolveImports(moduleName: string, tokenName: string, partMsg: string) {
    this.raiseLog({ tags: ['provider'], modulesNames: [moduleName] }, 'trace');
    throw new Error(`${moduleName}: no provider for ${tokenName}! ${partMsg}.`);
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
    providersPerApp?: ServiceProvider[]
  ) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    msgLogFilter.tags = ['provider'];

    const startStr = `${moduleName}: ${className}: providersPer`;
    const perAppNames = (providersPerApp || []).map(getProviderName).join(', ') || '[]';
    const perModNames = providersPerMod.map(getProviderName).join(', ') || '[]';
    const perRouNames = providersPerRou.map(getProviderName).join(', ') || '[]';
    const perReqNames = providersPerReq.map(getProviderName).join(', ') || '[]';

    if (providersPerApp) {
      this.setLog('trace', msgLogFilter, `${startStr}App: ${perAppNames}.`);
    }
    this.setLog('trace', msgLogFilter, `${startStr}Mod: ${perModNames}.`);
    this.setLog('trace', msgLogFilter, `${startStr}Rou: ${perRouNames}.`);
    this.setLog('trace', msgLogFilter, `${startStr}Req: ${perReqNames}.`);
  }
}
