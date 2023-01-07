import * as http from 'http';
import { injectable, Injector } from '@ditsmod/core';
import { Router, RouterReturns } from '@ditsmod/core';

import { Tree } from './tree';
import { HttpMethod, MethodTree, Fn } from './types';

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
