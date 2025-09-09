import { injectable, Injector, ResolvedGuardPerMod, skipSelf, Status, SystemLogMediator } from '@ditsmod/core';
import { TRPCError } from '@trpc/server';

import { RAW_REQ, RAW_RES } from '#types/types.js';
import { CanActivate } from './trpc-guard.js';
import { HttpInterceptor, HttpHandler } from './tokens-and-types.js';
import { TrpcRouteMeta } from '#types/trpc-route-data.js';
import { applyResponse } from '#utils/apply-web-response.js';
import { TrpcOpts } from '#types/constants.js';

@injectable()
export class InterceptorWithGuards implements HttpInterceptor {
  constructor(
    @skipSelf() protected routeMeta: TrpcRouteMeta,
    private injector: Injector,
  ) {}

  async intercept(next: HttpHandler, opts: TrpcOpts) {
    if (this.routeMeta.resolvedGuardsPerMod)
      for (const item of this.routeMeta.resolvedGuardsPerMod) {
        const injectorPerReq = this.getInjectorPerReq(item);
        const guard = injectorPerReq.instantiateResolved(item.guard) as CanActivate;
        const result = await guard.canActivate(opts, item.params);
        if (result !== true) {
          return this.sendResponse(opts, result);
        }
      }
    if (this.routeMeta.resolvedGuards)
      for (const item of this.routeMeta.resolvedGuards) {
        const guard = this.injector.instantiateResolved(item.guard) as CanActivate;
        const result = await guard.canActivate(opts, item.params);
        if (result !== true) {
          return this.sendResponse(opts, result);
        }
      }

    return next.handle();
  }

  protected async sendResponse(opts: TrpcOpts, result: false | Response) {
    if (result === false) {
      this.prohibitActivation(opts);
      return;
    }
    await applyResponse(result, opts.ctx.res);
    return result;
  }

  protected getInjectorPerReq(rg: ResolvedGuardPerMod) {
    const inj = rg.injectorPerRou.createChildFromResolved(rg.resolvedPerReq!, 'Req');
    this.injector.fill(inj, [RAW_REQ, RAW_RES]);
    return inj;
  }

  protected prohibitActivation(opts: TrpcOpts, status?: Status) {
    const systemLogMediator = this.injector.get(SystemLogMediator) as SystemLogMediator;
    systemLogMediator.youCannotActivateRoute(this, '', opts.ctx.req.url!);
    // ctx.rawRes.statusCode = Status.UNAUTHORIZED;
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
}
