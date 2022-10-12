import { Inject, Injectable } from '@ts-stack/di';
import { parse } from 'querystring';

import { ControllerErrorHandler } from '../services/controller-error-handler';
import { HttpFrontend, HttpHandler } from '../types/http-interceptor';
import { Req } from './request';
import { AnyObj, CanActivate } from '../types/mix';
import { PathParam } from '../types/router';
import { PATH_PARAMS, QUERY_STRING } from '../constans';
import { NodeRequest, NodeResponse } from '../types/server-options';
import { Status } from '../utils/http-status-codes';
import { LogMediator } from './log-mediator';
import { RouteMeta } from '../types/route-data';
import { RootMetadata } from '../models/root-metadata';

@Injectable()
export class DefaultHttpFrontend implements HttpFrontend {
  constructor(
    @Inject(PATH_PARAMS) protected aPathParams: PathParam[],
    @Inject(QUERY_STRING) protected queryString: any,
    protected routeMeta: RouteMeta,
    protected rootMetadata: RootMetadata,
    protected req: Req
  ) {}

  async intercept(next: HttpHandler) {
    try {
      const canActivate = await this.canActivate();
      if (!canActivate) {
        return;
      }
      this.setParams();
      this.req.nodeRes.setHeader('Server', this.rootMetadata.serverName);
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
        guard: this.req.injector.get(item.guard),
        params: item.params,
      };
    });

    for (const item of preparedGuards) {
      const canActivate = await item.guard.canActivate(item.params);
      if (canActivate !== true) {
        const status = typeof canActivate == 'number' ? canActivate : undefined;
        this.canNotActivateRoute(this.req.nodeReq, this.req.nodeRes, status);
        return false;
      }
    }

    return true;
  }

  protected canNotActivateRoute(nodeReq: NodeRequest, nodeRes: NodeResponse, status?: Status) {
    const logMediator = this.req.injector.get(LogMediator) as LogMediator;
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
    const errorHandler = this.req.injector.get(ControllerErrorHandler);
    await errorHandler.handleError(err);
  }
}
