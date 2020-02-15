import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';
import { parentPort, isMainThread, workerData } from 'worker_threads';
import { ReflectiveInjector, reflector, Type } from 'ts-di';

import { RootModuleDecorator } from './decorators/root-module';
import {
  Server,
  Logger,
  Http2SecureServerOptions,
  ModuleType,
  RequestListener,
  NodeReqToken,
  NodeResToken
} from './types/types';
import { isHttp2SecureServerOptions, isRootModule, isEntity, isColumn, isColumnType } from './utils/type-guards';
import { PreRequest } from './services/pre-request';
import { Request } from './request';
import { ModuleFactory } from './module-factory';
import { pickProperties } from './utils/pick-properties';
import { ApplicationMetadata } from './types/default-options';
import { mergeOpts } from './utils/merge-arrays-options';
import { StaticEntity, EntityInjector } from './decorators/entity';
import { ColumnDecoratorMetadata } from './decorators/column';
import { Router, HttpMethod } from './types/router';

export class AppFactory {
  protected log: Logger;
  protected server: Server;
  protected injectorPerApp: ReflectiveInjector;
  protected router: Router;
  protected preReq: PreRequest;

  // Setting default metadata.
  protected opts = new ApplicationMetadata();

  bootstrap(appModule: ModuleType) {
    return new Promise<Server>((resolve, reject) => {
      try {
        this.prepareServerOptions(appModule);
        this.createServer();

        if (!isMainThread) {
          const port = workerData?.port || 9000;
          this.opts.listenOptions.port = port;
        }

        this.server.listen(this.opts.listenOptions, () => {
          resolve(this.server);
          const host = this.opts.listenOptions.host || 'localhost';
          this.log.info(`${this.opts.serverName} is running at ${host}:${this.opts.listenOptions.port}`);

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
    this.mergeMetadata(appModule);
    this.setEntityMetadata();
    this.initProvidersPerApp();
    this.log.trace('Setting server name:', this.opts.serverName);
    this.log.trace('Setting listen options:', this.opts.listenOptions);
    this.checkSecureServerOption(appModule);
    if (!this.opts.routesPrefixPerMod.some(config => config.module === appModule)) {
      this.opts.routesPrefixPerMod.unshift({ prefix: '', module: appModule });
    }
    this.opts.routesPrefixPerMod.forEach(config => {
      const moduleFactory = this.injectorPerApp.resolveAndInstantiate(ModuleFactory) as ModuleFactory;
      moduleFactory.bootstrap(this.opts.routesPrefixPerApp, config.prefix, config.module);
    });
  }

  /**
   * Merge AppModule metadata with default ApplicationMetadata.
   */
  protected mergeMetadata(appModule: ModuleType): void {
    const modMetadata = this.getAppModuleMetadata(appModule);
    if (!modMetadata) {
      throw new Error(`Module build failed: module "${appModule.name}" does not have the "@RootModule()" decorator`);
    }

    const providersPerApp = mergeOpts(this.opts.providersPerApp, modMetadata.providersPerApp);
    pickProperties(this.opts, modMetadata);
    this.opts.providersPerApp = providersPerApp;
    this.opts.routesPrefixPerMod = this.opts.routesPrefixPerMod.slice();
    this.opts.entities = this.opts.entities.slice();
  }

  /**
   * Settings an Entity and Column metadata.
   */
  protected setEntityMetadata() {
    const resolvedProviders = ReflectiveInjector.resolve(this.opts.entities);
    const injector = ReflectiveInjector.fromResolvedProviders(resolvedProviders);
    this.opts.providersPerApp.unshift({ provide: EntityInjector, useValue: injector });

    resolvedProviders.forEach(item => {
      const Token = item.key.token as Type<any>;
      const instance = injector.get(Token);
      const Entity = instance?.constructor as typeof StaticEntity;
      const entityMetadata = reflector.annotations(Entity).find(isEntity);
      if (entityMetadata) {
        const columnMetadata = reflector.propMetadata(Entity) as ColumnDecoratorMetadata;
        // console.log(columnMetadata);
        Entity.entityMetadata = entityMetadata;
        Entity.columnMetadata = columnMetadata;
        Entity.metadata = {
          tableName: entityMetadata.tableName || Entity.name,
          primaryColumns: [],
          databaseService: {} as any
        };
        for (const prop in columnMetadata) {
          const type = columnMetadata[prop].find(isColumnType);
          const column = columnMetadata[prop].find(isColumn);
          if (column.isPrimaryColumn) {
            Entity.metadata.primaryColumns.push(prop);
          }
          console.log(prop, type);
        }
        console.log(Entity.metadata.primaryColumns);
      }
    });
  }

  protected getAppModuleMetadata(appModule: ModuleType): RootModuleDecorator {
    return reflector.annotations(appModule).find(isRootModule);
  }

  /**
   * Init providers per the application.
   */
  protected initProvidersPerApp() {
    this.injectorPerApp = ReflectiveInjector.resolveAndCreate(this.opts.providersPerApp);
    this.log = this.injectorPerApp.get(Logger) as Logger;
    this.router = this.injectorPerApp.get(Router) as Router;
    this.preReq = this.injectorPerApp.get(PreRequest) as PreRequest;
  }

  protected checkSecureServerOption(appModule: ModuleType) {
    const serverOptions = this.opts.serverOptions as Http2SecureServerOptions;
    if (serverOptions?.isHttp2SecureServer && !(this.opts.httpModule as typeof http2).createSecureServer) {
      throw new TypeError(`serverModule.createSecureServer() not found (see ${appModule.name} settings)`);
    }
  }

  protected requestListener: RequestListener = (nodeReq, nodeRes) => {
    nodeRes.setHeader('Server', this.opts.serverName);
    const { method: httpMethod, url } = nodeReq;
    const [uri, queryString] = this.preReq.decodeUrl(url).split('?');
    const { handle: handleRoute, params } = this.router.find(httpMethod as HttpMethod, uri);
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
    req.handleRoute(controller, method, params, queryString, parseBody, routeData);
  };

  protected createServer() {
    if (isHttp2SecureServerOptions(this.opts.serverOptions)) {
      const serverModule = this.opts.httpModule as typeof http2;
      this.server = serverModule.createSecureServer(this.opts.serverOptions, this.requestListener);
    } else {
      const serverModule = this.opts.httpModule as typeof http | typeof https;
      const serverOptions = this.opts.serverOptions as http.ServerOptions | https.ServerOptions;
      this.server = serverModule.createServer(serverOptions, this.requestListener);
    }
  }
}
