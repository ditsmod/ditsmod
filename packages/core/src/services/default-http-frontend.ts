import { parse } from 'querystring';

import { fromSelf, injectable, Injector } from '../di';
import { ControllerErrorHandler } from '../services/controller-error-handler';
import { HttpFrontend, HttpHandler } from '../types/http-interceptor';
import { AnyObj, CanActivate } from '../types/mix';
import { NodeRequest, NodeResponse } from '../types/server-options';
import { Status } from '../utils/http-status-codes';
import { RequestContext } from '../types/route-data';
import { SystemLogMediator } from '../log-mediator/system-log-mediator';

@injectable()
export class DefaultHttpFrontend implements HttpFrontend {
  constructor(protected injector: Injector, @fromSelf() private ctx: RequestContext) {}

  async intercept(next: HttpHandler) {
    try {
      const canActivate = await this.canActivate();
      if (!canActivate) {
        return;
      }
      this.setParams();
    } catch (err) {
      await this.callErrorHandler(err);
      return;
    }

    return next.handle().catch((err) => {
      return this.callErrorHandler(err);
    });
  }

  protected async canActivate() {
    const preparedGuards = this.ctx.routeMeta.guards.map<{ guard: CanActivate; params?: any[] }>((item) => {
      return {
        guard: this.injector.get(item.guard),
        params: item.params,
      };
    });

    for (const item of preparedGuards) {
      const canActivate = await item.guard.canActivate(item.params);
      if (canActivate !== true) {
        const status = typeof canActivate == 'number' ? canActivate : undefined;
        this.canNotActivateRoute(this.ctx.nodeReq, this.ctx.nodeRes, status);
        return false;
      }
    }

    return true;
  }

  protected canNotActivateRoute(nodeReq: NodeRequest, nodeRes: NodeResponse, status?: Status) {
    const systemLogMediator = this.injector.get(SystemLogMediator) as SystemLogMediator;
    systemLogMediator.youCannotActivateRoute(this, nodeReq.method!, nodeReq.url!);
    nodeRes.statusCode = status || Status.UNAUTHORIZED;
    nodeRes.end();
  }

  protected setParams() {
    if (this.ctx.queryString) {
      this.ctx.req.queryParams = parse(this.ctx.queryString);
    }
    if (this.ctx.aPathParams) {
      this.ctx.req.aPathParams = this.ctx.aPathParams;
      const pathParams: AnyObj = {};
      this.ctx.aPathParams.forEach((param) => (pathParams[param.key] = param.value));
      this.ctx.req.pathParams = pathParams;
    }
  }

  protected async callErrorHandler(err: any) {
    const errorHandler = this.injector.get(ControllerErrorHandler);
    await errorHandler.handleError(err);
  }
}
