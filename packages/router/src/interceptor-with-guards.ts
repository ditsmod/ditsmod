import {
  CanActivate,
  HttpHandler,
  HttpInterceptor,
  InterceptorContext,
  Status,
  SystemLogMediator,
  injectable,
} from '@ditsmod/core';

@injectable()
export class InterceptorWithGuards implements HttpInterceptor {
  async intercept(next: HttpHandler, ctx: InterceptorContext) {
    const preparedGuards = ctx.routeMeta.resolvedGuards.map<{ guard: CanActivate; params?: any[] }>((item) => {
      return {
        guard: ctx.injector.instantiateResolved(item.guard),
        params: item.params,
      };
    });

    for (const item of preparedGuards) {
      const canActivate = await item.guard.canActivate(item.params);
      if (canActivate !== true) {
        const status = typeof canActivate == 'number' ? canActivate : undefined;
        this.prohibitActivation(ctx, status);
      }
    }

    return next.handle();
  }

  prohibitActivation(ctx: InterceptorContext, status?: Status) {
    const systemLogMediator = ctx.injector.get(SystemLogMediator) as SystemLogMediator;
    systemLogMediator.youCannotActivateRoute(this, ctx.nodeReq.method!, ctx.nodeReq.url!);
    ctx.nodeRes.statusCode = status || Status.UNAUTHORIZED;
    ctx.nodeRes.end();
  }
}
