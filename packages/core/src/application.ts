import type * as http from 'node:http';
import type * as http2 from 'node:http2';
import type * as https from 'node:https';
import type { AddressInfo } from 'node:net';

import { LogMediator } from '#logger/log-mediator.js';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { AppOptions } from '#types/app-options.js';
import { HttpServerModule, HttpsServerModule } from '#types/http-module.js';
import { AnyFn, ModuleType } from '#types/mix.js';
import { Http2SecureServerOptions, NodeServer, RequestListener } from '#types/server-options.js';
import { ModuleManager } from '#services/module-manager.js';
import { isHttp2SecureServerOptions } from '#utils/type-guards.js';
import { AppInitializer } from './app-initializer.js';

export class Application {
  protected appOptions: AppOptions;
  protected systemLogMediator: SystemLogMediator;
  protected appInitializer: AppInitializer;

  /**
   * @param appModule The root module of the application.
   * @param appOptions Application options.
   */
  bootstrap(appModule: ModuleType, appOptions?: AppOptions) {
    return new Promise<{ server: NodeServer }>(async (resolve, reject) => {
      try {
        this.init(appOptions);
        const moduleManager = this.scanRootModule(appModule);
        const appInitializer = this.getAppInitializer(moduleManager);
        await this.bootstrapApplication(appInitializer);
        await this.createServerAndBindToListening(appInitializer, resolve);
      } catch (err: any) {
        (this.systemLogMediator as PublicLogMediator).updateOutputLogLevel();
        this.systemLogMediator.internalServerError(this, err, true);
        this.flushLogs();
        reject(err);
      }
    });
  }

  /**
   * @param systemLogMediator This parameter was originally created for `@ditsmod/testing`.
   */
  protected init(appOptions?: AppOptions, systemLogMediator?: SystemLogMediator) {
    if (Error.stackTraceLimit == 10) {
      Error.stackTraceLimit = 50; // Override default limit.
    }
    systemLogMediator ??= new SystemLogMediator({ moduleName: 'AppModule' });
    this.systemLogMediator = systemLogMediator;
    this.appOptions = { ...new AppOptions(), ...appOptions };
    LogMediator.bufferLogs = this.appOptions.bufferLogs;
    this.systemLogMediator.startingDitsmod(this); // OutputLogLevel is still unknown here.
    this.checkSecureServerOption();
    return this.systemLogMediator;
  }

  protected checkSecureServerOption() {
    const serverOptions = this.appOptions.serverOptions as Http2SecureServerOptions;
    if (serverOptions?.isHttp2SecureServer && !(this.appOptions.httpModule as typeof http2).createSecureServer) {
      throw new TypeError('http2.createSecureServer() not found (see the settings in main.ts)');
    }
  }

  protected scanRootModule(appModule: ModuleType) {
    const moduleManager = new ModuleManager(this.systemLogMediator);
    moduleManager.scanRootModule(appModule);
    return moduleManager;
  }

  protected getAppInitializer(moduleManager: ModuleManager) {
    this.appInitializer = new AppInitializer(this.appOptions, moduleManager, this.systemLogMediator);
    return this.appInitializer;
  }

  protected async bootstrapApplication(appInitializer: AppInitializer) {
    // Here, before init custom logger, works default logger.
    appInitializer.bootstrapProvidersPerApp();
    // Here, after init providers per app, reinit Logger with new config.
    this.systemLogMediator = appInitializer.systemLogMediator;
    (this.systemLogMediator as PublicLogMediator).updateOutputLogLevel();
    await appInitializer.bootstrapModulesAndExtensions();
    // Here, after init extensions, reinit Logger with new config.
    this.systemLogMediator = appInitializer.systemLogMediator;
    (this.systemLogMediator as PublicLogMediator).updateOutputLogLevel();
  }

  protected async createServerAndBindToListening(appInitializer: AppInitializer, resolve: AnyFn) {
    this.flushLogs();
    const server = await this.createServer(appInitializer.requestListener);
    (this.appInitializer as PublicAppInitializer).setServer(server);
    server.on('listening', () => {
      const info = server.address() as AddressInfo;
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

/**
 * This class is needed only to access the protected methods of the `LogMediator` class.
 */
class PublicLogMediator extends SystemLogMediator {
  override updateOutputLogLevel() {
    return super.updateOutputLogLevel();
  }
}
/**
 * This class is needed only to access the protected methods of the `AppInitializer` class.
 */
class PublicAppInitializer extends AppInitializer {
  override setServer(server: NodeServer) {
    return super.setServer(server);
  }
}
