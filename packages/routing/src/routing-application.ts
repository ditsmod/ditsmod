import type * as http from 'node:http';
import type * as http2 from 'node:http2';
import type * as https from 'node:https';
import type { AddressInfo } from 'node:net';
import { ModuleType, SystemLogMediator, AppInitializer, Application } from '@ditsmod/core';

import { RoutingOptions } from './routing-options.js';
import { HttpServerModule, HttpsServerModule } from './http-module.js';
import { Http2SecureServerOptions, HttpServer } from './server-options.js';
import { isHttp2SecureServerOptions } from './type.guards.js';
import { RequestListener } from './request.js';

export class RoutingApplication extends Application {
  server: HttpServer;
  protected RoutingOptions: RoutingOptions;

  /**
   * @param appModule The root module of the application.
   * @param RoutingOptions Application options.
   */
  static async create(appModule: ModuleType, RoutingOptions?: RoutingOptions) {
    const app = new this();
    try {
      app.init(RoutingOptions);
      const moduleManager = app.scanRootModule(appModule);
      const appInitializer = new AppInitializer(app.RoutingOptions, moduleManager, app.systemLogMediator);
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

  protected override init(routingOptions?: RoutingOptions) {
    super.init(routingOptions);
    this.checkSecureServerOption();
  }

  protected checkSecureServerOption() {
    const serverOptions = this.RoutingOptions.serverOptions as Http2SecureServerOptions;
    if (serverOptions?.isHttp2SecureServer && !(this.RoutingOptions.httpModule as typeof http2).createSecureServer) {
      throw new TypeError('http2.createSecureServer() not found (see the settings in main.ts)');
    }
  }

  protected async createServerAndBindToListening(appInitializer: AppInitializer) {
    this.flushLogs();
    // this.server = await this.createServer(appInitializer.requestListener);
    // (appInitializer as PublicAppInitializer).setServer(this.server);
    // this.server.on('listening', () => {
    //   const info = this.server.address() as AddressInfo;
    //   this.systemLogMediator.serverListen(this, info.address, info.port);
    // });
  }

  protected async createServer(requestListener: RequestListener): Promise<HttpServer> {
    if (isHttp2SecureServerOptions(this.RoutingOptions.serverOptions || {})) {
      const serverModule = this.RoutingOptions.httpModule as typeof http2;
      return serverModule.createSecureServer(this.RoutingOptions.serverOptions || {}, requestListener);
    } else {
      const serverModule = (this.RoutingOptions.httpModule || (await import('http'))) as
        | HttpServerModule
        | HttpsServerModule;
      const serverOptions = this.RoutingOptions.serverOptions as http.ServerOptions | https.ServerOptions;
      return serverModule.createServer(serverOptions, requestListener);
    }
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
