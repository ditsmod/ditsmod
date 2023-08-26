import { HttpMethod } from './mix.js';
import { NodeRequest, NodeResponse } from './server-options.js';

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
  nodeReq: NodeRequest,
  nodeRes: NodeResponse,
  params: PathParam[],
  queryString: any
) => Promise<void>;

export class RouterReturns {
  handle: RouteHandler | null;
  params: PathParam[] | null;
}

export interface PathParam {
  key: string;
  value: string;
}
