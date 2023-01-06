import { parse } from 'querystring';

import { injectable, Injector } from '../di';
import { ControllerErrorHandler } from '../services/controller-error-handler';
import { HttpFrontend, HttpHandler } from '../types/http-interceptor';
import { AnyObj, CanActivate } from '../types/mix';
import { NodeRequest, NodeResponse } from '../types/server-options';
import { Status } from '../utils/http-status-codes';
import { RequestContext } from '../types/route-data';
import { SystemLogMediator } from '../log-mediator/system-log-mediator';

@injectable()
export class DefaultHttpFrontend implements HttpFrontend {
  constructor(protected injector: Injector) {}

  async intercept(ctx: RequestContext, next: HttpHandler) {
    try {
      const canActivate = await this.canActivate(ctx);
      if (!canActivate) {
        return;
      }
      this.setParams(ctx);
    } catch (err) {
      await this.callErrorHandler(ctx, err);
      return;
    }

    return next.handle(ctx).catch((err) => {
      return this.callErrorHandler(ctx, err);
    });
  }

  protected async canActivate(ctx: RequestContext) {
    const preparedGuards = ctx.routeMeta.guards.map<{ guard: CanActivate; params?: any[] }>((item) => {
      return {
        guard: this.injector.get(item.guard),
        params: item.params,
      };
    });

    for (const item of preparedGuards) {
      const canActivate = await item.guard.canActivate(ctx, item.params);
      if (canActivate !== true) {
        const status = typeof canActivate == 'number' ? canActivate : undefined;
        this.canNotActivateRoute(ctx.nodeReq, ctx.nodeRes, status);
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

  protected setParams(ctx: RequestContext) {
    if (ctx.queryString) {
      ctx.req.queryParams = parse(ctx.queryString);
    }
    if (ctx.aPathParams) {
      ctx.req.aPathParams = ctx.aPathParams;
      const pathParams: AnyObj = {};
      ctx.aPathParams.forEach((param) => (pathParams[param.key] = param.value));
      ctx.req.pathParams = pathParams;
    }
  }

  protected async callErrorHandler(ctx: RequestContext, err: any) {
    const errorHandler = this.injector.get(ControllerErrorHandler);
    await errorHandler.handleError(ctx, err);
  }
}
