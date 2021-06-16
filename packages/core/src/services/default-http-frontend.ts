import { Inject, Injectable } from '@ts-stack/di';
import { parse } from 'querystring';

import { ControllerErrorHandler } from '../services/controller-error-handler';
import { HttpFrontend, HttpHandler } from '../types/http-interceptor';
import { Request } from './request';
import { AnyObj, CanActivate } from '../types/mix';
import { PathParam } from '../types/router';
import { PATH_PARAMS, QUERY_STRING } from '../constans';
import { NodeRequest, NodeResponse } from '../types/server-options';
import { Status } from '../utils/http-status-codes';
import { Log } from './log';
import { RouteMeta } from '../types/route-data';
import { RootMetadata } from '../models/root-metadata';

@Injectable()
export class DefaultHttpFrontend implements HttpFrontend {
  constructor(
    @Inject(PATH_PARAMS) protected pathParamsArr: PathParam[],
    @Inject(QUERY_STRING) protected queryString: any,
    private log: Log,
    private routeMeta: RouteMeta,
    private rootMetadata: RootMetadata,
    private req: Request
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
    }

    return next.handle().catch((err) => {
      return this.loadErrorHandler(err);
    });
  }

  protected async canActivate() {
    const { guards } = this.routeMeta;
    const preparedGuards: { guard: CanActivate; params?: any[] }[] = guards.map((item) => {
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
    this.log.youCannotActivateRoute('debug', [nodeReq.method, nodeReq.url]);
    nodeRes.statusCode = status || Status.UNAUTHORIZED;
    nodeRes.end();
  }

  protected setParams() {
    if (this.queryString) {
      this.req.queryParams = parse(this.queryString);
    }
    if (this.pathParamsArr) {
      this.req.pathParamsArr = this.pathParamsArr;
      const pathParams: AnyObj = {};
      this.pathParamsArr.forEach((param) => (pathParams[param.key] = param.value));
      this.req.pathParams = pathParams;
    }
  }

  protected async loadErrorHandler(err: any) {
    const errorHandler = this.req.injector.get(ControllerErrorHandler);
    await errorHandler.handleError(err);
  }
}
