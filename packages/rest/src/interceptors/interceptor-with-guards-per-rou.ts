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

  async intercept(next: HttpHandler, reqCtx: RequestContext) {
    if (this.routeMeta.resolvedGuardsPerMod) {
      for (const item of this.routeMeta.resolvedGuardsPerMod) {
        const guard = item.injectorPerRou.instantiateResolved(item.guard) as CanActivate;
        const result = await guard.canActivate(reqCtx, item.params);
        if (result !== true) {
          return this.sendResponse(reqCtx, result);
        }
      }
    }
    for (const item of this.instantiatedGuards) {
      const result = await item.guard.canActivate(reqCtx, item.params);
      if (result !== true) {
        return this.sendResponse(reqCtx, result);
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

  protected async sendResponse(reqCtx: RequestContext, result: false | Response) {
    if (result === false) {
      this.prohibitActivation(reqCtx);
      return;
    }
    await applyResponse(result, reqCtx.rawRes);
    return result;
  }

  protected prohibitActivation(reqCtx: RequestContext) {
    const systemLogMediator = this.injector.get(SystemLogMediator) as SystemLogMediator;
    systemLogMediator.youCannotActivateRoute(this, reqCtx.rawReq.method!, reqCtx.rawReq.url!);
    reqCtx.rawRes.statusCode = Status.UNAUTHORIZED;
    reqCtx.rawRes.end();
  }
}

export interface IInterceptorWithGuardsPerRou extends HttpInterceptor {
  instantiatedGuards: InstantiatedGuard[];
}

export interface InstantiatedGuard {
  guard: CanActivate;
  params?: any[];
}
