import { Injectable, ReflectiveInjector } from '@ts-stack/di';

import { Extension } from '../types/extension';
import { ExtensionsMap } from '../types/extensions-map';
import { HttpHandler } from '../types/http-interceptor';
import { HttpMethod } from '../types/http-method';
import { Logger } from '../types/logger';
import { RouteData } from '../types/route-data';
import { PathParam, RouteHandler, Router } from '../types/router';
import { NodeReqToken, NodeRequest, NodeResponse, NodeResToken, RequestListener } from '../types/server-options';
import { Status } from '../utils/http-status-codes';
import { PreRoutes } from './pre-routes';
import { Request } from './request';

@Injectable()
export class PreRouter implements Extension {
  constructor(protected injectorPerApp: ReflectiveInjector, protected router: Router, protected log: Logger) {}

  async init(prefixPerApp: string, extensionsMap: ExtensionsMap) {
    extensionsMap.forEach((extensionsMetadata) => {
      const preRoutes = this.injectorPerApp.resolveAndInstantiate(PreRoutes) as PreRoutes;
      const routesData = preRoutes.getRoutesData(extensionsMetadata);
      const { prefixPerMod, moduleMetadata } = extensionsMetadata;
      this.setRoutes(moduleMetadata.name, prefixPerApp, prefixPerMod, routesData);
    });
  }

  requestListener: RequestListener = async (nodeReq, nodeRes) => {
    const { method: httpMethod, url } = nodeReq;
    const [uri, queryString] = this.decodeUrl(url).split('?');
    const { handle, params } = this.router.find(httpMethod as HttpMethod, uri);
    if (!handle) {
      this.sendNotFound(nodeRes);
      return;
    }
    await handle(nodeReq, nodeRes, params, queryString);
  };

  protected setRoutes(moduleName: string, prefixPerApp: string, prefixPerMod: string, routesData: RouteData[]) {
    this.checkRoutePath(moduleName, prefixPerApp);
    this.checkRoutePath(moduleName, prefixPerMod);
    const prefix = [prefixPerApp, prefixPerMod].filter((s) => s).join('/');

    routesData.forEach((routeData) => {
      /**
       * @param injector Injector per module that tied to the route.
       * @param providers Resolved providers per request.
       * @param methodName Method of the class controller.
       * @param parseBody Need or not to parse body.
       */
      const { route, injector, providers, controller, methodName, parseBody, guards } = routeData;

      const handle = (async (nodeReq: NodeRequest, nodeRes: NodeResponse, params: PathParam[], queryString: any) => {
        const injector1 = injector.resolveAndCreateChild([
          { provide: NodeReqToken, useValue: nodeReq },
          { provide: NodeResToken, useValue: nodeRes },
        ]);
        const injector2 = injector1.createChildFromResolved(providers);
        const req = injector2.get(Request) as Request;

        // First HTTP handler in the chain of HTTP interceptors.
        const chain = injector2.get(HttpHandler) as HttpHandler;
        await chain.handle(req, params, queryString, controller, methodName, parseBody, guards);
      }) as RouteHandler;

      const path = this.getPath(prefix, route.path);

      if (route.httpMethod == 'ALL') {
        this.router.all(`/${path}`, handle);
      } else {
        this.router.on(route.httpMethod, `/${path}`, handle);
      }
    });
  }

  protected decodeUrl(url: string) {
    return decodeURI(url);
  }

  protected sendNotFound(nodeRes: NodeResponse) {
    nodeRes.statusCode = Status.NOT_FOUND;
    nodeRes.end();
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
      throw new Error(`Invalid configuration of route '${path}' (in '${moduleName}'): path cannot start with a slash`);
    }
  }
}
