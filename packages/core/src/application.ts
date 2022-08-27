import type * as http from 'http';
import type * as http2 from 'http2';
import type * as https from 'https';

import { RootMetadata } from './models/root-metadata';
import { AppInitializer } from './services/app-initializer';
import { LogManager } from './services/log-manager';
import { LogMediator } from './services/log-mediator';
import { ModuleManager } from './services/module-manager';
import { ModuleType, ModuleWithParams } from './types/mix';
import { Http2SecureServerOptions, RequestListener, Server } from './types/server-options';
import { getModuleMetadata } from './utils/get-module-metadata';
import { pickProperties } from './utils/pick-properties';
import { isHttp2SecureServerOptions } from './utils/type-guards';

export class Application {
  protected rootMeta: RootMetadata;
  protected logMediator: LogMediator;

  bootstrap(appModule: ModuleType) {
    return new Promise<{ server: Server }>(async (resolve, reject) => {
      try {
        const appInitializer = await this.init(appModule);
        const server = this.createServer(appInitializer.requestListener);
        server.listen(this.rootMeta.listenOptions, () => {
          appInitializer.serverListen();
          resolve({ server });
        });
      } catch (err) {
        this.logMediator.bufferLogs = false;
        this.logMediator.flush();
        reject(err);
      }
    });
  }

  protected async init(appModule: ModuleType) {
    this.logMediator = new LogMediator(new LogManager(), { name: 'AppModule' });
    this.mergeRootMetadata(appModule);
    const appInitializer = this.getAppInitializer(appModule, this.logMediator);
    // Before init custom user logger, works default logger.
    appInitializer.bootstrapProvidersPerApp();
    // After init custom user logger, works this custom logger.
    try {
      await appInitializer.bootstrapModulesAndExtensions();
      this.checkSecureServerOption(appModule);
    } catch (err) {
      appInitializer.flushLogs();
      throw err;
    }
    appInitializer.flushLogs();
    return appInitializer;
  }

  /**
   * Merge AppModule metadata with default metadata for root module.
   */
  protected mergeRootMetadata(module: ModuleType | ModuleWithParams): void {
    const serverMetadata = getModuleMetadata(module, true) as RootMetadata;
    this.rootMeta = new RootMetadata();
    pickProperties(this.rootMeta, serverMetadata);
    const { listenOptions } = this.rootMeta;
    listenOptions.host = listenOptions.host || 'localhost';
    listenOptions.port = listenOptions.port || 3000;
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

  protected createServer(requestListener: RequestListener) {
    if (isHttp2SecureServerOptions(this.rootMeta.serverOptions)) {
      const serverModule = this.rootMeta.httpModule as typeof http2;
      return serverModule.createSecureServer(this.rootMeta.serverOptions, requestListener);
    } else {
      const serverModule = this.rootMeta.httpModule as typeof http | typeof https;
      const serverOptions = this.rootMeta.serverOptions as http.ServerOptions | https.ServerOptions;
      return serverModule.createServer(serverOptions, requestListener);
    }
  }
}
