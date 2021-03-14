import * as http from 'http';
import { Injectable, ReflectiveInjector } from '@ts-stack/di';

import { Tree } from './tree';
import { HttpMethod, MethodTree, Fn } from './types';

@Injectable()
export class DefaultRouter {
  private trees: MethodTree = {};

  constructor(private injector: ReflectiveInjector) {}

  on(method: HttpMethod, path: string, handle: Fn) {
    if (path[0] != '/') {
      throw new Error("path must begin with '/' in path");
    }
    if (!this.trees[method]) {
      this.trees[method] = this.injector.resolveAndInstantiate(Tree) as Tree;
    }
    this.trees[method].addRoute(path, handle);
    return this;
  }

  all(path: string, handle: Fn) {
    http.METHODS.forEach((method: HttpMethod) => {
      this.on(method, path, handle);
    });
    return this;
  }

  find(method: HttpMethod, path: string) {
    const tree = this.trees[method];
    if (tree) {
      return tree.search(path);
    }
    return { handle: null, params: null };
  }
}
