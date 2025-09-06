import type * as http from 'node:http';
import type * as http2 from 'node:http2';
import type * as https from 'node:https';
import type { AddressInfo } from 'node:net';
import { ModuleType, SystemLogMediator, BaseApplication } from '@ditsmod/core';

import { RequestListener, TrpcAppOptions } from '#types/types.js';
import { TrpcAppInitializer } from './trpc-app-initializer.js';
import { HttpServer, Http2SecureServerOptions } from '#types/server-options.js';
import { CreateSecureServerInHttp2NotFound } from '../error/trpc-errors.js';
import { isHttp2SecureServerOptions } from '#utils/type.guards.js';
import { HttpServerModule, HttpsServerModule } from '#types/http-module.js';

export class TrpcApplication extends BaseApplication {
  server: HttpServer;
  declare protected appOptions: TrpcAppOptions;

  /**
   * @param appModule The root module of the application.
   * @param trpcAppOptions TrpcApplication options.
   */
  static async create(appModule: ModuleType, trpcAppOptions?: TrpcAppOptions) {
    const app = new this();
    try {
      app.init(trpcAppOptions);
      const moduleManager = app.scanRootModule(appModule);
      const appInitializer = new TrpcAppInitializer(app.appOptions, moduleManager, app.log);
      await app.bootstrapApplication(appInitializer);
      await app.createServerAndBindToListening(appInitializer);
      return app;
    } catch (err: any) {
      (app.log as PublicLogMediator).updateOutputLogLevel();
      app.log.internalServerError(app, err);
      app.flushLogs();
      process.exit(1);
    }
  }

  protected override init(trpcOptions?: TrpcAppOptions) {
    this.appOptions = { ...trpcOptions };
    super.init(trpcOptions);
    this.checkSecureServerOption();
  }

  protected async createServerAndBindToListening(appInitializer: TrpcAppInitializer) {
    this.flushLogs();
    this.server = await this.createServer(appInitializer.requestListener);
    appInitializer.setServer(this.server);
    this.server.on('listening', () => {
      const info = this.server.address() as AddressInfo;
      this.log.serverListen(this, info.address, info.port);
    });
  }

  protected checkSecureServerOption() {
    const serverOptions = this.appOptions.serverOptions as Http2SecureServerOptions;
    if (serverOptions?.isHttp2SecureServer && !(this.appOptions.httpModule as typeof http2).createSecureServer) {
      throw new CreateSecureServerInHttp2NotFound();
    }
  }

  protected async createServer(requestListener: RequestListener): Promise<HttpServer> {
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
export class PublicLogMediator extends SystemLogMediator {
  override updateOutputLogLevel() {
    return super.updateOutputLogLevel();
  }
}
