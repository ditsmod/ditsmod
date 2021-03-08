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

export class Application {
  protected meta: NormalizedRootModuleMetadata;
  protected log: Logger;
  protected preRouter: PreRouter;

  bootstrap(appModule: ModuleType) {
    return new Promise<{ server: Server; log: Logger }>(async (resolve, reject) => {
      try {
        const config = new LoggerConfig();
        this.log = new DefaultLogger(config);
        await this.init(appModule);
        const server = this.createServer();
        server.listen(this.meta.listenOptions, () => {
          resolve({ server, log: this.log });
          const host = this.meta.listenOptions.host || 'localhost';
          this.log.info(`${this.meta.serverName} is running at ${host}:${this.meta.listenOptions.port}`);
        });
      } catch (err) {
        reject({ err, log: this.log });
      }
    });
  }

  protected async init(appModule: ModuleType) {
    
    const appInitializer = new AppInitializer();
    const { meta, log, preRouter } = await appInitializer.init(appModule, this.log);
    this.meta = meta;
    this.log = log;
    this.preRouter = preRouter;
    this.checkSecureServerOption(appModule);
  }

  protected checkSecureServerOption(appModule: ModuleType) {
    const serverOptions = this.meta.serverOptions as Http2SecureServerOptions;
    if (serverOptions?.isHttp2SecureServer && !(this.meta.httpModule as typeof http2).createSecureServer) {
      throw new TypeError(`serverModule.createSecureServer() not found (see ${appModule.name} settings)`);
    }
  }

  protected createServer() {
    if (isHttp2SecureServerOptions(this.meta.serverOptions)) {
      const serverModule = this.meta.httpModule as typeof http2;
      return serverModule.createSecureServer(this.meta.serverOptions, this.preRouter.requestListener);
    } else {
      const serverModule = this.meta.httpModule as typeof http | typeof https;
      const serverOptions = this.meta.serverOptions as http.ServerOptions | https.ServerOptions;
      return serverModule.createServer(serverOptions, this.preRouter.requestListener);
    }
  }
}
