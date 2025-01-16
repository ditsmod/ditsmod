import * as http from 'http';
import { HttpMethod, injectable, Injector } from '@ditsmod/core';

import { Tree } from './tree.js';
import { MethodTree, Fn } from '../types/types.js';
import { RawRequest, RawResponse } from './request.js';


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

@injectable()
export class DefaultRouter implements Router {
  private trees: MethodTree = {};

  constructor(private injector: Injector) {}

  on(method: HttpMethod, path: string, handle: Fn): this {
    if (path[0] != '/') {
      throw new Error("path must begin with '/'");
    }
    if (!this.trees[method]) {
      this.trees[method] = this.injector.resolveAndInstantiate(Tree) as Tree;
    }
    this.trees[method]!.addRoute(path, handle);
    return this;
  }

  all(path: string, handle: Fn): this {
    http.METHODS.forEach((method) => {
      this.on(method as HttpMethod, path, handle);
    });
    return this;
  }

  find(method: HttpMethod, path: string): RouterReturns {
    const tree = this.trees[method];
    if (tree) {
      return tree.search(path);
    }
    return { handle: null, params: null };
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
