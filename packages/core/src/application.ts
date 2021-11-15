import * as http from 'http';
import * as http2 from 'http2';
import * as https from 'https';
import { LogManager } from './services/log-manager';

import { RootMetadata } from './models/root-metadata';
import { AppInitializer } from './services/app-initializer';
import { Log } from './services/log';
import { ModuleManager } from './services/module-manager';
import { Logger } from './types/logger';
import { ModuleType } from './types/mix';
import { Http2SecureServerOptions, Server } from './types/server-options';
import { isHttp2SecureServerOptions } from './utils/type-guards';

export class Application {
  protected meta: RootMetadata;
  protected log: Log;

  bootstrap(appModule: ModuleType) {
    return new Promise<{ server: Server; logger: Logger }>(async (resolve, reject) => {
      try {
        const appInitializer = await this.init(appModule);
        const server = this.createServer(appInitializer);
        server.listen(this.meta.listenOptions, () => {
          resolve({ server, logger: this.log.logger });
          const host = this.meta.listenOptions.host || 'localhost';
          this.log.serverListen('info', this.meta.serverName, host, this.meta.listenOptions.port);
        });
      } catch (err) {
        this.log.bufferLogs = false;
        this.log.flush();
        reject({ err, logger: this.log.logger });
      }
    });
  }

  protected async init(appModule: ModuleType) {
    this.log = new Log(new LogManager());
    const appInitializer = this.getAppInitializer(appModule, this.log);
    this.meta = await appInitializer.initAndGetMetadata();
    this.checkSecureServerOption(appModule);
    appInitializer.flushLogs();
    return appInitializer;
  }

  protected getAppInitializer(appModule: ModuleType, log: Log) {
    const moduleManager = new ModuleManager(log);
    moduleManager.scanRootModule(appModule);
    return new AppInitializer(moduleManager, log);
  }

  protected checkSecureServerOption(appModule: ModuleType) {
    const serverOptions = this.meta.serverOptions as Http2SecureServerOptions;
    if (serverOptions?.isHttp2SecureServer && !(this.meta.httpModule as typeof http2).createSecureServer) {
      throw new TypeError(`serverModule.createSecureServer() not found (see ${appModule.name} settings)`);
    }
  }

  protected createServer(appInitializer: AppInitializer) {
    if (isHttp2SecureServerOptions(this.meta.serverOptions)) {
      const serverModule = this.meta.httpModule as typeof http2;
      return serverModule.createSecureServer(this.meta.serverOptions, appInitializer.requestListener);
    } else {
      const serverModule = this.meta.httpModule as typeof http | typeof https;
      const serverOptions = this.meta.serverOptions as http.ServerOptions | https.ServerOptions;
      return serverModule.createServer(serverOptions, appInitializer.requestListener);
    }
  }
}
