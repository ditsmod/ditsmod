import type * as http from 'http';
import type * as http2 from 'http2';
import type * as https from 'https';

import { AppInitializer } from './app-initializer';
import { RootMetadata } from './models/root-metadata';
import { LogMediator } from './log-mediator/log-mediator';
import { SystemLogMediator } from './log-mediator/system-log-mediator';
import { ModuleManager } from './services/module-manager';
import { AnyFn, ModuleType, ModuleWithParams } from './types/mix';
import { Http2SecureServerOptions, RequestListener, NodeServer } from './types/server-options';
import { getModuleMetadata } from './utils/get-module-metadata';
import { pickProperties } from './utils/pick-properties';
import { isHttp2SecureServerOptions } from './utils/type-guards';
import { clearErrorTrace } from './utils/clear-error-trace';

export class Application {
  protected rootMeta: RootMetadata;
  protected systemLogMediator: SystemLogMediator;

  /**
   * @param listen If this parameter seted to `false` then `server.listen()` is not called. Default - `true`.
   */
  bootstrap(appModule: ModuleType, listen: boolean = true) {
    return new Promise<{ server: NodeServer }>(async (resolve, reject) => {
      try {
        this.initRootModule(appModule);
        const moduleManager = this.scanRootModule(appModule);
        const appInitializer = this.getAppInitializer(moduleManager);
        await this.bootstrapApplication(appInitializer);
        this.finishBootstrap(appInitializer, resolve, listen);
      } catch (err: any) {
        this.systemLogMediator.internalServerError(this, err, true);
        this.flushLogs();
        clearErrorTrace(err);
        reject(err);
      }
    });
  }

  protected initRootModule(appModule: ModuleType) {
    this.systemLogMediator = new SystemLogMediator({ moduleName: 'AppModule' });
    this.mergeRootMetadata(appModule);
    this.checkSecureServerOption(appModule.name);
    return this.systemLogMediator;
  }

  /**
   * Merge AppModule metadata with default metadata for root module.
   */
  protected mergeRootMetadata(module: ModuleType | ModuleWithParams): void {
    const serverMetadata = getModuleMetadata(module, true) as unknown as RootMetadata;
    this.rootMeta = new RootMetadata();
    pickProperties(this.rootMeta, serverMetadata);
    const { listenOptions } = this.rootMeta;
    listenOptions.host = listenOptions.host || 'localhost';
    listenOptions.port = listenOptions.port || 3000;
  }

  protected checkSecureServerOption(rootModuleName: string) {
    const serverOptions = this.rootMeta.serverOptions as Http2SecureServerOptions;
    if (serverOptions?.isHttp2SecureServer && !(this.rootMeta.httpModule as typeof http2).createSecureServer) {
      throw new TypeError(`serverModule.createSecureServer() not found (see ${rootModuleName} settings)`);
    }
  }

  protected scanRootModule(appModule: ModuleType) {
    const moduleManager = new ModuleManager(this.systemLogMediator);
    moduleManager.scanRootModule(appModule);
    return moduleManager;
  }

  protected getAppInitializer(moduleManager: ModuleManager) {
    return new AppInitializer(this.rootMeta, moduleManager, this.systemLogMediator);
  }

  protected async bootstrapApplication(appInitializer: AppInitializer) {
    // Here, before init custom logger, works default logger.
    appInitializer.bootstrapProvidersPerApp();
    // Here, after init custom logger, works this custom logger.
    this.systemLogMediator = appInitializer.systemLogMediator;
    this.systemLogMediator.updateLogsWithCurrentLogConfig();
    await appInitializer.bootstrapModulesAndExtensions();
  }

  protected finishBootstrap(appInitializer: AppInitializer, resolve: AnyFn, listen: boolean) {
    this.flushLogs();
    const server = this.createServer(appInitializer.requestListener);
    if (listen) {
      server.listen(this.rootMeta.listenOptions, () => {
        const { listenOptions } = this.rootMeta;
        this.systemLogMediator.serverListen(this, listenOptions.host!, listenOptions.port!);
        resolve({ server });
      });
    } else {
      resolve({ server });
    }
  }

  protected flushLogs() {
    LogMediator.bufferLogs = false;
    this.systemLogMediator.flush();
  }

  protected createServer(requestListener: RequestListener): NodeServer {
    if (isHttp2SecureServerOptions(this.rootMeta.serverOptions)) {
      const serverModule = this.rootMeta.httpModule as typeof http2;
      return serverModule.createSecureServer(this.rootMeta.serverOptions, requestListener);
    } else {
      const serverModule = this.rootMeta.httpModule as typeof http | typeof https;
      const serverOptions = this.rootMeta.serverOptions as http.ServerOptions | https.ServerOptions;
      // @todo remove casting after fix https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/63269
      return (serverModule as typeof http).createServer(serverOptions, requestListener);
    }
  }
}
