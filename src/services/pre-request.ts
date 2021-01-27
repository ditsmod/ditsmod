import { parse } from 'querystring';
import { Injectable, TypeProvider } from '@ts-stack/di';

import { NodeResponse, NodeRequest } from '../types/server-options';
import { Status } from '../utils/http-status-codes';
import { Logger } from '../types/logger';
import { Request } from '../request';
import { ObjectAny, ControllerErrorHandler } from '../types/types';
import { BodyParser } from '../services/body-parser';
import { CanActivate } from '../decorators/route';
import { GuardItems, RouteParam } from '../types/router';

@Injectable()
export class PreRequest {
  constructor(protected log: Logger) {}

  /**
   * Called by the `AppFactory` before call a router.
   */
  decodeUrl(url: string) {
    return decodeURI(url);
  }

  /**
   * Called by the `AppFactory` when a route is not found (404).
   */
  sendNotFound(nodeRes: NodeResponse) {
    nodeRes.statusCode = Status.NOT_FOUND;
    nodeRes.end();
  }

  /**
   * Logs an error and sends the user message about an internal server error (500).
   *
   * @param err An error to logs it (not sends).
   */
  sendInternalServerError(nodeRes: NodeResponse, err: Error) {
    this.log.error(err);
    nodeRes.statusCode = Status.INTERNAL_SERVER_ERROR;
    nodeRes.end();
  }

  /**
   * Logs an error and sends the user message about a bad request error (400).
   *
   * @param err An error to logs it (not sends).
   */
  sendBadRequestError(nodeRes: NodeResponse, err: Error) {
    this.log.error(err);
    nodeRes.statusCode = Status.BAD_REQUEST;
    nodeRes.end();
  }

  canNotActivateRoute(nodeReq: NodeRequest, nodeRes: NodeResponse, status?: Status) {
    this.log.debug(`Can not activate the route with URL: ${nodeReq.method} ${nodeReq.url}`);
    nodeRes.statusCode = status || Status.UNAUTHORIZED;
    nodeRes.end();
  }

  /**
   * Called by the `AppFactory` after founded a route.
   *
   * @param controller Controller class.
   * @param method Method of the Controller.
   * @param parseBody Need or not to parsing a body request.
   */
  async handleRoute(
    req: Request,
    controller: TypeProvider,
    method: string,
    pathParamsArr: RouteParam[],
    queryString: string,
    parseBody: boolean,
    guardItems: GuardItems[]
  ) {
    req.pathParamsArr = pathParamsArr;
    const pathParams: ObjectAny = pathParamsArr ? {} : undefined;
    pathParamsArr?.forEach((param) => (pathParams[param.key] = param.value));
    req.pathParams = pathParams;
    let errorHandler: ControllerErrorHandler;
    let ctrl: any;
    let preparedGuardItems: { guard: CanActivate; params?: any[] }[] = [];

    try {
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
        req.rawBody = await bodyParser.getRawBody();
        req.body = await bodyParser.getJsonBody();
      }

      await ctrl[method]();
    } catch (err) {
      errorHandler.handleError(err);
    }
  }
}
