import { Injectable } from '@ts-stack/di';

import { RouteData } from './decorators/controller';
import { RouteMetadata } from './decorators/route';
import { Logger } from './types/logger';
import { Router } from './types/router';

@Injectable()
export class PreRouting {
  constructor(protected router: Router, protected log: Logger) {}

  setRoutes(
    moduleName: string,
    prefixPerApp: string,
    prefixPerMod: string,
    routesData: RouteData[]
  ) {
    this.checkRoutePath(moduleName, prefixPerApp);
    this.checkRoutePath(moduleName, prefixPerMod);
    const prefix = [prefixPerApp, prefixPerMod].filter((s) => s).join('/');

    routesData.forEach((routeData) => {
      const route: RouteMetadata = routeData.route;
      const path = this.getPath(prefix, route.path);

      this.router.on(route.httpMethod, `/${path}`, () => routeData);

      const logObj = {
        module: moduleName,
        httpMethod: route.httpMethod,
        path,
        guards: routeData.guards,
        handler: `${routeData.controller.name}.${routeData.methodName}()`,
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
   *
   * @todo Give this method the ability to override it via DI.
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
