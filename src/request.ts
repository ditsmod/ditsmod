import { Injectable, Inject, Injector, TypeProvider } from '@ts-stack/di';
import { format } from 'util';
import { parse } from 'querystring';

import { ObjectAny, ControllerErrorHandler } from './types/types';
import { BodyParser } from './services/body-parser';
import { PreRequest } from './services/pre-request';
import { RouteParam, GuardItems } from './types/router';
import { NodeReqToken, NodeResToken } from './types/injection-tokens';
import { NodeRequest, NodeResponse } from './types/server-options';
import { CanActivate } from './decorators/route';

@Injectable()
export class Request {
  /**
   * Object with path params.
   * For example, route `/api/resource/:param1/:param2` have two params.
   */
  pathParams?: any;
  /**
   * Array with path params.
   * For example, route `/api/resource/:param1/:param2` have two params.
   */
  pathParamsArr?: RouteParam[];
  /**
   * This value is set after checking `guard.canActivate()` and before parse the request body.
   * Here is the result of the `querystring.parse()` function,
   * so if query params are missing, there will be an empty object.
   */
  queryParams?: any;
  rawBody?: any;
  /**
   * This value is set after checking `guard.canActivate()` and seting `queryParams`.
   */
  body?: any;

  constructor(
    @Inject(NodeReqToken) public readonly nodeReq: NodeRequest,
    @Inject(NodeResToken) public readonly nodeRes: NodeResponse,
    public injector: Injector
  ) {}

  /**
   * Called by the `ModuleFactory` after founded a route.
   *
   * @param controller Controller class.
   * @param method Method of the Controller.
   * @param parseBody Need or not to parsing a body request.
   */
  async handleRoute(
    controller: TypeProvider,
    method: string,
    pathParamsArr: RouteParam[],
    queryString: string,
    parseBody: boolean,
    guardItems: GuardItems[]
  ) {
    this.pathParamsArr = pathParamsArr;
    const pathParams: ObjectAny = pathParamsArr ? {} : undefined;
    pathParamsArr?.forEach((param) => (pathParams[param.key] = param.value));
    this.pathParams = pathParams;
    let errorHandler: ControllerErrorHandler;
    let ctrl: any;
    let preparedGuardItems: { guard: CanActivate; params?: any[] }[] = [];

    try {
      errorHandler = this.injector.get(ControllerErrorHandler);
      preparedGuardItems = guardItems.map((item) => {
        return {
          guard: this.injector.get(item.guard),
          params: item.params,
        };
      });
      ctrl = this.injector.get(controller);
    } catch (err) {
      const preReq = this.injector.get(PreRequest);
      preReq.sendInternalServerError(this.nodeRes, err);
      return;
    }

    try {
      for (const item of preparedGuardItems) {
        const canActivate = await item.guard.canActivate(item.params);
        if (canActivate !== true) {
          const status = typeof canActivate == 'number' ? canActivate : undefined;
          const preReq = this.injector.get(PreRequest);
          preReq.canNotActivateRoute(this.nodeReq, this.nodeRes, status);
          return;
        }
      }

      this.queryParams = parse(queryString);
      if (parseBody) {
        const bodyParser = this.injector.get(BodyParser) as BodyParser;
        this.rawBody = await bodyParser.getRawBody();
        this.body = await bodyParser.getJsonBody();
      }

      await ctrl[method]();
    } catch (err) {
      errorHandler.handleError(err);
    }
  }

  /**
   * Check if the request is idempotent.
   */
  isIdempotent() {
    return ['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS', 'TRACE'].includes(this.nodeReq.method);
  }

  toString(): string {
    let headers = '';
    Object.keys(this.nodeReq.headers).forEach((k) => (headers += format('%s: %s\n', k, this.nodeReq.headers[k])));

    const { method, url, httpVersion } = this.nodeReq;
    return format('%s %s HTTP/%s\n%s', method, url, httpVersion, headers);
  }
}
