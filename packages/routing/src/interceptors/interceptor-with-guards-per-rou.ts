import { injectable, Injector, Status, SystemLogMediator } from '@ditsmod/core';

import { RouteMeta } from '../types/route-data.js';
import { HttpHandler, HttpInterceptor } from './tokens-and-types.js';
import { applyResponse } from '#utils/apply-web-response.js';
import { CanActivate } from './guard.js';
import { RequestContext } from '#services/request-context.js';

@injectable()
export class InterceptorWithGuardsPerRou implements IInterceptorWithGuardsPerRou {
  instantiatedGuards: InstantiatedGuard[] = [];

  constructor(
    protected injector: Injector,
    protected routeMeta: RouteMeta,
  ) {
    this.initGuards();
  }

  async intercept(next: HttpHandler, ctx: RequestContext) {
    if (this.routeMeta.resolvedGuardsPerMod) {
      for (const item of this.routeMeta.resolvedGuardsPerMod) {
        const guard = item.injectorPerRou.instantiateResolved(item.guard) as CanActivate;
        const result = await guard.canActivate(ctx, item.params);
        if (result !== true) {
          return this.sendResponse(ctx, result);
        }
      }
    }
    for (const item of this.instantiatedGuards) {
      const result = await item.guard.canActivate(ctx, item.params);
      if (result !== true) {
        return this.sendResponse(ctx, result);
      }
    }

    return next.handle();
  }

  protected initGuards() {
    this.routeMeta.resolvedGuards!.forEach((item) => {
      const guard = this.injector.instantiateResolved(item.guard) as CanActivate;
      this.instantiatedGuards.push({ guard, params: item.params });
    });
  }

  protected async sendResponse(ctx: RequestContext, result: false | Response) {
    if (result === false) {
      this.prohibitActivation(ctx);
      return;
    }
    await applyResponse(result, ctx.rawRes);
    return result;
  }

  protected prohibitActivation(ctx: RequestContext) {
    const systemLogMediator = this.injector.get(SystemLogMediator) as SystemLogMediator;
    systemLogMediator.youCannotActivateRoute(this, ctx.rawReq.method!, ctx.rawReq.url!);
    ctx.rawRes.statusCode = Status.UNAUTHORIZED;
    ctx.rawRes.end();
  }
}

export interface IInterceptorWithGuardsPerRou extends HttpInterceptor {
  instantiatedGuards: InstantiatedGuard[];
}

export interface InstantiatedGuard {
  guard: CanActivate;
  params?: any[];
}
