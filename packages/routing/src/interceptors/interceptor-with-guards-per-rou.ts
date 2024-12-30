import { injectable, Injector, RequestContext, CanActivate, Status, SystemLogMediator } from '@ditsmod/core';

import { RouteMeta } from '../route-data.js';
import { HttpHandler, HttpInterceptor } from './tokens-and-types.js';
import { toDitsmodResponse } from '#mod/utils/to-ditsmod-response.js';

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
          if (result instanceof Response) {
            await toDitsmodResponse(result, ctx.rawRes);
            return result;
          }
          this.prohibitActivation(ctx);
          return;
        }
      }
    }
    for (const item of this.instantiatedGuards) {
      const result = await item.guard.canActivate(ctx, item.params);
      if (result !== true) {
        if (result instanceof Response) {
          await toDitsmodResponse(result, ctx.rawRes);
          return result;
        }
        this.prohibitActivation(ctx);
        return;
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

  protected prohibitActivation(ctx: RequestContext, status?: Status) {
    const systemLogMediator = this.injector.get(SystemLogMediator) as SystemLogMediator;
    systemLogMediator.youCannotActivateRoute(this, ctx.rawReq.method!, ctx.rawReq.url!);
    ctx.send(undefined, status || Status.UNAUTHORIZED);
  }
}

export interface IInterceptorWithGuardsPerRou extends HttpInterceptor {
  instantiatedGuards: InstantiatedGuard[];
}

export interface InstantiatedGuard {
  guard: CanActivate;
  params?: any[];
}
