import { Injectable, Inject, Injector, TypeProvider } from 'ts-di';
import { format } from 'util';
import { parse } from 'querystring';

import { NodeRequest, NodeResponse, ObjectAny } from './types/types';
import { BodyParser } from './services/body-parser';
import { PreRequest } from './services/pre-request';
import { RouteParam } from './types/router';
import { NodeReqToken, NodeResToken } from './types/injection-tokens';

@Injectable()
export class Request {
  /**
   * Object with route params.
   * For example, route `/api/resource/:param1/:param2` have two params.
   */
  routeParams?: any;
  /**
   * Array with route params.
   * For example, route `/api/resource/:param1/:param2` have two params.
   */
  routeParamsArr?: RouteParam[];
  queryParams?: any;
  rawBody?: any;
  body?: any;
  routeData?: any;

  constructor(
    @Inject(NodeReqToken) public readonly nodeReq: NodeRequest,
    @Inject(NodeResToken) public readonly nodeRes: NodeResponse,
    public injector: Injector
  ) {}

  /**
   * Called by the `ModuleFactory` after founded a route.
   *
   * @param err Body parser's an error.
   * @param controller Controller class.
   * @param method Method of the Controller.
   * @param parseBody Need or not to parsing a body request.
   * @param checkAccept Need or not to checking `accept` header from a request.
   */
  async handleRoute(
    controller: TypeProvider,
    method: string,
    routeParamsArr: RouteParam[],
    queryString: string,
    parseBody: boolean,
    routeData: any
  ) {
    const routeParams: ObjectAny = {};
    this.routeParamsArr = routeParamsArr;
    routeParamsArr?.forEach(param => (routeParams[param.key] = param.value));
    this.routeParams = routeParams;
    this.routeData = routeData;
    let ctrl: any;
    try {
      ctrl = this.injector.get(controller);
    } catch (err) {
      const preReq = this.injector.get(PreRequest);
      preReq.sendInternalServerError(this.nodeRes, err);
      return;
    }

    try {
      this.queryParams = parse(queryString);
      if (parseBody) {
        const bodyParser = this.injector.get(BodyParser) as BodyParser;
        this.rawBody = await bodyParser.getRawBody();
        this.body = await bodyParser.getJsonBody();
      }
    } catch (err) {
      const preReq = this.injector.get(PreRequest);
      preReq.sendBadRequestError(this.nodeRes, err);
      return;
    }
    ctrl[method]();
  }

  /**
   * Check if the request is idempotent.
   */
  isIdempotent() {
    return ['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS', 'TRACE'].includes(this.nodeReq.method);
  }

  toString(): string {
    let headers = '';
    Object.keys(this.nodeReq.headers).forEach(k => (headers += format('%s: %s\n', k, this.nodeReq.headers[k])));

    const { method, url, httpVersion } = this.nodeReq;
    return format('%s %s HTTP/%s\n%s', method, url, httpVersion, headers);
  }
}
