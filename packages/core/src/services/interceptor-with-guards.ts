import {
  HttpHandler,
  HttpInterceptor,
  Injector,
  InterceptorContext,
  RouteMeta,
  Status,
  SystemLogMediator,
  injectable,
  skipSelf,
} from '@ditsmod/core';

@injectable()
export class InterceptorWithGuards implements HttpInterceptor {
  constructor(
    @skipSelf() protected routeMeta: RouteMeta,
    private injector: Injector,
  ) {}

  async intercept(next: HttpHandler, ctx: InterceptorContext) {
    for (const item of this.routeMeta.resolvedGuards) {
      const canActivate = await this.injector.instantiateResolved(item.guard).canActivate(item.params);
      if (canActivate !== true) {
        const status = typeof canActivate == 'number' ? canActivate : undefined;
        this.prohibitActivation(ctx, status);
        return;
      }
    }

    return next.handle();
  }

  prohibitActivation(ctx: InterceptorContext, status?: Status) {
    const systemLogMediator = this.injector.get(SystemLogMediator) as SystemLogMediator;
    systemLogMediator.youCannotActivateRoute(this, ctx.nodeReq.method!, ctx.nodeReq.url!);
    ctx.nodeRes.statusCode = status || Status.UNAUTHORIZED;
    ctx.nodeRes.end();
  }
}
