import {
  A_PATH_PARAMS,
  CanActivate,
  HttpHandler,
  HttpInterceptor,
  injectable,
  Injector,
  NODE_REQ,
  NODE_RES,
  QUERY_STRING,
  RequestContext,
  ResolvedGuardPerMod,
  skipSelf,
  Status,
  SystemLogMediator,
} from '@ditsmod/core';

import { RouteMeta } from '../route-data.js';

@injectable()
export class InterceptorWithGuards implements HttpInterceptor {
  constructor(
    @skipSelf() protected routeMeta: RouteMeta,
    private injector: Injector,
  ) {}

  async intercept(next: HttpHandler, ctx: RequestContext) {
    if (this.routeMeta.resolvedGuardsPerMod)
      for (const item of this.routeMeta.resolvedGuardsPerMod) {
        const injectorPerReq = this.getInjectorPerReq(item);
        const guard = injectorPerReq.instantiateResolved(item.guard) as CanActivate;
        const canActivate = await guard.canActivate(ctx, item.params);
        if (canActivate !== true) {
          const status = typeof canActivate == 'number' ? canActivate : undefined;
          this.prohibitActivation(ctx, status);
          return;
        }
      }
    if (this.routeMeta.resolvedGuards)
      for (const item of this.routeMeta.resolvedGuards) {
        const guard = this.injector.instantiateResolved(item.guard) as CanActivate;
        const canActivate = await guard.canActivate(ctx, item.params);
        if (canActivate !== true) {
          const status = typeof canActivate == 'number' ? canActivate : undefined;
          this.prohibitActivation(ctx, status);
          return;
        }
      }

    return next.handle();
  }

  protected getInjectorPerReq(rg: ResolvedGuardPerMod) {
    const inj = rg.injectorPerRou.createChildFromResolved(rg.resolvedPerReq!);
    this.injector.fill(inj, [NODE_REQ, NODE_RES, A_PATH_PARAMS, QUERY_STRING]);
    return inj;
  }

  protected prohibitActivation(ctx: RequestContext, status?: Status) {
    const systemLogMediator = this.injector.get(SystemLogMediator) as SystemLogMediator;
    systemLogMediator.youCannotActivateRoute(this, ctx.nodeReq.method!, ctx.nodeReq.url!);
    ctx.send(undefined, status || Status.UNAUTHORIZED);
  }
}
