import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';

import { PreRouter } from './services/pre-router';
import { Logger, LoggerConfig } from './types/logger';
import { Http2SecureServerOptions, Server } from './types/server-options';
import { DefaultLogger } from './services/default-logger';
import { AppInitializer } from './services/app-initializer';
import { NormalizedRootModuleMetadata } from './models/normalized-root-module-metadata';
import { ModuleType } from './types/module-type';
import { isHttp2SecureServerOptions } from './utils/type-guards';
import { ModuleManager } from './services/module-manager';

export class Application {
  protected opts: NormalizedRootModuleMetadata;
  protected log: Logger;
  protected preRouter: PreRouter;

  bootstrap(appModule: ModuleType) {
    return new Promise<{ server: Server; log: Logger }>(async (resolve, reject) => {
      try {
        const config = new LoggerConfig();
        this.log = new DefaultLogger(config);
        await this.init(appModule);
        const server = this.createServer();
        server.listen(this.opts.listenOptions, () => {
          resolve({ server, log: this.log });
          const host = this.opts.listenOptions.host || 'localhost';
          this.log.info(`${this.opts.serverName} is running at ${host}:${this.opts.listenOptions.port}`);
        });
      } catch (err) {
        reject({ err, log: this.log });
      }
    });
  }

  protected async init(appModule: ModuleType) {
    const moduleManager = new ModuleManager(this.log);
    const appInitializer = new AppInitializer();
    const { opts, log, preRouter } = await appInitializer.init(appModule, moduleManager);
    this.opts = opts;
    this.log = log;
    this.preRouter = preRouter;
    this.checkSecureServerOption(appModule);
  }

  protected checkSecureServerOption(appModule: ModuleType) {
    const serverOptions = this.opts.serverOptions as Http2SecureServerOptions;
    if (serverOptions?.isHttp2SecureServer && !(this.opts.httpModule as typeof http2).createSecureServer) {
      throw new TypeError(`serverModule.createSecureServer() not found (see ${appModule.name} settings)`);
    }
  }

  protected createServer() {
    if (isHttp2SecureServerOptions(this.opts.serverOptions)) {
      const serverModule = this.opts.httpModule as typeof http2;
      return serverModule.createSecureServer(this.opts.serverOptions, this.preRouter.requestListener);
    } else {
      const serverModule = this.opts.httpModule as typeof http | typeof https;
      const serverOptions = this.opts.serverOptions as http.ServerOptions | https.ServerOptions;
      return serverModule.createServer(serverOptions, this.preRouter.requestListener);
    }
  }
}
