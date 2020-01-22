import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';
import { reflector, TypeProvider } from 'ts-di';
import { parentPort, isMainThread, workerData } from 'worker_threads';
import { ListenOptions } from 'net';

import { RootModuleDecorator, ControllersDecorator, RouteDecoratorMetadata } from './decorators';
import { Server, ApplicationOptions, Logger, ServerOptions } from './types';
import { Application } from './application';
import { pickProperties } from './utils/pick-properties';

type ServerModuleType = RootModuleDecorator['serverModule'];
type AppModuleType = new (...args: any[]) => any;

export class BootstrapModule {
  app: Application;
  log: Logger;
  serverName: string;
  serverModule: ServerModuleType;
  serverOptions: ServerOptions;
  server: Server;
  controllers: TypeProvider[];
  listenOptions: ListenOptions;

  bootstrapRootModule(appModule: AppModuleType) {
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

  protected prepareServerOptions(appModule: AppModuleType) {
    this.setDefaultOptions();
    const moduleMetadata = this.extractModuleMetadata(appModule);
    const appOptions = pickProperties(new ApplicationOptions(), moduleMetadata);
    const app = new Application(appOptions);
    const log = app.injector.get(Logger) as Logger;
    this.log = log;
    this.app = app;
    log.trace(moduleMetadata);
    this.setRoutes();
    this.checkSecureServerOption(appModule);
  }

  protected setDefaultOptions() {
    this.serverName = 'restify-ts';
    this.serverModule = http as ServerModuleType;
    this.serverOptions = {} as ServerOptions;
    this.listenOptions = { port: 8080, host: 'localhost' };
    this.controllers = [];
  }

  protected extractModuleMetadata(appModule: AppModuleType) {
    const annotations = reflector.annotations(appModule) as RootModuleDecorator[];
    const moduleMetadata = annotations[0];
    if (!moduleMetadata) {
      throw new Error(`Module build failed: module "${appModule.name}" does not have the "@RootModule()" decorator`);
    }
    this.serverModule = moduleMetadata.serverModule || this.serverModule;
    this.serverOptions = moduleMetadata.serverOptions || this.serverOptions;
    this.listenOptions = moduleMetadata.listenOptions || this.listenOptions;
    this.controllers = moduleMetadata.controllers || this.controllers;
    return moduleMetadata;
  }

  protected setRoutes() {
    this.controllers.forEach(Controller => {
      const controllerMetadata: ControllersDecorator = reflector.annotations(Controller)[0];
      if (!controllerMetadata) {
        throw new Error(
          `Setting routes failed: controller "${Controller.name}" does not have the "@Controller()" decorator`
        );
      }
      const rootPath = controllerMetadata.path;
      const controllerProps: RouteDecoratorMetadata = reflector.propMetadata(Controller);
      for (const method in controllerProps) {
        for (const route of controllerProps[method]) {
          if (!route.method) {
            // Here we have another decorator, not @Route().
            continue;
          }
          let path: string;
          if (rootPath == '/') {
            path = route.path ? `/${route.path}` : '/';
          } else if (!route.path) {
            path = rootPath;
          } else {
            path = `${rootPath}/${route.path}`;
          }
          this.app.setRoute(route.method, path, Controller, method);

          if (this.log.trace()) {
            const msg = {
              httpMethod: route.method,
              path,
              handler: `${Controller.name} -> ${method}()`
            };
            this.log.trace(msg);
          }
          break;
        }
      }
    });
  }

  protected checkSecureServerOption(appModule: AppModuleType) {
    if (
      this.serverOptions &&
      this.serverOptions.http2CreateSecureServer &&
      !(this.serverModule as typeof http2).createSecureServer
    ) {
      throw new TypeError(`serverModule.createSecureServer() not found (see ${appModule.name} settings)`);
    }
  }

  protected createServer() {
    if (this.serverOptions.http2CreateSecureServer) {
      const serverModule = this.serverModule as typeof http2;
      const serverOptions = this.serverOptions as http2.SecureServerOptions;
      this.server = serverModule.createSecureServer(serverOptions, this.app.requestListener);
    } else {
      const serverModule = this.serverModule as typeof http | typeof https;
      const serverOptions = this.serverOptions as http.ServerOptions | https.ServerOptions;
      this.server = serverModule.createServer(serverOptions, this.app.requestListener);
    }
  }
}
