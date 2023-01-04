import { injectable, ReflectiveInjector, ResolvedProvider } from '@ts-stack/di';

import { HTTP_INTERCEPTORS, NODE_REQ, NODE_RES, PATH_PARAMS, QUERY_STRING, ROUTES_EXTENSIONS } from '../constans';
import { HttpBackend, HttpFrontend, HttpHandler } from '../types/http-interceptor';
import { Extension, HttpMethod } from '../types/mix';
import { PreparedRouteMeta, RouteMeta } from '../types/route-data';
import { RouteHandler, Router } from '../types/router';
import { ExtensionsManager } from '../services/extensions-manager';
import { MetadataPerMod2 } from '../types/metadata-per-mod';
import { ExtensionsContext } from '../services/extensions-context';
import { getModule } from '../utils/get-module';
import { PerAppService } from '../services/per-app.service';
import { SystemLogMediator } from '../log-mediator/system-log-mediator';

@injectable()
export class PreRouterExtension implements Extension<void> {
  #inited: boolean;
  #isLastExtensionCall: boolean;

  constructor(
    protected perAppService: PerAppService,
    protected router: Router,
    protected extensionsManager: ExtensionsManager,
    protected log: SystemLogMediator,
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
    const injectorPerApp = this.perAppService.reinitInjector([{ token: Router, useValue: this.router }]);

    aMetadataPerMod2.forEach((metadataPerMod2) => {
      const { moduleName, aControllersMetadata2, providersPerMod } = metadataPerMod2;
      const mod = getModule(metadataPerMod2.module);
      const injectorPerMod = injectorPerApp.resolveAndCreateChild([mod, ...providersPerMod]);
      injectorPerMod.get(mod); // Call module constructor.

      aControllersMetadata2.forEach(({ httpMethod, path, providersPerRou, providersPerReq, routeMeta }) => {
        const mergedPerRou = [...metadataPerMod2.providersPerRou, ...providersPerRou];
        const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedPerRou);
        const mergedPerReq = [...metadataPerMod2.providersPerReq, ...providersPerReq];
        const resolvedPerReq = ReflectiveInjector.resolve(mergedPerReq);
        this.runDry(moduleName, httpMethod, path, injectorPerRou, resolvedPerReq, routeMeta);

        const handle = (async (nodeReq, nodeRes, params, queryString) => {
          const context = ReflectiveInjector.resolve([
            { token: NODE_REQ, useValue: nodeReq },
            { token: NODE_RES, useValue: nodeRes },
            { token: PATH_PARAMS, useValue: params },
            { token: QUERY_STRING, useValue: queryString },
          ]);
          const inj = injectorPerRou.createChildFromResolved([...resolvedPerReq, ...context]);

          // First HTTP handler in the chain of HTTP interceptors.
          const chain = inj.get(HttpHandler) as HttpHandler;
          await chain.handle(routeMeta);
        }) as RouteHandler;

        preparedRouteMeta.push({ moduleName, httpMethod, path, handle });
      });
    });

    return preparedRouteMeta;
  }

  /**
   * Used as "sandbox" to test resolvable of controllers and HTTP interceptors.
   */
  protected runDry(
    moduleName: string,
    httpMethod: HttpMethod,
    path: string,
    injectorPerRou: ReflectiveInjector,
    resolvedPerReq: ResolvedProvider[],
    routeMeta: RouteMeta
  ) {
    const fakeObj = { info: 'this is test of a route before set it' };
    const context = ReflectiveInjector.resolve([
      { token: NODE_REQ, useValue: fakeObj },
      { token: NODE_RES, useValue: fakeObj },
      { token: PATH_PARAMS, useValue: fakeObj },
      { token: QUERY_STRING, useValue: fakeObj },
    ]);
    const inj = injectorPerRou.createChildFromResolved([...resolvedPerReq, ...context]);
    if (!routeMeta?.controller) {
      const msg =
        `Setting routes in ${moduleName} failed: can't instantiate RouteMeta with ` +
        `${httpMethod} "/${path}" in sandbox mode.`;
      throw new Error(msg);
    }
    inj.checkDeps(HttpHandler);
    inj.checkDeps(HttpFrontend);
    inj.checkDeps(SystemLogMediator);
    routeMeta.guards.forEach((item) => inj.checkDeps(item.guard));
    inj.checkDeps(HttpBackend);
    inj.checkDeps(routeMeta.controller.prototype[routeMeta.methodName]);
    inj.checkDeps(HTTP_INTERCEPTORS, []);
  }

  protected setRoutes(preparedRouteMeta: PreparedRouteMeta[]) {
    this.extensionsContext.appHasRoutes = this.extensionsContext.appHasRoutes || !!preparedRouteMeta.length;
    if (this.#isLastExtensionCall && !this.extensionsContext.appHasRoutes) {
      this.log.noRoutes(this);
      return;
    }

    preparedRouteMeta.forEach((data) => {
      const { moduleName, path, httpMethod, handle } = data;

      if (path?.charAt(0) == '/') {
        let msg = `Invalid configuration of route '${path}'`;
        msg += ` (in ${moduleName}): path cannot start with a slash`;
        throw new Error(msg);
      }

      this.log.printRoute(this, httpMethod, path);

      if (httpMethod == 'ALL') {
        this.router.all(`/${path}`, handle);
      } else {
        this.router.on(httpMethod, `/${path}`, handle);
      }
    });
  }
}
