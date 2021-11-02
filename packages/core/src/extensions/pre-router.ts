import { Injectable, ReflectiveInjector, ResolvedReflectiveProvider } from '@ts-stack/di';

import { NODE_REQ, NODE_RES, PATH_PARAMS, QUERY_STRING, ROUTES_EXTENSIONS } from '../constans';
import { HttpHandler } from '../types/http-interceptor';
import { HttpMethod, Extension } from '../types/mix';
import { RawRouteMeta, PreparedRouteMeta } from '../types/route-data';
import { RouteHandler, Router } from '../types/router';
import { NodeResponse, RequestListener } from '../types/server-options';
import { Status } from '../utils/http-status-codes';
import { ExtensionsManager } from '../services/extensions-manager';
import { Log } from '../services/log';

@Injectable()
export class PreRouter implements Extension<void> {
  #inited: boolean;

  constructor(
    protected injectorPerApp: ReflectiveInjector,
    protected router: Router,
    protected extensionsManager: ExtensionsManager,
    protected log: Log
  ) {}

  async init() {
    if (this.#inited) {
      return;
    }
    const rawRoutesMeta = await this.extensionsManager.init(ROUTES_EXTENSIONS);
    const preparedRouteMeta = await this.prepareRoutesMeta(rawRoutesMeta);
    this.setRoutes(preparedRouteMeta);
    this.#inited = true;
  }

  requestListener: RequestListener = async (nodeReq, nodeRes) => {
    const { method: httpMethod, url } = nodeReq;
    const [uri, queryString] = this.decodeUrl(url || '').split('?');
    const { handle, params } = this.router.find(httpMethod as HttpMethod, uri);
    if (!handle) {
      this.sendNotFound(nodeRes);
      return;
    }
    await handle(nodeReq, nodeRes, params, queryString).catch((err) => {
      this.sendInternalServerError(nodeRes, err);
    });
  };

  protected async prepareRoutesMeta(rawRoutesMeta: RawRouteMeta[]) {
    const preparedRouteMeta: PreparedRouteMeta[] = [];

    rawRoutesMeta.forEach((rawRouteMeta) => {
      const { httpMethod, path, providersPerMod, providersPerRou, providersPerReq, moduleName } = rawRouteMeta;
      const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(providersPerMod);
      const inj1 = injectorPerMod.resolveAndCreateChild(providersPerRou);
      const providers = ReflectiveInjector.resolve(providersPerReq);
      this.instantiateProvidersPerReq(inj1, providers);

      const handle = (async (nodeReq, nodeRes, params, queryString) => {
        const inj2 = inj1.resolveAndCreateChild([
          { provide: NODE_REQ, useValue: nodeReq },
          { provide: NODE_RES, useValue: nodeRes },
          { provide: PATH_PARAMS, useValue: params },
          { provide: QUERY_STRING, useValue: queryString },
        ]);
        const inj3 = inj2.createChildFromResolved(providers);

        // First HTTP handler in the chain of HTTP interceptors.
        const chain = inj3.get(HttpHandler) as HttpHandler;
        await chain.handle();
      }) as RouteHandler;

      preparedRouteMeta.push({ moduleName, httpMethod, path, handle });
    });

    return preparedRouteMeta;
  }

  /**
   * Checks in "sandbox" mode that `providersPerReq` instantiatable.
   *
   * This allows avoids "Error: No provider for SomeDepends" when processing an HTTP request.
   */
  protected instantiateProvidersPerReq(injectorPerRou: ReflectiveInjector, providers: ResolvedReflectiveProvider[]) {
    const inj2 = injectorPerRou.resolveAndCreateChild([
      { provide: NODE_REQ, useValue: {} },
      { provide: NODE_RES, useValue: {} },
      { provide: PATH_PARAMS, useValue: {} },
      { provide: QUERY_STRING, useValue: {} },
    ]);
    const inj3 = inj2.createChildFromResolved(providers);

    providers.forEach((p) => inj3.instantiateResolved(p));
  }

  protected setRoutes(preparedRouteMeta: PreparedRouteMeta[]) {
    if (!preparedRouteMeta.length) {
      this.log.noRoutes('warn');
      return;
    }

    preparedRouteMeta.forEach((data) => {
      const { moduleName, path, httpMethod, handle } = data;

      if (path?.charAt(0) == '/') {
        let msg = `Invalid configuration of route '${path}'`;
        msg += ` (in '${moduleName}'): path cannot start with a slash`;
        throw new Error(msg);
      }

      this.log.showRoutes('debug', { moduleName, httpMethod, path });

      if (httpMethod == 'ALL') {
        this.router.all(`/${path}`, handle);
      } else {
        this.router.on(httpMethod, `/${path}`, handle);
      }
    });
  }

  protected decodeUrl(url: string) {
    return decodeURI(url);
  }

  /**
   * Logs an error and sends the user message about an internal server error (500).
   *
   * @param err An error to logs it (not sends).
   */
  protected sendInternalServerError(nodeRes: NodeResponse, err: Error) {
    this.log.internalServerError('error', err);
    nodeRes.statusCode = Status.INTERNAL_SERVER_ERROR;
    nodeRes.end();
  }

  protected sendNotFound(nodeRes: NodeResponse) {
    nodeRes.statusCode = Status.NOT_FOUND;
    nodeRes.end();
  }
}
