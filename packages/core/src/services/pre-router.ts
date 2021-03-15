import { Injectable, ReflectiveInjector, TypeProvider } from '@ts-stack/di';
import { parse } from 'querystring';

import { RootMetadata } from '../models/root-metadata';
import { AnyObj } from '../types/any-obj';
import { CanActivate } from '../types/can-activate';
import { ControllerErrorHandler } from '../types/controller-error-handler';
import { Extension } from '../types/extension';
import { ExtensionMetadata } from '../types/extension-metadata';
import { HttpMethod } from '../types/http-method';
import { Logger } from '../types/logger';
import { ModuleType } from '../types/module-type';
import { ModuleWithParams } from '../types/module-with-params';
import { NormalizedGuard } from '../types/normalized-guard';
import { PreRouteData } from '../types/route-data';
import { PathParam, RouteHandler, Router } from '../types/router';
import { NodeReqToken, NodeRequest, NodeResponse, NodeResToken, RequestListener } from '../types/server-options';
import { Status } from '../utils/http-status-codes';
import { BodyParser } from './body-parser';
import { PreRoutes } from './pre-routes';
import { Request } from './request';

@Injectable()
export class PreRouter implements Extension<PreRouteData[]> {
  constructor(
    protected injectorPerApp: ReflectiveInjector,
    protected router: Router,
    protected log: Logger,
    protected rootMetadata: RootMetadata
  ) {}

  init(prefixPerApp: string, metadataMap: Map<ModuleType | ModuleWithParams, ExtensionMetadata>) {
    let preRoutesData: PreRouteData[];

    metadataMap.forEach((extensionsMetadata) => {
      const preRoutes = this.injectorPerApp.resolveAndInstantiate(PreRoutes) as PreRoutes;
      preRoutesData = preRoutes.getPreRoutesData(extensionsMetadata);
      const { prefixPerMod, moduleMetadata } = extensionsMetadata;
      this.setRoutes(moduleMetadata.name, prefixPerApp, prefixPerMod, preRoutesData);
    });

    return preRoutesData;
  }

  requestListener: RequestListener = (nodeReq, nodeRes) => {
    const { method: httpMethod, url } = nodeReq;
    const [uri, queryString] = this.decodeUrl(url).split('?');
    const { handle, params } = this.router.find(httpMethod as HttpMethod, uri);
    if (!handle) {
      this.sendNotFound(nodeRes);
      return;
    }
    handle(nodeReq, nodeRes, params, queryString);
  };

  protected setRoutes(moduleName: string, prefixPerApp: string, prefixPerMod: string, preRoutesData: PreRouteData[]) {
    this.checkRoutePath(moduleName, prefixPerApp);
    this.checkRoutePath(moduleName, prefixPerMod);
    const prefix = [prefixPerApp, prefixPerMod].filter((s) => s).join('/');

    preRoutesData.forEach((preRouteData) => {
      /**
       * @param injector Injector per module that tied to the route.
       * @param providers Resolved providers per request.
       * @param method Method of the class controller.
       * @param parseBody Need or not to parse body.
       */
      const { route, injector, providers, controller, methodName, parseBody, guards } = preRouteData;
      const path = this.getPath(prefix, route.path);

      const handle = ((nodeReq: NodeRequest, nodeRes: NodeResponse, params: PathParam[], queryString: any) => {
        nodeRes.setHeader('Server', this.rootMetadata.serverName);
        const injector1 = injector.resolveAndCreateChild([
          { provide: NodeReqToken, useValue: nodeReq },
          { provide: NodeResToken, useValue: nodeRes },
        ]);
        const injector2 = injector1.createChildFromResolved(providers);
        const req = injector2.get(Request) as Request;
        this.handleRoute(req, params, queryString, controller, methodName, parseBody, guards);
      }) as RouteHandler;

      if (route.httpMethod == 'ALL') {
        this.router.all(`/${path}`, handle);
      } else {
        this.router.on(route.httpMethod, `/${path}`, handle);
      }

      const logObj = {
        moduleName,
        httpMethod: route.httpMethod,
        path,
        guards,
        handler: `${controller.name}.${methodName}()`,
      };

      if (!logObj.guards.length) {
        delete logObj.guards;
      }

      this.log.debug(logObj);
    });
  }

  protected decodeUrl(url: string) {
    return decodeURI(url);
  }

  protected sendNotFound(nodeRes: NodeResponse) {
    nodeRes.statusCode = Status.NOT_FOUND;
    nodeRes.end();
  }

  /**
   * @param controller Controller class.
   * @param methodName Method of the Controller.
   * @param parseBody Need or not to parsing a body request.
   */
  protected async handleRoute(
    req: Request,
    pathParamsArr: PathParam[],
    queryString: string,
    controller: TypeProvider,
    methodName: string,
    parseBody: boolean,
    guards: NormalizedGuard[]
  ) {
    let errorHandler: ControllerErrorHandler;
    let ctrl: any;
    let preparedGuards: { guard: CanActivate; params?: any[] }[] = [];

    try {
      req.pathParamsArr = pathParamsArr;
      const pathParams: AnyObj = pathParamsArr ? {} : undefined;
      pathParamsArr?.forEach((param) => (pathParams[param.key] = param.value));
      req.pathParams = pathParams;

      errorHandler = req.injector.get(ControllerErrorHandler);
      preparedGuards = guards.map((item) => {
        return {
          guard: req.injector.get(item.guard),
          params: item.params,
        };
      });
      ctrl = req.injector.get(controller);
    } catch (err) {
      this.sendInternalServerError(req.nodeRes, err);
      return;
    }

    try {
      for (const item of preparedGuards) {
        const canActivate = await item.guard.canActivate(item.params);
        if (canActivate !== true) {
          const status = typeof canActivate == 'number' ? canActivate : undefined;
          this.canNotActivateRoute(req.nodeReq, req.nodeRes, status);
          return;
        }
      }

      req.queryParams = parse(queryString);
      if (parseBody) {
        const bodyParser = req.injector.get(BodyParser) as BodyParser;
        req.body = await bodyParser.getBody();
      }

      await ctrl[methodName]();
    } catch (err) {
      errorHandler.handleError(err);
    }
  }

  protected canNotActivateRoute(nodeReq: NodeRequest, nodeRes: NodeResponse, status?: Status) {
    this.log.debug(`Can not activate the route with URL: ${nodeReq.method} ${nodeReq.url}`);
    nodeRes.statusCode = status || Status.UNAUTHORIZED;
    nodeRes.end();
  }

  /**
   * Logs an error and sends the user message about an internal server error (500).
   *
   * @param err An error to logs it (not sends).
   */
  protected sendInternalServerError(nodeRes: NodeResponse, err: Error) {
    this.log.error(err);
    nodeRes.statusCode = Status.INTERNAL_SERVER_ERROR;
    nodeRes.end();
  }

  /**
   * Compiles the path for the controller given the prefix.
   *
   * - If prefix `/api/posts/:postId` and route path `:postId`, this method returns path `/api/posts/:postId`.
   * - If prefix `/api/posts` and route path `:postId`, this method returns `/api/posts/:postId`
   */
  protected getPath(prefix: string, path: string) {
    const prefixLastPart = prefix?.split('/').slice(-1)[0];
    if (prefixLastPart?.charAt(0) == ':') {
      const reducedPrefix = prefix?.split('/').slice(0, -1).join('/');
      return [reducedPrefix, path].filter((s) => s).join('/');
    } else {
      return [prefix, path].filter((s) => s).join('/');
    }
  }

  protected checkRoutePath(moduleName: string, path: string) {
    if (path?.charAt(0) == '/') {
      throw new Error(`Invalid configuration of route '${path}' (in '${moduleName}'): path cannot start with a slash`);
    }
  }
}
