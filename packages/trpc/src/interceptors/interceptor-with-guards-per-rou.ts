import { injectable, Injector, SystemLogMediator } from '@ditsmod/core';
import { TRPCError } from '@trpc/server';

import { TrpcHttpHandler, TrpcHttpInterceptor } from './tokens-and-types.js';
import { applyResponse } from '#utils/apply-web-response.js';
import { TrpcCanActivate } from './trpc-guard.js';
import { TrpcRouteMeta } from '#types/trpc-route-data.js';
import { TrpcOpts } from '#types/types.js';

@injectable()
export class InterceptorWithGuardsPerRou implements IInterceptorWithGuardsPerRou {
  instantiatedGuards: InstantiatedGuard[] = [];

  constructor(
    protected injector: Injector,
    protected routeMeta: TrpcRouteMeta,
  ) {
    this.initGuards();
  }

  async intercept(next: TrpcHttpHandler, opts: TrpcOpts) {
    if (this.routeMeta.resolvedGuardsPerMod) {
      for (const item of this.routeMeta.resolvedGuardsPerMod) {
        const guard = item.injectorPerRou.instantiateResolved(item.guard) as TrpcCanActivate;
        const result = await guard.canActivate(opts, item.params);
        if (result !== true) {
          return this.sendResponse(opts, result);
        }
      }
    }
    for (const item of this.instantiatedGuards) {
      const result = await item.guard.canActivate(opts, item.params);
      if (result !== true) {
        return this.sendResponse(opts, result);
      }
    }

    return next.handle();
  }

  protected initGuards() {
    this.routeMeta.resolvedGuards!.forEach((item) => {
      const guard = this.injector.instantiateResolved(item.guard) as TrpcCanActivate;
      this.instantiatedGuards.push({ guard, params: item.params });
    });
  }

  protected async sendResponse(opts: TrpcOpts, result: false | Response) {
    if (result === false) {
      this.prohibitActivation(opts);
      return;
    }
    await applyResponse(result, opts.ctx.res);
    return result;
  }

  protected prohibitActivation(opts: TrpcOpts) {
    const systemLogMediator = this.injector.get(SystemLogMediator) as SystemLogMediator;
    systemLogMediator.youCannotActivateRoute(this, '', opts.ctx.req.url!);
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
}

export interface IInterceptorWithGuardsPerRou extends TrpcHttpInterceptor {
  instantiatedGuards: InstantiatedGuard[];
}

export interface InstantiatedGuard {
  guard: TrpcCanActivate;
  params?: any[];
}
