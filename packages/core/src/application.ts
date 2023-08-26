import type * as http from 'http';
import type * as http2 from 'http2';
import type * as https from 'https';
import type { AddressInfo } from 'net';

import { AppInitializer } from './app-initializer.js';
import { RootMetadata } from './models/root-metadata.js';
import { ApplicationOptions } from './models/application-options.js';
import { LogMediator } from './log-mediator/log-mediator.js';
import { SystemLogMediator } from './log-mediator/system-log-mediator.js';
import { ModuleManager } from './services/module-manager.js';
import { AnyFn, ModuleType } from './types/mix.js';
import { Http2SecureServerOptions, RequestListener, NodeServer } from './types/server-options.js';
import { isHttp2SecureServerOptions } from './utils/type-guards.js';
import { cleanErrorTrace } from './utils/clean-error-trace.js';
import { HttpServerModule, HttpsServerModule } from './types/http-module.js';

export class Application {
  protected appOptions: ApplicationOptions;
  protected systemLogMediator: SystemLogMediator;
  protected rootMeta = new RootMetadata();

  /**
   * @param appModule The root module of the application.
   * @param appOptions Application options.
   */
  bootstrap(appModule: ModuleType, appOptions: ApplicationOptions = new ApplicationOptions()) {
    return new Promise<{ server: NodeServer }>(async (resolve, reject) => {
      try {
        this.init(appModule.name, appOptions);
        const moduleManager = this.scanRootModule(appModule);
        const appInitializer = this.getAppInitializer(moduleManager);
        await this.bootstrapApplication(appInitializer);
        await this.createServerAndListen(appInitializer, resolve);
      } catch (err: any) {
        this.systemLogMediator.internalServerError(this, err, true);
        this.flushLogs();
        cleanErrorTrace(err);
        reject(err);
      }
    });
  }

  protected init(rootModuleName: string, appOptions: ApplicationOptions) {
    this.systemLogMediator = new SystemLogMediator({ moduleName: 'AppModule' });
    this.appOptions = Object.assign(new ApplicationOptions(), appOptions);
    this.rootMeta.path = this.appOptions.path || '';
    this.checkSecureServerOption(rootModuleName);
    return this.systemLogMediator;
  }

  protected checkSecureServerOption(rootModuleName: string) {
    const serverOptions = this.appOptions.serverOptions as Http2SecureServerOptions;
    if (serverOptions?.isHttp2SecureServer && !(this.appOptions.httpModule as typeof http2).createSecureServer) {
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

  protected async createServerAndListen(appInitializer: AppInitializer, resolve: AnyFn) {
    this.flushLogs();
    const server = await this.createServer(appInitializer.requestListener);
    server.on('listening', () => {
      const info = server.address() as AddressInfo;
      this.rootMeta.addressInfo = info;
      this.systemLogMediator.serverListen(this, info.address, info.port);
    });
    resolve({ server });
  }

  protected flushLogs() {
    LogMediator.bufferLogs = false;
    this.systemLogMediator.flush();
  }

  protected async createServer(requestListener: RequestListener): Promise<NodeServer> {
    if (isHttp2SecureServerOptions(this.appOptions.serverOptions || {})) {
      const serverModule = this.appOptions.httpModule as typeof http2;
      return serverModule.createSecureServer(this.appOptions.serverOptions || {}, requestListener);
    } else {
      const serverModule = (this.appOptions.httpModule || (await import('http'))) as
        | HttpServerModule
        | HttpsServerModule;
      const serverOptions = this.appOptions.serverOptions as http.ServerOptions | https.ServerOptions;
      return serverModule.createServer(serverOptions, requestListener);
    }
  }
}
