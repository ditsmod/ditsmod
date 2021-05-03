import { Injectable, Inject, Injector } from '@ts-stack/di';
import { format } from 'util';
import { NODE_REQ, NODE_RES } from '../constans';
import { PathParam } from '../types/router';

import { NodeRequest, NodeResponse } from '../types/server-options';

@Injectable()
export class Request {
  /**
   * Object with path params.
   * For example, route `/api/resource/:param1/:param2` have two params.
   */
  pathParams?: any = {};
  /**
   * Array with path params.
   * For example, route `/api/resource/:param1/:param2` have two params.
   */
  pathParamsArr?: PathParam[] = [];
  /**
   * This value is set after checking `guard.canActivate()` and before parse the request body.
   * Here is the result of the `querystring.parse()` function,
   * so if query params are missing, there will be an empty object.
   */
  queryParams?: any = {};
  /**
   * This value is set after checking `guard.canActivate()` and seting `queryParams`.
   */
  body?: any;

  constructor(
    @Inject(NODE_REQ) public readonly nodeReq: NodeRequest,
    @Inject(NODE_RES) public readonly nodeRes: NodeResponse,
    public injector: Injector
  ) {}

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
