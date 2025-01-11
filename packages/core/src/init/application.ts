import type * as http from 'node:http';
import type * as http2 from 'node:http2';
import type * as https from 'node:https';
import type { AddressInfo } from 'node:net';

import { LogMediator } from '#logger/log-mediator.js';
import { PublicLogMediator, SystemLogMediator } from '#logger/system-log-mediator.js';
import { AppOptions } from '#types/app-options.js';
import { HttpServerModule, HttpsServerModule } from '#types/http-module.js';
import { ModuleType } from '#types/mix.js';
import { Http2SecureServerOptions, HttpServer } from '#types/server-options.js';
import { ModuleManager } from '#init/module-manager.js';
import { isHttp2SecureServerOptions } from '#utils/type-guards.js';
import { AppInitializer, PublicAppInitializer } from '#init/app-initializer.js';

export class Application {
  server: HttpServer;
  protected appOptions: AppOptions;
  protected systemLogMediator: SystemLogMediator;

  /**
   * @param appModule The root module of the application.
   * @param appOptions Application options.
   */
  static async create(appModule: ModuleType, appOptions?: AppOptions) {
    const app = new this();
    try {
      app.init(appOptions);
      const moduleManager = app.scanRootModule(appModule);
      const appInitializer = new AppInitializer(app.appOptions, moduleManager, app.systemLogMediator);
      await app.bootstrapApplication(appInitializer);
      await app.createServerAndBindToListening(appInitializer);
      return app;
    } catch (err: any) {
      (app.systemLogMediator as PublicLogMediator).updateOutputLogLevel();
      app.systemLogMediator.internalServerError(app, err, true);
      app.flushLogs();
      throw err;
    }
  }

  protected init(appOptions?: AppOptions) {
    if (Error.stackTraceLimit == 10) {
      Error.stackTraceLimit = 50; // Override default limit.
    }
    this.systemLogMediator = new SystemLogMediator({ moduleName: 'app' });
    this.appOptions = { ...new AppOptions(), ...appOptions };
    LogMediator.bufferLogs = this.appOptions.bufferLogs;
    this.systemLogMediator.startingDitsmod(this); // OutputLogLevel is still unknown here.
    this.checkSecureServerOption();
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

  protected async createServerAndBindToListening(appInitializer: AppInitializer) {
    this.flushLogs();
    // this.server = await this.createServer(appInitializer.requestListener);
    (appInitializer as PublicAppInitializer).setServer(this.server);
    this.server.on('listening', () => {
      const info = this.server.address() as AddressInfo;
      this.systemLogMediator.serverListen(this, info.address, info.port);
    });
  }

  protected flushLogs() {
    LogMediator.bufferLogs = false;
    this.systemLogMediator.flush();
  }

  // protected async createServer(requestListener: RequestListener): Promise<HttpServer> {
  //   if (isHttp2SecureServerOptions(this.appOptions.serverOptions || {})) {
  //     const serverModule = this.appOptions.httpModule as typeof http2;
  //     return serverModule.createSecureServer(this.appOptions.serverOptions || {}, requestListener);
  //   } else {
  //     const serverModule = (this.appOptions.httpModule || (await import('http'))) as
  //       | HttpServerModule
  //       | HttpsServerModule;
  //     const serverOptions = this.appOptions.serverOptions as http.ServerOptions | https.ServerOptions;
  //     return serverModule.createServer(serverOptions, requestListener);
  //   }
  // }
}
