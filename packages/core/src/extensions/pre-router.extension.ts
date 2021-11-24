import { Injectable, ReflectiveInjector } from '@ts-stack/di';

import { NODE_REQ, NODE_RES, PATH_PARAMS, QUERY_STRING, ROUTES_EXTENSIONS } from '../constans';
import { HttpHandler } from '../types/http-interceptor';
import { Extension } from '../types/mix';
import { PreparedRouteMeta } from '../types/route-data';
import { RouteHandler, Router } from '../types/router';
import { ExtensionsManager } from '../services/extensions-manager';
import { Log } from '../services/log';
import { MetadataPerMod2 } from '../types/metadata-per-mod';

@Injectable()
export class PreRouterExtension implements Extension<void> {
  #inited: boolean;

  constructor(
    protected injectorPerMod: ReflectiveInjector,
    protected router: Router,
    protected extensionsManager: ExtensionsManager,
    protected log: Log
  ) {}

  async init() {
    if (this.#inited) {
      return;
    }

    const metadataPerMod2Arr = await this.extensionsManager.init(ROUTES_EXTENSIONS);
    const preparedRouteMeta = this.prepareRoutesMeta(metadataPerMod2Arr);
    this.setRoutes(preparedRouteMeta, metadataPerMod2Arr[0].moduleName);
    this.#inited = true;
  }

  protected prepareRoutesMeta(metadataPerMod2Arr: MetadataPerMod2[]) {
    const preparedRouteMeta: PreparedRouteMeta[] = [];

    metadataPerMod2Arr.forEach((metadataPerMod2) => {
      const { moduleName, metaForExtensionsPerRouArr, providersPerMod } = metadataPerMod2;

      metaForExtensionsPerRouArr.forEach(({ httpMethod, path, providersPerRou, providersPerReq }) => {
        const injectorPerMod = this.injectorPerMod.resolveAndCreateChild(providersPerMod);
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

  protected setRoutes(preparedRouteMeta: PreparedRouteMeta[], moduleName: string) {
    if (!preparedRouteMeta.length) {
      this.log.noRoutes('info', { className: this.constructor.name }, moduleName);
      return;
    }

    preparedRouteMeta.forEach((data) => {
      const { moduleName, path, httpMethod, handle } = data;

      if (path?.charAt(0) == '/') {
        let msg = `Invalid configuration of route '${path}'`;
        msg += ` (in '${moduleName}'): path cannot start with a slash`;
        throw new Error(msg);
      }

      this.log.showRoutes('debug', { className: this.constructor.name }, { moduleName, httpMethod, path });

      if (httpMethod == 'ALL') {
        this.router.all(`/${path}`, handle);
      } else {
        this.router.on(httpMethod, `/${path}`, handle);
      }
    });
  }
}
