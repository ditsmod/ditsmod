import { fromSelf, injectable, Injector, ResolvedProvider } from '../di';
import { HTTP_INTERCEPTORS, ROUTES_EXTENSIONS, NODE_REQ, NODE_RES, QUERY_STRING, A_PATH_PARAMS } from '../constans';
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
import { KeyRegistry } from '../di/key-registry';
import { ChainMaker } from '../services/chain-maker';
import { ControllerErrorHandler } from '../services/controller-error-handler';

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
        const mergedPerReq = [...metadataPerMod2.providersPerReq, ...providersPerReq];
        const resolvedPerReq = Injector.resolve(mergedPerReq);
        this.checkDeps(moduleName, httpMethod, path, injectorPerRou, resolvedPerReq, routeMeta);
        const resolvedChainMaker = resolvedPerReq.find((rp) => rp.dualKey.token === ChainMaker)!;
        const resolvedCtrlErrHandler = resolvedPerReq.find((rp) => rp.dualKey.token === ControllerErrorHandler)!;
        const RegistryPerReq = Injector.prepareRegistry(resolvedPerReq);
        const nodeReqId = KeyRegistry.get(NODE_REQ).id;
        const nodeResId = KeyRegistry.get(NODE_RES).id;
        const aPathParamsId = KeyRegistry.get(A_PATH_PARAMS).id;
        const queryStringId = KeyRegistry.get(QUERY_STRING).id;

        const handle = (async (nodeReq, nodeRes, aPathParams, queryString) => {
          const injector = new Injector(RegistryPerReq, injectorPerRou, 'injectorPerReq');
          await injector
            .updateValue(nodeReqId, nodeReq)
            .updateValue(nodeResId, nodeRes)
            .updateValue(aPathParamsId, aPathParams)
            .updateValue(queryStringId, queryString || '')
            .instantiateResolved<HttpHandler>(resolvedChainMaker)
            .handle() // First HTTP handler in the chain of HTTP interceptors.
            .catch((err) => {
              return injector.instantiateResolved(resolvedCtrlErrHandler).handleError(err);
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
    inj.checkDeps(ChainMaker, undefined, ignoreDeps);
    inj.checkDeps(HttpFrontend, undefined, ignoreDeps);
    inj.checkDeps(SystemLogMediator, undefined, ignoreDeps);
    routeMeta.guards.forEach((item) => inj.checkDeps(item.guard, undefined, ignoreDeps));
    inj.checkDeps(HttpBackend, undefined, ignoreDeps);
    inj.checkDepsForResolved(routeMeta.resolvedFactory, ignoreDeps);
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
