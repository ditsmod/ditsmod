import { fromSelf, injectable, Injector, ResolvedProvider, KeyRegistry } from '#di';
import { DepsChecker } from '#di/deps-checker.js';
import { HTTP_INTERCEPTORS, ROUTES_EXTENSIONS, NODE_REQ, NODE_RES, QUERY_STRING, A_PATH_PARAMS } from '#constans';
import { HttpBackend, HttpFrontend, HttpHandler } from '#types/http-interceptor.js';
import { Extension, HttpMethod } from '#types/mix.js';
import { PreparedRouteMeta, RouteMeta } from '#types/route-data.js';
import { RouteHandler, Router } from '#types/router.js';
import { MetadataPerMod2 } from '#types/metadata-per-mod.js';
import { ExtensionsManager } from '#services/extensions-manager.js';
import { ExtensionsContext } from '#services/extensions-context.js';
import { getModule } from '#utils/get-module.js';
import { PerAppService } from '#services/per-app.service.js';
import { SystemLogMediator } from '#log-mediator/system-log-mediator.js';
import { ChainMaker } from '#services/chain-maker.js';
import { HttpErrorHandler } from '#services/http-error-handler.js';

@injectable()
export class PreRouterExtension implements Extension<void> {
  protected inited: boolean;
  protected isLastExtensionCall: boolean;

  constructor(
    protected perAppService: PerAppService,
    protected router: Router,
    protected extensionsManager: ExtensionsManager,
    protected log: SystemLogMediator,
    protected extensionsContext: ExtensionsContext
  ) {}

  async init(isLastExtensionCall: boolean) {
    if (this.inited) {
      return;
    }

    this.isLastExtensionCall = isLastExtensionCall;
    const aMetadataPerMod2 = await this.extensionsManager.init(ROUTES_EXTENSIONS, true, PreRouterExtension);
    if (aMetadataPerMod2 === false) {
      this.inited = true;
      return;
    }
    const preparedRouteMeta = this.prepareRoutesMeta(aMetadataPerMod2);
    this.setRoutes(preparedRouteMeta);
    this.inited = true;
  }

  protected prepareRoutesMeta(aMetadataPerMod2: MetadataPerMod2[]) {
    const preparedRouteMeta: PreparedRouteMeta[] = [];
    this.perAppService.providers.push({ token: Router, useValue: this.router });
    const injectorPerApp = this.perAppService.reinitInjector();

    aMetadataPerMod2.forEach((metadataPerMod2) => {
      const { moduleName, aControllersMetadata2, providersPerMod } = metadataPerMod2;
      const mod = getModule(metadataPerMod2.module);
      const injectorPerMod = injectorPerApp.resolveAndCreateChild([mod, ...providersPerMod], 'injectorPerMod');
      injectorPerMod.get(mod); // Call module constructor.

      aControllersMetadata2.forEach(({ httpMethod, path, providersPerRou, providersPerReq, routeMeta }) => {
        const mergedPerRou = [...metadataPerMod2.providersPerRou, ...providersPerRou];
        const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedPerRou, 'injectorPerRou');
        const mergedPerReq = [...metadataPerMod2.providersPerReq, ...providersPerReq];
        const resolvedPerReq = Injector.resolve(mergedPerReq);
        this.checkDeps(moduleName, httpMethod, path, injectorPerRou, resolvedPerReq, routeMeta);
        const resolvedChainMaker = resolvedPerReq.find((rp) => rp.dualKey.token === ChainMaker)!;
        const resolvedCtrlErrHandler = resolvedPerReq.find((rp) => rp.dualKey.token === HttpErrorHandler)!;
        const RegistryPerReq = Injector.prepareRegistry(resolvedPerReq);
        const nodeReqId = KeyRegistry.get(NODE_REQ).id;
        const nodeResId = KeyRegistry.get(NODE_RES).id;
        const aPathParamsId = KeyRegistry.get(A_PATH_PARAMS).id;
        const queryStringId = KeyRegistry.get(QUERY_STRING).id;

        const handle = (async (nodeReq, nodeRes, aPathParams, queryString) => {
          const injector = new Injector(RegistryPerReq, injectorPerRou, 'injectorPerReq');
          await injector
            .setById(nodeReqId, nodeReq)
            .setById(nodeResId, nodeRes)
            .setById(aPathParamsId, aPathParams)
            .setById(queryStringId, queryString || '')
            .instantiateResolved<HttpHandler>(resolvedChainMaker)
            .handle() // First HTTP handler in the chain of HTTP interceptors.
            .catch((err) => {
              const errorHandler = injector.instantiateResolved(resolvedCtrlErrHandler) as HttpErrorHandler;
              return errorHandler.handleError(err);
            });

          injector.clear();
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
    const ignoreDeps: any[] = [HTTP_INTERCEPTORS];
    DepsChecker.check(inj, ChainMaker, undefined, ignoreDeps);
    DepsChecker.check(inj, HttpFrontend, undefined, ignoreDeps);
    DepsChecker.check(inj, SystemLogMediator, undefined, ignoreDeps);
    routeMeta.resolvedGuards.forEach((item) => DepsChecker.checkForResolved(inj, item.guard, ignoreDeps));
    DepsChecker.check(inj, HttpBackend, undefined, ignoreDeps);
    DepsChecker.checkForResolved(inj, routeMeta.resolvedFactory, ignoreDeps);
    DepsChecker.check(inj, HTTP_INTERCEPTORS, fromSelf, ignoreDeps);
  }

  protected setRoutes(preparedRouteMeta: PreparedRouteMeta[]) {
    this.extensionsContext.appHasRoutes = this.extensionsContext.appHasRoutes || !!preparedRouteMeta.length;
    if (this.isLastExtensionCall && !this.extensionsContext.appHasRoutes) {
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
