import {
  A_PATH_PARAMS,
  CanActivate,
  injectable,
  Injector,
  RAW_REQ,
  RAW_RES,
  QUERY_STRING,
  RequestContext,
  ResolvedGuardPerMod,
  skipSelf,
  Status,
  SystemLogMediator,
  QUERY_PARAMS,
  PATH_PARAMS,
} from '@ditsmod/core';

import { RouteMeta } from '../route-data.js';
import { HttpHandler, HttpInterceptor } from './tokens-and-types.js';

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
    const inj = rg.injectorPerRou.createChildFromResolved(rg.resolvedPerReq!, 'Req');
    this.injector.fill(inj, [RAW_REQ, RAW_RES, A_PATH_PARAMS, QUERY_STRING, QUERY_PARAMS, PATH_PARAMS]);
    return inj;
  }

  protected prohibitActivation(ctx: RequestContext, status?: Status) {
    const systemLogMediator = this.injector.get(SystemLogMediator) as SystemLogMediator;
    systemLogMediator.youCannotActivateRoute(this, ctx.rawReq.method!, ctx.rawReq.url!);
    ctx.send(undefined, status || Status.UNAUTHORIZED);
  }
}
