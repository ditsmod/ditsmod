import { parse } from 'querystring';
import { Injectable, TypeProvider } from '@ts-stack/di';

import { NodeResponse, NodeRequest } from '../types/server-options';
import { Status } from '../utils/http-status-codes';
import { Logger } from '../types/logger';
import { Request } from '../request';
import { ObjectAny, ControllerErrorHandler, RequestListener } from '../types/types';
import { BodyParser } from '../services/body-parser';
import { CanActivate } from '../decorators/route';
import { NormalizedGuard, HttpMethod, RouteParam, Router } from '../types/router';
import { NodeReqToken, NodeResToken } from '../types/injection-tokens';
import { AppMetadata } from '../decorators/app-metadata';

@Injectable()
export class PreRequest {
  constructor(protected log: Logger, protected router: Router, protected appMetadata: AppMetadata) {}

  requestListener: RequestListener = (nodeReq, nodeRes) => {
    nodeRes.setHeader('Server', this.appMetadata.serverName);
    const { method: httpMethod, url } = nodeReq;
    const [uri, queryString] = this.decodeUrl(url).split('?');
    const { handle: handleRoute, params } = this.router.find(httpMethod as HttpMethod, uri);
    if (!handleRoute) {
      this.sendNotFound(nodeRes);
      return;
    }
    /**
     * @param injector Injector per module that tied to the route.
     * @param providers Resolved providers per request.
     * @param method Method of the class controller.
     * @param parseBody Need or not to parse body.
     */
    const { injector, providers, controller, method, parseBody, guardItems } = handleRoute();
    const inj1 = injector.resolveAndCreateChild([
      { provide: NodeReqToken, useValue: nodeReq },
      { provide: NodeResToken, useValue: nodeRes },
    ]);
    const inj2 = inj1.createChildFromResolved(providers);
    const req = inj2.get(Request) as Request;
    this.handleRoute(req, controller, method, params, queryString, parseBody, guardItems);
  };

  /**
   * Called by the `Application` before call a router.
   */
  protected decodeUrl(url: string) {
    return decodeURI(url);
  }

  /**
   * Called by the `Application` when a route is not found (404).
   */
  protected sendNotFound(nodeRes: NodeResponse) {
    nodeRes.statusCode = Status.NOT_FOUND;
    nodeRes.end();
  }

  /**
   * Called by the `Application` after founded a route.
   *
   * @param controller Controller class.
   * @param method Method of the Controller.
   * @param parseBody Need or not to parsing a body request.
   */
  protected async handleRoute(
    req: Request,
    controller: TypeProvider,
    method: string,
    pathParamsArr: RouteParam[],
    queryString: string,
    parseBody: boolean,
    guardItems: NormalizedGuard[]
  ) {
    let errorHandler: ControllerErrorHandler;
    let ctrl: any;
    let preparedGuardItems: { guard: CanActivate; params?: any[] }[] = [];

    try {
      req.pathParamsArr = pathParamsArr;
      const pathParams: ObjectAny = pathParamsArr ? {} : undefined;
      pathParamsArr?.forEach((param) => (pathParams[param.key] = param.value));
      req.pathParams = pathParams;

      errorHandler = req.injector.get(ControllerErrorHandler);
      preparedGuardItems = guardItems.map((item) => {
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
      for (const item of preparedGuardItems) {
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

      await ctrl[method]();
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
   * Logs an error and sends the user message about a bad request error (400).
   *
   * @param err An error to logs it (not sends).
   */
  protected sendBadRequestError(nodeRes: NodeResponse, err: Error) {
    this.log.error(err);
    nodeRes.statusCode = Status.BAD_REQUEST;
    nodeRes.end();
  }
}
