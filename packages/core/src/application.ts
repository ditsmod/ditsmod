import * as http from 'http';
import * as http2 from 'http2';
import * as https from 'https';

import { RootMetadata } from './models/root-metadata';
import { AppInitializer } from './services/app-initializer';
import { LogManager } from './services/log-manager';
import { LogMediator } from './services/log-mediator';
import { ModuleManager } from './services/module-manager';
import { Logger } from './types/logger';
import { ModuleType, ModuleWithParams } from './types/mix';
import { Http2SecureServerOptions, Server } from './types/server-options';
import { getModuleMetadata } from './utils/get-module-metadata';
import { pickProperties } from './utils/pick-properties';
import { isHttp2SecureServerOptions } from './utils/type-guards';

export class Application {
  protected rootMeta: RootMetadata;
  protected logMediator: LogMediator;

  bootstrap(appModule: ModuleType) {
    return new Promise<{ server: Server; logger: Logger }>(async (resolve, reject) => {
      try {
        const appInitializer = await this.init(appModule);
        const server = this.createServer(appInitializer);
        const { listenOptions } = this.rootMeta;
        server.listen(listenOptions, () => {
          resolve({ server, logger: this.logMediator.logger });
          appInitializer.serverListen(listenOptions.host!, this.rootMeta.serverName, listenOptions.port!);
        });
      } catch (err) {
        this.logMediator.bufferLogs = false;
        this.logMediator.flush();
        reject({ err, logger: this.logMediator.logger });
      }
    });
  }

  protected async init(appModule: ModuleType) {
    this.logMediator = new LogMediator(new LogManager());
    this.mergeRootMetadata(appModule);
    const appInitializer = this.getAppInitializer(appModule, this.logMediator);
    // Before init custom user logger, works default logger.
    appInitializer.bootstrapProvidersPerApp();
    // After init custom user logger, works this logger.
    try {
      await appInitializer.bootstrapModulesAndExtensions();
    } catch (err) {
      appInitializer.flushLogs();
      throw err;
    }
    this.checkSecureServerOption(appModule);
    appInitializer.flushLogs();
    return appInitializer;
  }

  /**
   * Merge AppModule metadata with default metadata for root module.
   *
   * @param meta Metadata for the root module.
   */
  protected mergeRootMetadata(module: ModuleType | ModuleWithParams): void {
    const serverMetadata = getModuleMetadata(module, true) as RootMetadata;
    this.rootMeta = new RootMetadata();
    pickProperties(this.rootMeta, serverMetadata);
    const { listenOptions } = this.rootMeta;
    listenOptions.host = listenOptions.host || 'localhost';
    listenOptions.port = listenOptions.port || 8080;
  }

  protected getAppInitializer(appModule: ModuleType, logMediator: LogMediator) {
    const moduleManager = new ModuleManager(logMediator);
    moduleManager.scanRootModule(appModule);
    return new AppInitializer(this.rootMeta, moduleManager, logMediator);
  }

  protected checkSecureServerOption(appModule: ModuleType) {
    const serverOptions = this.rootMeta.serverOptions as Http2SecureServerOptions;
    if (serverOptions?.isHttp2SecureServer && !(this.rootMeta.httpModule as typeof http2).createSecureServer) {
      throw new TypeError(`serverModule.createSecureServer() not found (see ${appModule.name} settings)`);
    }
  }

  protected createServer(appInitializer: AppInitializer) {
    if (isHttp2SecureServerOptions(this.rootMeta.serverOptions)) {
      const serverModule = this.rootMeta.httpModule as typeof http2;
      return serverModule.createSecureServer(this.rootMeta.serverOptions, appInitializer.requestListener);
    } else {
      const serverModule = this.rootMeta.httpModule as typeof http | typeof https;
      const serverOptions = this.rootMeta.serverOptions as http.ServerOptions | https.ServerOptions;
      return serverModule.createServer(serverOptions, appInitializer.requestListener);
    }
  }
}
