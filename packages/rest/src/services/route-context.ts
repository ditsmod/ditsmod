import type { RawRequest, RawResponse } from './request.js';
import type { PathParam } from './router.js';
import { BaseRequestContext } from './base-request-context.js';

export class RouteContext extends BaseRequestContext {
  constructor(rawReq: RawRequest, rawRes: RawResponse, aPathParams: PathParam[] | null, queryString: string) {
    super();
    this.rawReq = rawReq;
    this.rawRes = rawRes;
    this.aPathParams = aPathParams;
    this.queryString = queryString;
    this.scope = 'route';
  }
}
