import { parse } from 'querystring';

import { inject, injectable, Injector, skipSelf } from '../di';
import { HttpFrontend, HttpHandler } from '../types/http-interceptor';
import { AnyObj, CanActivate } from '../types/mix';
import { Status } from '../utils/http-status-codes';
import { RouteMeta } from '../types/route-data';
import { SystemLogMediator } from '../log-mediator/system-log-mediator';
import { A_PATH_PARAMS, QUERY_STRING, NODE_REQ, NODE_RES, QUERY_PARAMS, PATH_PARAMS } from '../constans';
import { PathParam } from '../types/router';

@injectable()
export class DefaultHttpFrontend implements HttpFrontend {
  constructor(
    protected injector: Injector,
    @skipSelf() private routeMeta: RouteMeta,
    @inject(A_PATH_PARAMS) private aPathParams?: PathParam[],
    @inject(QUERY_STRING) private queryString?: string
  ) {}

  async intercept(next: HttpHandler) {
    if (!this.routeMeta.resolvedGuards.length || (await this.canActivate())) {
      this.setParams();
      return next.handle();
    }
  }

  protected async canActivate() {
    const preparedGuards = this.routeMeta.resolvedGuards.map<{ guard: CanActivate; params?: any[] }>((item) => {
      return {
        guard: this.injector.instantiateResolved(item.guard),
        params: item.params,
      };
    });

    for (const item of preparedGuards) {
      const canActivate = await item.guard.canActivate(item.params);
      if (canActivate !== true) {
        const status = typeof canActivate == 'number' ? canActivate : undefined;
        this.prohibitActivation(status);
        return false;
      }
    }

    return true;
  }

  protected prohibitActivation(status?: Status) {
    const nodeReq = this.injector.get(NODE_REQ);
    const nodeRes = this.injector.get(NODE_RES);
    const systemLogMediator = this.injector.get(SystemLogMediator) as SystemLogMediator;
    systemLogMediator.youCannotActivateRoute(this, nodeReq.method!, nodeReq.url!);
    nodeRes.statusCode = status || Status.UNAUTHORIZED;
    nodeRes.end();
  }

  protected setParams() {
    if (this.queryString) {
      this.injector.setByToken(QUERY_PARAMS, parse(this.queryString));
    }
    if (this.aPathParams?.length) {
      const pathParams: AnyObj = {};
      this.aPathParams.forEach((param) => (pathParams[param.key] = param.value));
      this.injector.setByToken(PATH_PARAMS, pathParams);
    }
  }
}
