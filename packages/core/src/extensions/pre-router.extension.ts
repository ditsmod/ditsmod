import { Injectable, ReflectiveInjector } from '@ts-stack/di';

import { NODE_REQ, NODE_RES, PATH_PARAMS, QUERY_STRING, ROUTES_EXTENSIONS } from '../constans';
import { HttpHandler } from '../types/http-interceptor';
import { HttpMethod, Extension, ModuleType, ModuleWithParams, ServiceProvider } from '../types/mix';
import { RouteMetaPerMod, PreparedRouteMeta } from '../types/route-data';
import { RouteHandler, Router } from '../types/router';
import { NodeResponse, RequestListener } from '../types/server-options';
import { Status } from '../utils/http-status-codes';
import { ExtensionsManager } from '../services/extensions-manager';
import { Log } from '../services/log';
import { ModuleManager } from '../services/module-manager';
import { SiblingObj } from '../models/sibling-obj';

@Injectable()
export class PreRouterExtension implements Extension<void> {
  #inited: boolean;

  constructor(
    protected injectorPerApp: ReflectiveInjector,
    protected router: Router,
    protected extensionsManager: ExtensionsManager,
    protected log: Log,
    protected moduleManager: ModuleManager
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

  protected async prepareRoutesMeta(routesMetaPerMod: RouteMetaPerMod[]) {
    const preparedRouteMeta: PreparedRouteMeta[] = [];

    routesMetaPerMod.forEach((routeMetaPerMod) => {
      const { module, providersPerMod, providersPerRou, moduleName, rawRoutesMeta } = routeMetaPerMod;
      const { siblingsPerMod, siblingsPerRou, siblingsPerReq } = routeMetaPerMod;
      const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(providersPerMod);
      this.setSiblingsOnModule(injectorPerMod, module, 'Mod', siblingsPerMod);
      const injectorPerRou1 = injectorPerMod.resolveAndCreateChild(providersPerRou);
      this.setSiblingsOnModule(injectorPerRou1, module, 'Rou', siblingsPerRou);

      rawRoutesMeta.forEach((rawRouteMeta) => {
        const { httpMethod, path, providersPerRou, providersPerReq } = rawRouteMeta;
        const injectorPerRou2 = injectorPerRou1.resolveAndCreateChild(providersPerRou);

        const injectorPerReq = injectorPerRou2.resolveAndCreateChild(providersPerReq);
        const injectors: ReflectiveInjector[] = [injectorPerReq];
        siblingsPerReq.forEach(([providers, tokens]) => {
          const externalInjector = injectorPerReq.resolveAndCreateChild(providers);
          injectors.push(externalInjector);
          injectorPerReq.addSibling(externalInjector, tokens);
        });

        const handle = (async (nodeReq, nodeRes, params, queryString) => {
          const parent = injectorPerRou2.resolveAndCreateChild([
            { provide: NODE_REQ, useValue: nodeReq },
            { provide: NODE_RES, useValue: nodeRes },
            { provide: PATH_PARAMS, useValue: params },
            { provide: QUERY_STRING, useValue: queryString },
          ]);
          injectors.forEach(i => i.clearCache());
          injectorPerReq.parent = parent;

          // First HTTP handler in the chain of HTTP interceptors.
          const chain = injectorPerReq.get(HttpHandler) as HttpHandler;
          await chain.handle();
        }) as RouteHandler;

        preparedRouteMeta.push({ moduleName, httpMethod, path, handle });
      });
    });

    return preparedRouteMeta;
  }

  /**
   * Sets injector siblings on a module.
   */
  protected setSiblingsOnModule(
    injector: ReflectiveInjector,
    module: ModuleType | ModuleWithParams,
    scope: 'Mod' | 'Rou',
    siblings: Set<SiblingObj>
  ) {
    const meta = this.moduleManager.getMetadata(module);
    meta[`injectorPer${scope}`].resolveInjector(injector);

    siblings.forEach((sbl) => {
      sbl.injectorPromise
        .then((externalInjector) => {
          injector.addSibling(externalInjector, sbl.tokens);
        })
        .catch((err) => {
          this.log.errorDuringAddingSiblings('error', err);
        });
    });
  }

  /**
   * Checks in "sandbox" mode that `providersPerReq` instantiatable.
   *
   * This allows avoids "Error: No provider for SomeDepends" when processing an HTTP request.
   * 
   * @todo Refactor this. For now it's not works.
   */
  protected instantiateProvidersPerReq(injectorPerRou: ReflectiveInjector, providers: ServiceProvider[]) {
    const child = injectorPerRou.resolveAndCreateChild([
      ...providers,
      { provide: NODE_REQ, useValue: {} },
      { provide: NODE_RES, useValue: {} },
      { provide: PATH_PARAMS, useValue: {} },
      { provide: QUERY_STRING, useValue: {} },
    ]);

    providers.forEach((p) => child.resolveAndInstantiate(p));
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
