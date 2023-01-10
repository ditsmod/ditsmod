import { fromSelf, injectable, Injector, isNormalizedProvider, ResolvedProvider } from '../di';

import { HTTP_INTERCEPTORS, ROUTES_EXTENSIONS } from '../constans';
import { HttpBackend, HttpFrontend, HttpHandler } from '../types/http-interceptor';
import { Extension, HttpMethod } from '../types/mix';
import { PreparedRouteMeta, RequestContext, RouteMeta } from '../types/route-data';
import { RouteHandler, Router } from '../types/router';
import { ExtensionsManager } from '../services/extensions-manager';
import { MetadataPerMod2 } from '../types/metadata-per-mod';
import { ExtensionsContext } from '../services/extensions-context';
import { getModule } from '../utils/get-module';
import { PerAppService } from '../services/per-app.service';
import { SystemLogMediator } from '../log-mediator/system-log-mediator';
import { Req } from '../services/request';
import { Res } from '../services/response';
import { getLastProviders } from '../utils/get-last-providers';
import { KeyRegistry } from '../di/key-registry';

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
      const injectorPerMod = injectorPerApp.resolveAndCreateChild([mod, ...providersPerMod], 'injectorPerMod');
      injectorPerMod.get(mod); // Call module constructor.

      aControllersMetadata2.forEach(({ httpMethod, path, providersPerRou, providersPerReq, routeMeta }) => {
        const mergedPerRou = [...metadataPerMod2.providersPerRou, ...providersPerRou];
        const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedPerRou, 'injectorPerRou');
        const mergedPerReq = [
          ...metadataPerMod2.providersPerReq,
          ...providersPerReq,
          { token: RequestContext, useValue: {} },
        ];
        const resolvedPerReq = Injector.resolve(mergedPerReq);
        this.checkDeps(moduleName, httpMethod, path, injectorPerRou, resolvedPerReq, routeMeta);
        const lastHttpHandler = getLastProviders(mergedPerReq).find((p) => {
          return isNormalizedProvider(p) && p.token === HttpHandler;
        })!;
        const resolvedHttpHandler = Injector.resolve([lastHttpHandler])[0];
        const RegistryPerReq = Injector.prepareRegistry(resolvedPerReq);
        const ctxId = KeyRegistry.get(RequestContext).id;

        const handle = (async (nodeReq, nodeRes, aPathParams, queryString) => {
          const req = new Req(nodeReq);
          const res = new Res(nodeRes);
          const ctx: RequestContext = {
            routeMeta,
            nodeReq,
            nodeRes,
            queryString,
            aPathParams,
            req,
            res,
          };
          const inj = injectorPerRou.createChildFromRegistry(RegistryPerReq, 'injectorPerReq');
          inj.updateValue(ctxId, ctx);

          // First HTTP handler in the chain of HTTP interceptors.
          const chain = inj.instantiateResolved(resolvedHttpHandler) as HttpHandler;
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
  protected checkDeps(
    moduleName: string,
    httpMethod: HttpMethod,
    path: string,
    injectorPerRou: Injector,
    resolvedPerReq: ResolvedProvider[],
    routeMeta: RouteMeta
  ) {
    const inj = injectorPerRou.createChildFromResolved(resolvedPerReq);
    if (!routeMeta?.resolvedFactory) {
      const msg =
        `Setting routes in ${moduleName} failed: can't instantiate RouteMeta with ` +
        `${httpMethod} "/${path}" in sandbox mode.`;
      throw new Error(msg);
    }
    const ignoreDeps: any[] = [RequestContext, HTTP_INTERCEPTORS];
    inj.checkDeps(HttpHandler, undefined, ignoreDeps);
    inj.checkDeps(HttpFrontend, undefined, ignoreDeps);
    inj.checkDeps(SystemLogMediator, undefined, ignoreDeps);
    routeMeta.guards.forEach((item) => inj.checkDeps(item.guard, undefined, ignoreDeps));
    inj.checkDeps(HttpBackend, undefined, ignoreDeps);
    inj.checkDepsInResolved(routeMeta.resolvedFactory, [], ignoreDeps);
    inj.checkDeps(HTTP_INTERCEPTORS, fromSelf, ignoreDeps);
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
