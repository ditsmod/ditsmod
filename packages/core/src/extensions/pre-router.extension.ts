import { Injectable, ReflectiveInjector } from '@ts-stack/di';

import { NODE_REQ, NODE_RES, PATH_PARAMS, QUERY_STRING, ROUTES_EXTENSIONS } from '../constans';
import { HttpHandler } from '../types/http-interceptor';
import { HttpMethod, Extension, ServiceProvider } from '../types/mix';
import { RouteMetaPerMod, PreparedRouteMeta } from '../types/route-data';
import { RouteHandler, Router } from '../types/router';
import { NodeResponse, RequestListener } from '../types/server-options';
import { Status } from '../utils/http-status-codes';
import { ExtensionsManager } from '../services/extensions-manager';
import { Log } from '../services/log';
import { ModuleManager } from '../services/module-manager';
import { normalizeProviders } from '../utils/ng-utils';

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

    for (const routeMetaPerMod of routesMetaPerMod) {
      const perMod = this.setSiblingsOnModule(routeMetaPerMod, this.injectorPerApp, 'Mod');
      const perRou = this.setSiblingsOnModule(routeMetaPerMod, perMod.injector, 'Rou');
      const perReq = this.setSiblingsOnModule(routeMetaPerMod, perRou.injector, 'Req');
      const resolvedInjectors = Promise.all([
        ...perMod.injectorsPromises,
        ...perRou.injectorsPromises,
        ...perReq.injectorsPromises,
      ]);
      const { moduleName, rawRoutesMeta, providersPerReq: modulesProvidersPerReq } = routeMetaPerMod;

      rawRoutesMeta.forEach((rawRouteMeta) => {
        const { httpMethod, path, providersPerRou, providersPerReq } = rawRouteMeta;
        const injectorPerRou = perRou.injector.resolveAndCreateChild(providersPerRou);
        const injectorPerReq = injectorPerRou.resolveAndCreateChild(providersPerReq);
        const tokens = normalizeProviders(modulesProvidersPerReq).map((p) => p.provide);
        injectorPerReq.addSibling(perReq.injector, tokens);

        const handle = (async (nodeReq, nodeRes, params, queryString) => {
          injectorPerReq.parent = injectorPerRou.resolveAndCreateChild([
            { provide: NODE_REQ, useValue: nodeReq },
            { provide: NODE_RES, useValue: nodeRes },
            { provide: PATH_PARAMS, useValue: params },
            { provide: QUERY_STRING, useValue: queryString },
          ]);
          injectorPerReq.clearCache();
          perReq.injectors.forEach((i) => i.clearCache());

          // First HTTP handler in the chain of HTTP interceptors.
          const chain = injectorPerReq.get(HttpHandler) as HttpHandler;
          await chain.handle();
        }) as RouteHandler;

        preparedRouteMeta.push({ moduleName, httpMethod, path, resolvedInjectors, handle });
      });
    }

    return preparedRouteMeta;
  }

  /**
   * Sets injector siblings on a module.
   *
   * @param parent Parent injector.
   * @param routeMetaPerMod Metadata for current module.
   * @param scope Scope of the providers
   * @returns An array of the injectors promises.
   */
  protected setSiblingsOnModule(
    routeMetaPerMod: RouteMetaPerMod,
    parent: ReflectiveInjector,
    scope: 'Mod' | 'Rou' | 'Req'
  ) {
    const providers = routeMetaPerMod[`providersPer${scope}`];
    const injector = parent.resolveAndCreateChild(providers);
    const meta = this.moduleManager.getMetadata(routeMetaPerMod.module);
    meta[`injectorPer${scope}`].resolveInjector(injector);

    const siblings = routeMetaPerMod[`siblingsPer${scope}`];
    const currentInjectorPromise = meta[`injectorPer${scope}`].getInjector();
    const injectors = [injector];
    const injectorsPromises = [currentInjectorPromise];

    siblings.forEach((sbl) => {
      injectorsPromises.push(sbl.injectorPromise);

      sbl.injectorPromise
        .then((externalInjector) => {
          injectors.push(externalInjector);
          injector.addSibling(externalInjector, sbl.tokens);
        })
        .catch((err) => {
          this.log.errorDuringAddingSiblings('error', err);
        });
    });

    return { injector, injectorsPromises, injectors };
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
      const { moduleName, path, httpMethod, handle, resolvedInjectors } = data;

      if (path?.charAt(0) == '/') {
        let msg = `Invalid configuration of route '${path}'`;
        msg += ` (in '${moduleName}'): path cannot start with a slash`;
        throw new Error(msg);
      }

      this.log.showRoutes('debug', { moduleName, httpMethod, path });

      resolvedInjectors.then(() => {
        if (httpMethod == 'ALL') {
          this.router.all(`/${path}`, handle);
        } else {
          this.router.on(httpMethod, `/${path}`, handle);
        }
      }).catch((err) => {
        this.log.resolveSiblingsError('error', err);
      });
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
