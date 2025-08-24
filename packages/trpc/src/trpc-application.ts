import type { AddressInfo } from 'node:net';
import { createServer, RequestListener, type Server } from 'node:http';
import { ModuleType, SystemLogMediator, BaseApplication } from '@ditsmod/core';

import { TrpcAppOptions } from './types.js';
import { TrpcAppInitializer } from './trpc-app-initializer.js';

export class TrpcApplication extends BaseApplication {
  server: Server;
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

  protected async createServer(requestListener: RequestListener) {
    return createServer(requestListener);
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
