import { Injectable, Inject, Injector, TypeProvider } from 'ts-di';
import { format } from 'util';
import { ParsedUrlQuery, parse } from 'querystring';

import { NodeRequest, NodeReqToken, RouteParam } from './types/types';
import { BodyParser } from './services/body-parser';

@Injectable()
export class Request {
  /**
   * Array of route params.
   * For example, route `/api/resource/:param1/:param2` have two params.
   */
  routeParams: RouteParam[];
  queryParams: ParsedUrlQuery;
  rawBody: any;
  body: any;

  constructor(@Inject(NodeReqToken) public readonly nodeReq: NodeRequest, public injector: Injector) {}

  /**
   * Called by the `BootstrapModule` after founded a route.
   *
   * @param err Body parser's an error.
   * @param controller Controller class.
   * @param method Method of the Controller.
   */
  async handleRoute(
    controller: TypeProvider,
    method: string,
    routeParams: RouteParam[],
    queryString: string,
    parseBody: boolean
  ) {
    const ctrl = this.injector.get(controller);
    this.routeParams = routeParams;
    this.queryParams = parse(queryString);
    let err: Error;
    if (parseBody) {
      try {
        const bodyParser = this.injector.get(BodyParser) as BodyParser;
        this.rawBody = await bodyParser.getRawBody();
        this.body = await bodyParser.getJsonBody();
      } catch (e) {
        err = e;
      }
    }
    ctrl[method](err);
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
