import { Injectable, Inject, Injector } from 'ts-di';
import { format } from 'util';
import { ParsedUrlQuery, parse } from 'querystring';

import { NodeRequest, NodeReqToken, RouteParam } from './types';

@Injectable()
export class Request {
  /**
   * Array of route params.
   * For example, route `/api/resource/:param1/:param2` have two params.
   */
  routeParams: RouteParam[];
  queryParams: ParsedUrlQuery;

  constructor(@Inject(NodeReqToken) public readonly nodeReq: NodeRequest, public injector: Injector) {}

  /**
   * In inherited class you can to use standart `decodeURI(url)` function.
   * See inheritance in the docs.
   */
  decodeUrl(url: string) {
    return decodeURI(url);
  }

  /**
   * In inherited class you can to use standart `querystring.parse(qs: string)` method.
   * See inheritance in the docs.
   */
  parseQueryString(qs: string) {
    return parse(qs);
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
