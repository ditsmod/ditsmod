import { Injectable, ReflectiveInjector } from '@ts-stack/di';
import {
  BodyParserConfig,
  edk,
  HttpHandler,
  HttpMethod,
  Logger,
  NodeReqToken,
  NodeRequest,
  NodeResponse,
  NodeResToken,
  PathParam,
  Request,
  RouteHandler,
  Router,
  Status,
} from '@ditsmod/core';
import { ReferenceObject, XParameterObject } from '@ts-stack/openapi-spec';

import { PreRoutes } from './services/pre-routes';
import { OasRouteData } from './types/oas-route-data';

@Injectable()
export class OpenapiExtension implements edk.Extension {
  constructor(protected injectorPerApp: ReflectiveInjector, private log: Logger, protected router: Router) {}

  async init(prefixPerApp: string, extensionsMap: edk.ExtensionsMap) {
    extensionsMap.forEach((extensionsMetadata) => {
      const preRoutes = this.injectorPerApp.resolveAndInstantiate(PreRoutes) as PreRoutes;
      const oasRoutesData = preRoutes.getRoutesData(extensionsMetadata);
      const { prefixPerMod, moduleMetadata } = extensionsMetadata;
      this.setRoutes(moduleMetadata.name, prefixPerApp, prefixPerMod, oasRoutesData);
    });
  }

  protected setRoutes(moduleName: string, prefixPerApp: string, prefixPerMod: string, routesData: OasRouteData[]) {
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
      const {
        httpMethod: lowCaseHttpMethods,
        path: routePath,
        parameters,
        injector,
        providers,
        controller,
        methodName,
        guards,
      } = routeData;
      const httpMethod = lowCaseHttpMethods.toUpperCase() as HttpMethod;

      const injectorPerReq = injector.createChildFromResolved(providers);
      const bodyParserConfig = injectorPerReq.get(BodyParserConfig) as BodyParserConfig;
      const parseBody = bodyParserConfig.acceptMethods.includes(httpMethod);

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
      const path = this.getPath(prefix, routePath, parameters);

      if (httpMethod == 'ALL') {
        this.router.all(`/${path}`, handle);
      } else {
        this.router.on(httpMethod, `/${path}`, handle);
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
  protected getPath(prefix: string, path: string, parameters: (ReferenceObject | XParameterObject<any>)[]) {
    const parameterObjects = (parameters || []).filter((p) => !p.$ref) as XParameterObject[];
    const pathParams = parameterObjects
      .filter((p) => p.in == 'path')
      .map((p) => p.name)
      .join('/:');

    if (pathParams) {
      path = `${path}/:${pathParams}`;
    }
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
