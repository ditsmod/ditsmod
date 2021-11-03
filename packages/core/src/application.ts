import { ReflectiveInjector } from '@ts-stack/di';
import * as http from 'http';
import * as http2 from 'http2';
import * as https from 'https';

import { RootMetadata } from './models/root-metadata';
import { AppInitializer } from './services/app-initializer';
import { DefaultLogger } from './services/default-logger';
import { defaultProvidersPerApp } from './services/default-providers-per-app';
import { Log } from './services/log';
import { ModuleManager } from './services/module-manager';
import { Logger, LoggerConfig } from './types/logger';
import { ModuleType } from './types/mix';
import { Http2SecureServerOptions, Server } from './types/server-options';
import { getModuleMetadata } from './utils/get-module-metadata';
import { isHttp2SecureServerOptions } from './utils/type-guards';

export class Application {
  protected meta: RootMetadata;
  protected log: Log;
  protected appInitializer: AppInitializer;

  bootstrap(appModule: ModuleType) {
    return new Promise<{ server: Server; logger: Logger }>(async (resolve, reject) => {
      try {
        await this.init(appModule);
        const server = this.createServer();
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
    this.createTemporaryLogger(appModule);
    const moduleManager = new ModuleManager(this.log);
    moduleManager.scanRootModule(appModule);
    this.appInitializer = new AppInitializer(moduleManager, this.log);
    this.appInitializer.bootstrapProvidersPerApp();
    const { meta, log } = this.appInitializer.getMetadataAndLog();
    this.meta = meta;
    this.log = log;
    await this.appInitializer.bootstrapModulesAndExtensions();
    const { log: lastLog } = this.appInitializer.getMetadataAndLog();
    this.log = lastLog;
    this.checkSecureServerOption(appModule);
    lastLog.bufferLogs = false;
    lastLog.flush();
  }

  /**
   * We need to set a logger as soon as possible. So, first we set the default logger.
   * Then we can set it to a logger from `providersPerApp` of the root module. And later it
   * can be seted to another logger in the process of initializing the application.
   */
  protected createTemporaryLogger(appModule: ModuleType) {
    const config = new LoggerConfig();
    const logger = new DefaultLogger(config) as Logger;
    this.log = new Log(logger);
    this.log.bufferLogs = true;
    const rawRootMetadata = getModuleMetadata(appModule, true);
    const providers = [...defaultProvidersPerApp, ...(rawRootMetadata.providersPerApp || [])];
    const injectorPerApp = ReflectiveInjector.resolveAndCreate(providers);
    const log = injectorPerApp.get(Log) as Log;
    log.buffer = this.log.buffer;
    log.bufferLogs = true;
    this.log = log;
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
      return serverModule.createSecureServer(this.meta.serverOptions, this.appInitializer.requestListener);
    } else {
      const serverModule = this.meta.httpModule as typeof http | typeof https;
      const serverOptions = this.meta.serverOptions as http.ServerOptions | https.ServerOptions;
      return serverModule.createServer(serverOptions, this.appInitializer.requestListener);
    }
  }
}
