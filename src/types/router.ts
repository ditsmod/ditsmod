import { Type } from '@ts-stack/di';
import { CanActivate } from '../decorators/route';
import { NodeRequest, NodeResponse } from './server-options';

/**
 * `http.METHODS`
 */
export type HttpMethod =
  | 'ACL'
  | 'BIND'
  | 'CHECKOUT'
  | 'CONNECT'
  | 'COPY'
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'LINK'
  | 'LOCK'
  | 'M-SEARCH'
  | 'MERGE'
  | 'MKACTIVITY'
  | 'MKCALENDAR'
  | 'MKCOL'
  | 'MOVE'
  | 'NOTIFY'
  | 'OPTIONS'
  | 'PATCH'
  | 'POST'
  | 'PROPFIND'
  | 'PROPPATCH'
  | 'PURGE'
  | 'PUT'
  | 'REBIND'
  | 'REPORT'
  | 'SEARCH'
  | 'SOURCE'
  | 'SUBSCRIBE'
  | 'TRACE'
  | 'UNBIND'
  | 'UNLINK'
  | 'UNLOCK'
  | 'UNSUBSCRIBE'
  | 'All';

export interface NormalizedGuard {
  guard: Type<CanActivate>;
  params?: any[];
}

export type RouteHandler = (
  nodeReq: NodeRequest,
  nodeRes: NodeResponse,
  params: PathParam[],
  queryString: any
) => void;

export class Router {
  on(method: HttpMethod, path: string, handle: RouteHandler): this {
    return this;
  }

  all(path: string, handle: RouteHandler): this {
    return this;
  }

  find(method: HttpMethod, path: string): RouterReturns {
    return { handle: null, params: null };
  }
}

export class RouterReturns {
  handle: RouteHandler;
  params: PathParam[];
}

export interface PathParam {
  key: string;
  value: string;
}
