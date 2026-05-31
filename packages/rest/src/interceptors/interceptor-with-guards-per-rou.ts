import { injectable, Injector, Status, SystemLogMediator, type Context } from '@ditsmod/core';

import { RouteMeta } from '../types/route-data.js';
import { HttpHandler, HttpInterceptor } from './tokens-and-types.js';
import { applyResponse } from '#utils/apply-web-response.js';
import { CanActivate } from './guard.js';
import { RAW_REQ, RAW_RES } from '#types/constants.js';

@injectable()
export class InterceptorWithGuardsPerRou implements IInterceptorWithGuardsPerRou {
  instantiatedGuards: InstantiatedGuard[] = [];

  constructor(
    protected injector: Injector,
    protected routeMeta: RouteMeta,
  ) {
    this.initGuards();
  }

  async intercept(next: HttpHandler, ctx: Context) {
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

  protected async sendResponse(ctx: Context, result: false | Response) {
    if (result === false) {
      this.prohibitActivation(ctx);
      return;
    }
    await applyResponse(result, ctx.get(RAW_RES, true)!);
    return result;
  }

  protected prohibitActivation(ctx: Context) {
    const systemLogMediator = this.injector.get(SystemLogMediator) as SystemLogMediator;
    const rawReq = ctx.get(RAW_REQ, true)!;
    const rawRes = ctx.get(RAW_RES, true)!;
    systemLogMediator.youCannotActivateRoute(this, rawReq.method!, rawReq.url!);
    rawRes.statusCode = Status.UNAUTHORIZED;
    rawRes.end();
  }
}

export interface IInterceptorWithGuardsPerRou extends HttpInterceptor {
  instantiatedGuards: InstantiatedGuard[];
}

export interface InstantiatedGuard {
  guard: CanActivate;
  params?: any[];
}
