import { Injectable } from '@ts-stack/di';

import { PreRouteData, RouteData } from '../decorators/controller';
import { Logger } from '../types/logger';
import { Router } from '../types/router';
import { pickProperties } from '../utils/pick-properties';

@Injectable()
export class PreRouting {
  constructor(protected router: Router, protected log: Logger) {}

  setRoutes(
    moduleName: string,
    prefixPerApp: string,
    prefixPerMod: string,
    preRoutesData: PreRouteData[]
  ) {
    this.checkRoutePath(moduleName, prefixPerApp);
    this.checkRoutePath(moduleName, prefixPerMod);
    const prefix = [prefixPerApp, prefixPerMod].filter((s) => s).join('/');

    preRoutesData.forEach((preRouteData) => {
      const route = preRouteData.route;
      const path = this.getPath(prefix, route.path);

      /**
       * `pickProperties()` is used here because no need `methodId` and `decoratorId` in the route.
       */
      const routeData = pickProperties(new RouteData(), preRouteData);
      this.router.on(route.httpMethod, `/${path}`, () => routeData);

      const logObj = {
        id: preRouteData.methodId,
        module: moduleName,
        httpMethod: route.httpMethod,
        path,
        guards: preRouteData.guards,
        handler: `${preRouteData.controller.name}.${preRouteData.methodName}()`,
      };

      if (!logObj.guards.length) {
        delete logObj.guards;
      }

      this.log.trace(logObj);
    });
  }

  /**
   * Compiles the path for the controller given the prefix.
   *
   * - If prefix `/api/posts/:postId` and route path `:postId`, this method returns path `/api/posts/:postId`.
   * - If prefix `/api/posts` and route path `:postId`, this method returns `/api/posts/:postId`
   */
  protected getPath(prefix: string, path: string) {
    const prefixLastPart = prefix?.split('/').slice(-1)[0];
    if (prefixLastPart?.charAt(0) == ':') {
      const reducedPrefix = prefix?.split('/').slice(0, -1).join('/');
      return [reducedPrefix, path].filter((s) => s).join('/');
    } else {
      return [prefix, path].filter((s) => s).join('/');
    }
  }

  protected checkRoutePath(moduleName: string, path: string) {
    if (path?.charAt(0) == '/') {
      throw new Error(
        `Invalid configuration of route '${path}' (in '${moduleName}'): path cannot start with a slash`
      );
    }
  }
}
