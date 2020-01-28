import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';
import { parentPort, isMainThread, workerData } from 'worker_threads';
import { ListenOptions } from 'net';
import { Provider, ReflectiveInjector, reflector, ResolvedReflectiveProvider } from 'ts-di';

import { RootModuleDecorator } from '../types/decorators';
import {
  Server,
  Logger,
  ServerOptions,
  Http2SecureServerOptions,
  ModuleType,
  HttpModule,
  Router,
  RequestListener,
  NodeRequest,
  NodeResponse,
  NodeReqToken,
  NodeResToken,
  HttpMethod
} from '../types/types';
import { isHttp2SecureServerOptions } from '../utils/type-guards';
import { PreRequest } from '../services/pre-request.service';
import { Request } from '../request';
import { BootstrapModule } from './bootstrap.module';
import { defaultProvidersPerApp } from '../constants';

export class BootstrapRootModule {
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
    this.setModuleDefaultOptions();
    const moduleMetadata = this.extractModuleMetadata(appModule);
    this.initProvidersPerApp();
    this.log.trace(moduleMetadata);
    this.checkSecureServerOption(appModule);
    const bsMod = this.injectorPerApp.resolveAndInstantiate(BootstrapModule) as BootstrapModule;
    bsMod.bootstrap(appModule);
  }

  protected setModuleDefaultOptions() {
    this.serverName = 'restify-ts';
    this.httpModule = http as HttpModule;
    this.serverOptions = {} as ServerOptions;
    this.listenOptions = { port: 8080, host: 'localhost' };
    this.providersPerApp = [];
  }

  protected extractModuleMetadata(appModule: ModuleType) {
    const annotations = reflector.annotations(appModule) as RootModuleDecorator[];
    const moduleMetadata = annotations[0];
    if (!moduleMetadata) {
      throw new Error(`Module build failed: module "${appModule.name}" does not have the "@RootModule()" decorator`);
    }
    this.httpModule = moduleMetadata.httpModule || this.httpModule;
    this.serverOptions = moduleMetadata.serverOptions || this.serverOptions;
    this.serverOptions = { ...this.serverOptions };
    this.listenOptions = moduleMetadata.listenOptions || this.listenOptions;
    this.listenOptions = { ...this.listenOptions };
    this.providersPerApp = (moduleMetadata.providersPerApp || []).slice();
    return moduleMetadata;
  }

  /**
   * Init providers per the application.
   */
  protected initProvidersPerApp() {
    this.providersPerApp.unshift(...defaultProvidersPerApp);
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
     */
    const { injector, providers, controller, method } = handleRoute();
    const req = this.createReq(nodeReq, nodeRes, injector, providers);
    req.queryParams = req.parseQueryString(queryString);
    req.routeParams = routeParams;
    const ctrl = req.injector.get(controller);
    ctrl[method]();
  };

  /**
   * @param injector Injector per a module.
   * @param providers Providers per request.
   */
  protected createReq(
    nodeReq: NodeRequest,
    nodeRes: NodeResponse,
    injector: ReflectiveInjector,
    providers: ResolvedReflectiveProvider[]
  ) {
    const injector1 = injector.resolveAndCreateChild([
      { provide: NodeReqToken, useValue: nodeReq },
      { provide: NodeResToken, useValue: nodeRes }
    ]);
    const injector2 = injector1.createChildFromResolved(providers);
    return injector2.get(Request) as Request;
  }

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
