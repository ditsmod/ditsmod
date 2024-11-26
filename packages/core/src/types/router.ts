import { HttpMethod } from './mix.js';
import { RawRequest, RawResponse } from './server-options.js';

export class Router {
  on(method: HttpMethod, path: string, handle: RouteHandler): this {
    return this;
  }

  all(path: string, handle: RouteHandler): this {
    return this;
  }

  find(method: HttpMethod, path: string): RouterReturns {
    return { handle: null as any, params: null as any };
  }
}

export type RouteHandler = (
  rawReq: RawRequest,
  rawRes: RawResponse,
  params: PathParam[] | null,
  queryString: string,
) => Promise<void>;

export class RouterReturns {
  handle: RouteHandler | null;
  params: PathParam[] | null;
}

export interface PathParam {
  key: string;
  value: string;
}
