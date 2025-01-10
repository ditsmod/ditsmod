import {
  A_PATH_PARAMS,
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

import { CanActivate } from '../interceptors/guard.js';
import { RouteMeta } from '../route-data.js';
import { HttpHandler, HttpInterceptor } from './tokens-and-types.js';
import { applyResponse } from '#mod/utils/apply-web-response.js';

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
        const result = await guard.canActivate(ctx, item.params);
        if (result !== true) {
          return this.sendResponse(ctx, result);
        }
      }
    if (this.routeMeta.resolvedGuards)
      for (const item of this.routeMeta.resolvedGuards) {
        const guard = this.injector.instantiateResolved(item.guard) as CanActivate;
        const result = await guard.canActivate(ctx, item.params);
        if (result !== true) {
          return this.sendResponse(ctx, result);
        }
      }

    return next.handle();
  }

  protected async sendResponse(ctx: RequestContext, result: false | Response) {
    if (result === false) {
      this.prohibitActivation(ctx);
      return;
    }
    await applyResponse(result, ctx.rawRes);
    return result;
  }

  protected getInjectorPerReq(rg: ResolvedGuardPerMod) {
    const inj = rg.injectorPerRou.createChildFromResolved(rg.resolvedPerReq!, 'Req');
    this.injector.fill(inj, [RAW_REQ, RAW_RES, A_PATH_PARAMS, QUERY_STRING, QUERY_PARAMS, PATH_PARAMS]);
    return inj;
  }

  protected prohibitActivation(ctx: RequestContext, status?: Status) {
    const systemLogMediator = this.injector.get(SystemLogMediator) as SystemLogMediator;
    systemLogMediator.youCannotActivateRoute(this, ctx.rawReq.method!, ctx.rawReq.url!);
    ctx.rawRes.statusCode = Status.UNAUTHORIZED;
    ctx.rawRes.end();
  }
}
