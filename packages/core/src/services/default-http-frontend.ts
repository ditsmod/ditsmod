import { Inject, Injectable, Injector } from '@ts-stack/di';
import { parse } from 'querystring';

import { ControllerErrorHandler } from '../services/controller-error-handler';
import { HttpFrontend, HttpHandler } from '../types/http-interceptor';
import { Req } from './request';
import { AnyObj, CanActivate } from '../types/mix';
import { PathParam } from '../types/router';
import { NODE_RES, PATH_PARAMS, QUERY_STRING } from '../constans';
import { NodeRequest, NodeResponse } from '../types/server-options';
import { Status } from '../utils/http-status-codes';
import { LogMediator } from '../log-mediator/log-mediator';
import { RouteMeta } from '../types/route-data';
import { RootMetadata } from '../models/root-metadata';

@Injectable()
export class DefaultHttpFrontend implements HttpFrontend {
  constructor(
    @Inject(PATH_PARAMS) protected aPathParams: PathParam[],
    @Inject(QUERY_STRING) protected queryString: any,
    protected routeMeta: RouteMeta,
    protected rootMetadata: RootMetadata,
    protected req: Req,
    protected injector: Injector
  ) {}

  async intercept(next: HttpHandler) {
    try {
      const canActivate = await this.canActivate();
      if (!canActivate) {
        return;
      }
      this.setParams();
    } catch (err) {
      await this.loadErrorHandler(err);
      return;
    }

    return next.handle().catch((err) => {
      return this.loadErrorHandler(err);
    });
  }

  protected async canActivate() {
    const preparedGuards = this.routeMeta.guards.map<{ guard: CanActivate; params?: any[] }>((item) => {
      return {
        guard: this.injector.get(item.guard),
        params: item.params,
      };
    });

    for (const item of preparedGuards) {
      const canActivate = await item.guard.canActivate(item.params);
      if (canActivate !== true) {
        const status = typeof canActivate == 'number' ? canActivate : undefined;
        const nodeRes = this.injector.get(NODE_RES);
        this.canNotActivateRoute(this.req.nodeReq, nodeRes, status);
        return false;
      }
    }

    return true;
  }

  protected canNotActivateRoute(nodeReq: NodeRequest, nodeRes: NodeResponse, status?: Status) {
    const logMediator = this.injector.get(LogMediator) as LogMediator;
    logMediator.youCannotActivateRoute(this, nodeReq.method!, nodeReq.url!);
    nodeRes.statusCode = status || Status.UNAUTHORIZED;
    nodeRes.end();
  }

  protected setParams() {
    if (this.queryString) {
      this.req.queryParams = parse(this.queryString);
    }
    if (this.aPathParams) {
      this.req.aPathParams = this.aPathParams;
      const pathParams: AnyObj = {};
      this.aPathParams.forEach((param) => (pathParams[param.key] = param.value));
      this.req.pathParams = pathParams;
    }
  }

  protected async loadErrorHandler(err: any) {
    const errorHandler = this.injector.get(ControllerErrorHandler);
    await errorHandler.handleError(err);
  }
}
