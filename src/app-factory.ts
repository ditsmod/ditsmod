import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';
import { parentPort, isMainThread, workerData } from 'worker_threads';
import { ReflectiveInjector, reflector, Provider, Type, resolveForwardRef } from '@ts-stack/di';

import { ApplicationMetadata, RootModuleDecorator, defaultProvidersPerApp } from './decorators/root-module';
import { RequestListener } from './types/types';
import { isHttp2SecureServerOptions, isRootModule } from './utils/type-guards';
import { PreRequest } from './services/pre-request';
import { Request } from './request';
import { ModuleFactory } from './module-factory';
import { pickProperties } from './utils/pick-properties';
import { Router, HttpMethod } from './types/router';
import { NodeResToken, NodeReqToken } from './types/injection-tokens';
import { Logger } from './types/logger';
import { Server, Http2SecureServerOptions } from './types/server-options';
import {
  ModuleType,
  ModuleWithOptions,
  ModuleDecorator,
  ProvidersMetadata,
  defaultProvidersPerReq,
} from './decorators/module';
import { getDuplicates } from './utils/get-duplicates';
import { flatten, normalizeProviders } from './utils/ng-utils';
import { Factory } from './factory';
import { deepFreeze } from './utils/deep-freeze';

export class AppFactory extends Factory {
  protected log: Logger;
  protected server: Server;
  protected injectorPerApp: ReflectiveInjector;
  protected router: Router;
  protected preReq: PreRequest;
  protected opts: ApplicationMetadata;

  bootstrap(appModule: ModuleType) {
    return new Promise<{ server: Server; log: Logger }>((resolve, reject) => {
      try {
        this.prepareServerOptions(appModule);
        this.createServer();

        if (!isMainThread) {
          const port = workerData?.port || 9000;
          this.opts.listenOptions.port = port;
        }

        this.server.listen(this.opts.listenOptions, () => {
          resolve({ server: this.server, log: this.log });
          const host = this.opts.listenOptions.host || 'localhost';
          this.log.info(`${this.opts.serverName} is running at ${host}:${this.opts.listenOptions.port}`);

          if (!isMainThread) {
            parentPort.postMessage('Runing worker!');
          }
        });
      } catch (err) {
        reject({ err, log: this.log });
      }
    });
  }

  protected prepareServerOptions(appModule: ModuleType) {
    this.mergeMetadata(appModule);
    this.checkSecureServerOption(appModule);
    this.prepareProvidersPerApp(appModule);
    this.opts.providersPerApp.unshift(...defaultProvidersPerApp);
    this.initProvidersPerApp();
    this.log.trace('Setting server name:', this.opts.serverName);
    this.log.trace('Setting listen options:', this.opts.listenOptions);
    return this.bootstrapModuleFactory(appModule);
  }

  /**
   * Merge AppModule metadata with default ApplicationMetadata.
   */
  protected mergeMetadata(appModule: ModuleType): void {
    const modMetadata = deepFreeze(reflector.annotations(appModule).find(isRootModule));
    if (!modMetadata) {
      throw new Error(`Module build failed: module "${appModule.name}" does not have the "@RootModule()" decorator`);
    }

    // Setting default metadata.
    this.opts = new ApplicationMetadata();

    pickProperties(this.opts, modMetadata);
  }

  protected checkSecureServerOption(appModule: ModuleType) {
    const serverOptions = this.opts.serverOptions as Http2SecureServerOptions;
    if (serverOptions?.isHttp2SecureServer && !(this.opts.httpModule as typeof http2).createSecureServer) {
      throw new TypeError(`serverModule.createSecureServer() not found (see ${appModule.name} settings)`);
    }
  }

  /**
   * 1. checks collisions for non-root exported providers per app;
   * 2. then merges these providers with providers that declared on root module.
   */
  protected prepareProvidersPerApp(appModule: ModuleType) {
    // Here we work only with providers declared at the application level.

    const exportedProviders = this.importProvidersPerApp(appModule);
    const rootTokens = normalizeProviders(this.opts.providersPerApp).map((np) => np.provide);
    const exportedNormProviders = normalizeProviders(exportedProviders);
    const exportedTokens = exportedNormProviders.map((np) => np.provide);
    const exportedMultiTokens = exportedNormProviders.filter((np) => np.multi).map((np) => np.provide);
    const defaultTokens = normalizeProviders([...defaultProvidersPerApp]).map((np) => np.provide);
    const mergedTokens = [...exportedTokens, ...defaultTokens];
    let exportedTokensDuplicates = getDuplicates(mergedTokens).filter(
      (d) => !rootTokens.includes(d) && !exportedMultiTokens.includes(d)
    );
    const mergedProviders = [...defaultProvidersPerApp, ...exportedProviders];
    exportedTokensDuplicates = this.getTokensCollisions(exportedTokensDuplicates, mergedProviders);
    if (exportedTokensDuplicates.length) {
      this.throwProvidersCollisionError(appModule.name, exportedTokensDuplicates);
    }
    this.opts.providersPerApp.unshift(...exportedProviders);
  }

  /**
   * Recursively collects per app providers from non-root modules.
   */
  protected importProvidersPerApp(modOrObject: Type<any> | ModuleWithOptions<any>) {
    const modName = this.getModuleName(modOrObject);
    const modMetadata = this.getRawModuleMetadata(modOrObject) as RootModuleDecorator | ModuleDecorator;
    this.checkModuleMetadata(modMetadata, modName);

    const imports = flatten(modMetadata.imports).map<Type<any> | ModuleWithOptions<any>>(resolveForwardRef);
    const providersPerApp: Provider[] = [];
    imports.forEach((imp) => providersPerApp.push(...this.importProvidersPerApp(imp)));
    const currProvidersPerApp = isRootModule(modMetadata) ? [] : flatten(modMetadata.providersPerApp);

    return [...providersPerApp, ...this.getUniqProviders(currProvidersPerApp)];
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

  protected bootstrapModuleFactory(appModule: ModuleType) {
    const globalProviders = this.getGlobalProviders(appModule);
    this.log.trace('Setting globalProviders:', globalProviders);
    const rootModule = this.injectorPerApp.resolveAndInstantiate(ModuleFactory) as ModuleFactory;
    return rootModule.bootstrap(globalProviders, this.opts.prefixPerApp, '', appModule);
  }

  protected getGlobalProviders(appModule: ModuleType) {
    let globalProviders = new ProvidersMetadata();
    globalProviders.providersPerApp = this.opts.providersPerApp;
    const rootModule = this.injectorPerApp.resolveAndInstantiate(ModuleFactory) as ModuleFactory;
    const { providersPerMod, providersPerReq } = rootModule.importGlobalProviders(appModule, globalProviders);
    globalProviders.providersPerMod = providersPerMod;
    globalProviders.providersPerReq = [...defaultProvidersPerReq, ...providersPerReq];
    globalProviders = deepFreeze(globalProviders);
    return globalProviders;
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
    const { injector, providers, controller, method, parseBody, guardItems } = handleRoute();
    const inj1 = injector.resolveAndCreateChild([
      { provide: NodeReqToken, useValue: nodeReq },
      { provide: NodeResToken, useValue: nodeRes },
    ]);
    const inj2 = inj1.createChildFromResolved(providers);
    const req = inj2.get(Request) as Request;
    this.preReq.handleRoute(req, controller, method, params, queryString, parseBody, guardItems);
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
