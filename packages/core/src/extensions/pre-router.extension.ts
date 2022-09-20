import { Injectable, ReflectiveInjector, ResolvedReflectiveProvider } from '@ts-stack/di';

import { HTTP_INTERCEPTORS, NODE_REQ, NODE_RES, PATH_PARAMS, QUERY_STRING, ROUTES_EXTENSIONS } from '../constans';
import { HttpBackend, HttpFrontend, HttpHandler } from '../types/http-interceptor';
import { Extension, HttpMethod } from '../types/mix';
import { PreparedRouteMeta, RouteMeta } from '../types/route-data';
import { RouteHandler, Router } from '../types/router';
import { ExtensionsManager } from '../services/extensions-manager';
import { LogMediator } from '../services/log-mediator';
import { MetadataPerMod2 } from '../types/metadata-per-mod';
import { ExtensionsContext } from '../services/extensions-context';
import { getModule } from '../utils/get-module';
import { PerAppService } from '../services/per-app.service';

@Injectable()
export class PreRouterExtension implements Extension<void> {
  #inited: boolean;
  #isLastExtensionCall: boolean;

  constructor(
    protected perAppService: PerAppService,
    protected router: Router,
    protected extensionsManager: ExtensionsManager,
    protected logMediator: LogMediator,
    protected extensionsContext: ExtensionsContext
  ) {}

  async init(isLastExtensionCall: boolean) {
    if (this.#inited) {
      return;
    }

    this.#isLastExtensionCall = isLastExtensionCall;
    const aMetadataPerMod2 = await this.extensionsManager.init(ROUTES_EXTENSIONS, true, PreRouterExtension);
    if (aMetadataPerMod2 === false) {
      this.#inited = true;
      return;
    }
    const preparedRouteMeta = this.prepareRoutesMeta(aMetadataPerMod2);
    this.setRoutes(preparedRouteMeta);
    this.#inited = true;
  }

  protected prepareRoutesMeta(aMetadataPerMod2: MetadataPerMod2[]) {
    const preparedRouteMeta: PreparedRouteMeta[] = [];
    this.perAppService.providers = [{ provide: Router, useValue: this.router }];
    const injectorPerApp = this.perAppService.reinitInjector();

    aMetadataPerMod2.forEach((metadataPerMod2) => {
      const { moduleName, aControllersMetadata2, providersPerMod } = metadataPerMod2;
      const mod = getModule(metadataPerMod2.module);
      const injectorPerMod = injectorPerApp.resolveAndCreateChild([mod, ...providersPerMod]);
      injectorPerMod.get(mod); // Call module constructor.

      aControllersMetadata2.forEach(({ httpMethod, path, providersPerRou, providersPerReq }) => {
        const mergedPerRou = [...metadataPerMod2.providersPerRou, ...providersPerRou];
        const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedPerRou);
        const mergedPerReq = [...metadataPerMod2.providersPerReq, ...providersPerReq];
        const resolvedPerReq = ReflectiveInjector.resolve(mergedPerReq);
        this.resolveAndInstantiate(moduleName, httpMethod, path, injectorPerRou, resolvedPerReq);

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

  /**
   * Used as "sandbox" to test resolvable of controllers and HTTP interceptors.
   */
  protected resolveAndInstantiate(
    moduleName: string,
    httpMethod: HttpMethod,
    path: string,
    injectorPerRou: ReflectiveInjector,
    resolvedPerReq: ResolvedReflectiveProvider[]
  ) {
    const fakeObj = { info: 'this is test of a route before set it' };
    const context = ReflectiveInjector.resolve([
      { provide: NODE_REQ, useValue: fakeObj },
      { provide: NODE_RES, useValue: fakeObj },
      { provide: PATH_PARAMS, useValue: fakeObj },
      { provide: QUERY_STRING, useValue: fakeObj },
    ]);
    const inj = injectorPerRou.createChildFromResolved([...resolvedPerReq, ...context]);
    const routeMeta = inj.get(RouteMeta) as RouteMeta;
    if (!routeMeta?.controller) {
      const msg =
        `Setting routes in ${moduleName} failed: can't instantiate RouteMeta with ` +
        `${httpMethod} "/${path}" in sandbox mode.`;
      throw new Error(msg);
    }
    inj.get(HttpHandler);
    inj.get(HttpFrontend);
    inj.get(LogMediator);
    routeMeta.guards.forEach((item) => inj.get(item.guard));
    inj.get(HttpBackend);
    inj.get(routeMeta.controller);
    inj.get(HTTP_INTERCEPTORS, []);
  }

  protected setRoutes(preparedRouteMeta: PreparedRouteMeta[]) {
    this.extensionsContext.appHasRoutes = this.extensionsContext.appHasRoutes || !!preparedRouteMeta.length;
    if (this.#isLastExtensionCall && !this.extensionsContext.appHasRoutes) {
      this.logMediator.noRoutes(this);
      return;
    }

    preparedRouteMeta.forEach((data) => {
      const { moduleName, path, httpMethod, handle } = data;

      if (path?.charAt(0) == '/') {
        let msg = `Invalid configuration of route '${path}'`;
        msg += ` (in ${moduleName}): path cannot start with a slash`;
        throw new Error(msg);
      }

      this.logMediator.printRoute(this, httpMethod, path);

      if (httpMethod == 'ALL') {
        this.router.all(`/${path}`, handle);
      } else {
        this.router.on(httpMethod, `/${path}`, handle);
      }
    });
  }
}
