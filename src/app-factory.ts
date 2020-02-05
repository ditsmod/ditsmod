import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';
import { parentPort, isMainThread, workerData } from 'worker_threads';
import { ListenOptions } from 'net';
import { Provider, ReflectiveInjector, reflector } from 'ts-di';

import { RootModuleDecorator, RoutesPrefixPerMod } from './types/decorators';
import {
  Server,
  Logger,
  ServerOptions,
  Http2SecureServerOptions,
  ModuleType,
  HttpModule,
  Router,
  RequestListener,
  NodeReqToken,
  NodeResToken,
  HttpMethod
} from './types/types';
import { isHttp2SecureServerOptions, isRootModule } from './utils/type-guards';
import { PreRequest } from './services/pre-request';
import { Request } from './request';
import { ModuleFactory } from './module-factory';
import { pickProperties } from './utils/pick-properties';
import { ApplicationMetadata } from './types/default-options';
import { mergeOpts } from './utils/merge-arrays-options';

export class AppFactory {
  protected log: Logger;
  protected serverName: string;
  protected httpModule: HttpModule;
  protected serverOptions: ServerOptions;
  protected server: Server;
  protected listenOptions: ListenOptions;
  protected providersPerApp: Provider[];
  protected injectorPerApp: ReflectiveInjector;
  protected router: Router;
  protected preReq: PreRequest;
  protected routesPrefixPerApp: string;
  protected routesPrefixPerMod: RoutesPrefixPerMod[];

  bootstrap(appModule: ModuleType) {
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
          const host = this.listenOptions.host || 'localhost';
          this.log.info(`${this.serverName} is running at ${host}:${this.listenOptions.port}`);

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
    const appMetadata = this.mergeMetadata(appModule);
    Object.assign(this, appMetadata);
    this.initProvidersPerApp();
    this.log.trace('Setting server name:', this.serverName);
    this.log.trace('Setting listen options:', this.listenOptions);
    this.checkSecureServerOption(appModule);
    const moduleFactory = this.injectorPerApp.resolveAndInstantiate(ModuleFactory) as ModuleFactory;
    moduleFactory.bootstrap(this.routesPrefixPerApp, this.routesPrefixPerMod, appModule);
  }

  /**
   * Merge AppModule metadata with default ApplicationMetadata.
   */
  protected mergeMetadata(appModule: ModuleType) {
    const modMetadata = this.getAppModuleMetadata(appModule);
    if (!modMetadata) {
      throw new Error(`Module build failed: module "${appModule.name}" does not have the "@RootModule()" decorator`);
    }

    // Setting default metadata.
    const metadata = new ApplicationMetadata();

    const providersPerApp = mergeOpts(metadata.providersPerApp, modMetadata.providersPerApp);
    pickProperties(metadata, modMetadata);
    metadata.providersPerApp = providersPerApp;
    metadata.routesPrefixPerMod = metadata.routesPrefixPerMod.slice();
    return metadata;
  }

  protected getAppModuleMetadata(appModule: ModuleType): RootModuleDecorator {
    return reflector.annotations(appModule).find(m => isRootModule(m));
  }

  /**
   * Init providers per the application.
   */
  protected initProvidersPerApp() {
    this.injectorPerApp = ReflectiveInjector.resolveAndCreate(this.providersPerApp);
    this.log = this.injectorPerApp.get(Logger) as Logger;
    this.router = this.injectorPerApp.get(Router) as Router;
    this.preReq = this.injectorPerApp.get(PreRequest) as PreRequest;
  }

  protected checkSecureServerOption(appModule: ModuleType) {
    const serverOptions = this.serverOptions as Http2SecureServerOptions;
    if (serverOptions && serverOptions.isHttp2SecureServer && !(this.httpModule as typeof http2).createSecureServer) {
      throw new TypeError(`serverModule.createSecureServer() not found (see ${appModule.name} settings)`);
    }
  }

  protected requestListener: RequestListener = (nodeReq, nodeRes) => {
    nodeRes.setHeader('Server', this.serverName);
    const { method: httpMethod, url } = nodeReq;
    const [uri, queryString] = this.preReq.decodeUrl(url).split('?');
    const { handle: handleRoute, params: routeParams } = this.router.find(httpMethod as HttpMethod, uri);
    if (!handleRoute) {
      this.preReq.sendNotFound(nodeRes);
      return;
    }
    /**
     * @param injector Injector per module that tied to the route.
     * @param providers Resolved providers per request.
     * @param method Method of the class controller.
     * @param parseBody Need or not to parse body.
     */
    const { injector, providers, controller, method, parseBody, routeData } = handleRoute();
    const inj1 = injector.resolveAndCreateChild([
      { provide: NodeReqToken, useValue: nodeReq },
      { provide: NodeResToken, useValue: nodeRes }
    ]);
    const inj2 = inj1.createChildFromResolved(providers);
    const req = inj2.get(Request) as Request;
    req.handleRoute(controller, method, routeParams, queryString, parseBody, routeData);
  };

  protected createServer() {
    if (isHttp2SecureServerOptions(this.serverOptions)) {
      const serverModule = this.httpModule as typeof http2;
      this.server = serverModule.createSecureServer(this.serverOptions, this.requestListener);
    } else {
      const serverModule = this.httpModule as typeof http | typeof https;
      const serverOptions = this.serverOptions as http.ServerOptions | https.ServerOptions;
      this.server = serverModule.createServer(serverOptions, this.requestListener);
    }
  }
}
