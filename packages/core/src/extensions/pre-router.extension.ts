import { Injectable, ReflectiveInjector } from '@ts-stack/di';

import { NODE_REQ, NODE_RES, PATH_PARAMS, QUERY_STRING, ROUTES_EXTENSIONS } from '../constans';
import { HttpHandler } from '../types/http-interceptor';
import { Extension } from '../types/mix';
import { PreparedRouteMeta } from '../types/route-data';
import { RouteHandler, Router } from '../types/router';
import { ExtensionsManager } from '../services/extensions-manager';
import { LogMediator } from '../services/log-mediator';
import { MetadataPerMod2 } from '../types/metadata-per-mod';
import { ExtensionsContext } from '../services/extensions-context';
import { InjectorPerApp } from '../models/injector-per-app';

@Injectable()
export class PreRouterExtension implements Extension<void> {
  #inited: boolean;

  constructor(
    protected injectorPerApp: InjectorPerApp,
    protected router: Router,
    protected extensionsManager: ExtensionsManager,
    protected logMediator: LogMediator,
    private extensionsContext: ExtensionsContext
  ) {}

  async init() {
    if (this.#inited) {
      return;
    }

    const aMetadataPerMod2 = await this.extensionsManager.init(ROUTES_EXTENSIONS);
    const preparedRouteMeta = this.prepareRoutesMeta(aMetadataPerMod2);
    this.setRoutes(preparedRouteMeta);
    this.#inited = true;
  }

  protected prepareRoutesMeta(aMetadataPerMod2: MetadataPerMod2[]) {
    const preparedRouteMeta: PreparedRouteMeta[] = [];

    aMetadataPerMod2.forEach((metadataPerMod2) => {
      const { moduleName, aMetaForExtensionsPerRou, providersPerMod } = metadataPerMod2;

      aMetaForExtensionsPerRou.forEach(({ httpMethod, path, providersPerRou, providersPerReq }) => {
        const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(providersPerMod);
        const mergedPerRou = [...metadataPerMod2.providersPerRou, ...providersPerRou];
        const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedPerRou);
        const mergedPerReq = [...metadataPerMod2.providersPerReq, ...providersPerReq];
        const resolvedPerReq = ReflectiveInjector.resolve(mergedPerReq);

        const handle = (async (nodeReq, nodeRes, params, queryString) => {
          const context = ReflectiveInjector.resolve([
            { provide: NODE_REQ, useValue: nodeReq },
            { provide: NODE_RES, useValue: nodeRes },
            { provide: PATH_PARAMS, useValue: params },
            { provide: QUERY_STRING, useValue: queryString },
          ]);
          const inj = injectorPerRou.createChildFromResolved([...resolvedPerReq, ...context]);

          // First HTTP handler in the chain of HTTP interceptors.
          const chain = inj.get(HttpHandler) as HttpHandler;
          await chain.handle();
        }) as RouteHandler;

        preparedRouteMeta.push({ moduleName, httpMethod, path, handle });
      });
    });

    return preparedRouteMeta;
  }

  protected setRoutes(preparedRouteMeta: PreparedRouteMeta[]) {
    this.extensionsContext.appHasRoutes = this.extensionsContext.appHasRoutes || !!preparedRouteMeta.length;
    if (this.extensionsContext.isLastModule && !this.extensionsContext.appHasRoutes) {
      this.logMediator.noRoutes('warn', { className: this.constructor.name });
      return;
    }

    preparedRouteMeta.forEach((data) => {
      const { moduleName, path, httpMethod, handle } = data;

      if (path?.charAt(0) == '/') {
        let msg = `Invalid configuration of route '${path}'`;
        msg += ` (in '${moduleName}'): path cannot start with a slash`;
        throw new Error(msg);
      }

      this.logMediator.showRoutes('debug', { className: this.constructor.name }, { moduleName, httpMethod, path });

      if (httpMethod == 'ALL') {
        this.router.all(`/${path}`, handle);
      } else {
        this.router.on(httpMethod, `/${path}`, handle);
      }
    });
  }
}
