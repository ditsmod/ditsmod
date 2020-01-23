import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';
import { parentPort, isMainThread, workerData } from 'worker_threads';
import { ListenOptions } from 'net';
import { reflector, Type } from 'ts-di';

import { RootModuleDecorator } from './decorators';
import {
  Server,
  ApplicationOptions,
  Logger,
  ServerOptions,
  Http2SecureServerOptions,
  ModuleType,
  ModuleWithProviders
} from './types';
import { Application } from './application';
import { pickProperties } from './utils/pick-properties';
import { isHttp2SecureServerOptions } from './utils/type-guards';
import { BootstrapModule } from './bootstrap.module';

type ServerModuleType = RootModuleDecorator['serverModule'];

export class BootstrapRootModule extends BootstrapModule {
  app: Application;
  log: Logger;
  serverName: string;
  serverModule: ServerModuleType;
  serverOptions: ServerOptions;
  server: Server;
  listenOptions: ListenOptions;

  bootstrapRootModule(appModule: ModuleType) {
    return new Promise<Server>((resolve, reject) => {
      try {
        this.prepareServerOptions(appModule);
        this.createServer();

        if (!isMainThread) {
          const port = (workerData && workerData.port) || 9000;
          this.listenOptions.port = port;
        }

        this.server.listen(this.listenOptions, () => {
          resolve(this.server);
          this.log.info(`${this.serverName} is running at ${this.listenOptions.host}:${this.listenOptions.port}`);

          if (!isMainThread) {
            parentPort.postMessage('Runing worker!');
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  protected prepareServerOptions(appModule: ModuleType) {
    this.setDefaultOptions();
    const moduleMetadata = this.extractModuleMetadata(appModule);
    const appOptions = pickProperties(new ApplicationOptions(), moduleMetadata);
    const app = new Application(appOptions);
    this.injectorPerMod = app.injector.resolveAndCreateChild(this.providersPerMod);
    const log = app.injector.get(Logger) as Logger;
    this.log = log;
    this.app = app;
    log.trace(moduleMetadata);
    this.setRoutes();
    this.checkSecureServerOption(appModule);
    this.importModules();
  }

  protected importModules() {
    this.imports.forEach(imp => {
      const annotations = reflector.annotations(imp);
      const impModuleMetadata = annotations[0];
      if (!impModuleMetadata) {
        throw new Error(`Module build failed: module "${imp.name}" does not have the "@Module()" decorator`);
      }
      console.log(impModuleMetadata);
    });
  }

  protected setDefaultOptions() {
    super.setDefaultOptions();
    this.serverName = 'restify-ts';
    this.serverModule = http as ServerModuleType;
    this.serverOptions = {} as ServerOptions;
    this.listenOptions = { port: 8080, host: 'localhost' };
  }

  protected extractModuleMetadata(appModule: ModuleType) {
    const moduleMetadata = super.extractModuleMetadata(appModule) as RootModuleDecorator;
    this.serverModule = moduleMetadata.serverModule || this.serverModule;
    this.serverOptions = moduleMetadata.serverOptions || this.serverOptions;
    this.listenOptions = moduleMetadata.listenOptions || this.listenOptions;
    return moduleMetadata;
  }

  protected checkSecureServerOption(appModule: ModuleType) {
    const serverOptions = this.serverOptions as Http2SecureServerOptions;
    if (serverOptions && serverOptions.isHttp2SecureServer && !(this.serverModule as typeof http2).createSecureServer) {
      throw new TypeError(`serverModule.createSecureServer() not found (see ${appModule.name} settings)`);
    }
  }

  protected createServer() {
    if (isHttp2SecureServerOptions(this.serverOptions)) {
      const serverModule = this.serverModule as typeof http2;
      this.server = serverModule.createSecureServer(this.serverOptions, this.app.requestListener);
    } else {
      const serverModule = this.serverModule as typeof http | typeof https;
      const serverOptions = this.serverOptions as http.ServerOptions | https.ServerOptions;
      this.server = serverModule.createServer(serverOptions, this.app.requestListener);
    }
  }
}
