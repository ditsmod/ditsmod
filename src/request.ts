import { Injectable, Inject, Injector, TypeProvider, Type } from '@ts-stack/di';
import { format } from 'util';
import { parse } from 'querystring';

import { ObjectAny, ControllerErrorHandler } from './types/types';
import { BodyParser } from './services/body-parser';
import { PreRequest } from './services/pre-request';
import { RouteParam } from './types/router';
import { NodeReqToken, NodeResToken } from './types/injection-tokens';
import { NodeRequest, NodeResponse } from './types/server-options';
import { CanActivate, GuardMetadata } from './decorators/guard';

@Injectable()
export class Request {
  /**
   * Object with route params.
   * For example, route `/api/resource/:param1/:param2` have two params.
   */
  routeParams?: any;
  /**
   * Array with route params.
   * For example, route `/api/resource/:param1/:param2` have two params.
   */
  routeParamsArr?: RouteParam[];
  queryParams?: any;
  rawBody?: any;
  body?: any;

  constructor(
    @Inject(NodeReqToken) public readonly nodeReq: NodeRequest,
    @Inject(NodeResToken) public readonly nodeRes: NodeResponse,
    public injector: Injector
  ) {}

  /**
   * Called by the `ModuleFactory` after founded a route.
   *
   * @param controller Controller class.
   * @param method Method of the Controller.
   * @param parseBody Need or not to parsing a body request.
   */
  async handleRoute(
    controller: TypeProvider,
    method: string,
    routeParamsArr: RouteParam[],
    queryString: string,
    parseBody: boolean,
    guardsMetadataRaw: GuardMetadata[]
  ) {
    this.routeParamsArr = routeParamsArr;
    const routeParams: ObjectAny = routeParamsArr ? {} : undefined;
    routeParamsArr?.forEach((param) => (routeParams[param.key] = param.value));
    this.routeParams = routeParams;
    let errorHandler: ControllerErrorHandler;
    let ctrl: any;
    let guardsMetadata: { guard: CanActivate; params?: any[] }[] = [];

    try {
      errorHandler = this.injector.get(ControllerErrorHandler);
      guardsMetadata = guardsMetadataRaw.map((meta) => ({ guard: this.injector.get(meta.guard), params: meta.params }));
      ctrl = this.injector.get(controller);
    } catch (err) {
      const preReq = this.injector.get(PreRequest);
      preReq.sendInternalServerError(this.nodeRes, err);
      return;
    }

    try {
      for (const meta of guardsMetadata) {
        const canActivate = await meta.guard.canActivate(meta.params);
        if (canActivate !== true) {
          const status = typeof canActivate == 'number' ? canActivate : undefined;
          const preReq = this.injector.get(PreRequest);
          preReq.canNotActivateRoute(this.nodeReq, this.nodeRes, status);
          return;
        }
      }

      this.queryParams = parse(queryString);
      if (parseBody) {
        const bodyParser = this.injector.get(BodyParser) as BodyParser;
        this.rawBody = await bodyParser.getRawBody();
        this.body = await bodyParser.getJsonBody();
      }

      await ctrl[method]();
    } catch (err) {
      errorHandler.handleError(err);
    }
  }

  /**
   * Check if the request is idempotent.
   */
  isIdempotent() {
    return ['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS', 'TRACE'].includes(this.nodeReq.method);
  }

  toString(): string {
    let headers = '';
    Object.keys(this.nodeReq.headers).forEach((k) => (headers += format('%s: %s\n', k, this.nodeReq.headers[k])));

    const { method, url, httpVersion } = this.nodeReq;
    return format('%s %s HTTP/%s\n%s', method, url, httpVersion, headers);
  }
}
