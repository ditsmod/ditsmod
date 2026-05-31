import {
  Context,
  fromSelf,
  injectable,
  Injector,
  ResolvedGuardPerMod,
  skipSelf,
  Status,
  SystemLogMediator,
} from '@ditsmod/core';

import { CanActivate } from '../interceptors/guard.js';
import { RouteMeta } from '../types/route-data.js';
import { HttpHandler, HttpInterceptor } from './tokens-and-types.js';
import { applyResponse } from '#utils/apply-web-response.js';
import { RequestContext } from '#services/request-context.js';
import { RAW_REQ, RAW_RES, A_PATH_PARAMS, QUERY_STRING, QUERY_PARAMS, PATH_PARAMS } from '#types/constants.js';

@injectable()
export class InterceptorWithGuards implements HttpInterceptor {
  constructor(
    @skipSelf() protected routeMeta: RouteMeta,
    private injector: Injector,
  ) {}

  async intercept(next: HttpHandler, reqCtx: RequestContext) {
    if (this.routeMeta.resolvedGuardsPerMod)
      for (const item of this.routeMeta.resolvedGuardsPerMod) {
        const injectorPerReq = this.getInjectorPerReq(item);
        const guard = injectorPerReq.instantiateResolved(item.guard) as CanActivate;
        const result = await guard.canActivate(reqCtx, item.params);
        if (result !== true) {
          return this.sendResponse(reqCtx, result);
        }
      }
    if (this.routeMeta.resolvedGuards)
      for (const item of this.routeMeta.resolvedGuards) {
        const guard = this.injector.instantiateResolved(item.guard) as CanActivate;
        const result = await guard.canActivate(reqCtx, item.params);
        if (result !== true) {
          return this.sendResponse(reqCtx, result);
        }
      }

    return next.handle();
  }

  protected async sendResponse(reqCtx: RequestContext, result: false | Response) {
    if (result === false) {
      this.prohibitActivation(reqCtx);
      return;
    }
    await applyResponse(result, reqCtx.rawRes);
    return result;
  }

  protected getInjectorPerReq(rg: ResolvedGuardPerMod) {
    const inj = rg.injectorPerRou.createChildFromResolved(rg.resolvedPerReq!, 'Req');
    const ctx = this.injector.get(Context, undefined, undefined, fromSelf) as Context;
    ctx.fill(inj, [RAW_REQ, RAW_RES, A_PATH_PARAMS, QUERY_STRING, QUERY_PARAMS, PATH_PARAMS]);
    return inj;
  }

  protected prohibitActivation(reqCtx: RequestContext, status?: Status) {
    const systemLogMediator = this.injector.get(SystemLogMediator) as SystemLogMediator;
    systemLogMediator.youCannotActivateRoute(this, reqCtx.rawReq.method!, reqCtx.rawReq.url!);
    reqCtx.rawRes.statusCode = Status.UNAUTHORIZED;
    reqCtx.rawRes.end();
  }
}
