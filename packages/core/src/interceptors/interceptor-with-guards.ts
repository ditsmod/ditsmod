import { injectable, skipSelf, Injector } from '#di';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { HttpInterceptor, HttpHandler, RequestContext } from '#types/http-interceptor.js';
import { RouteMeta } from '#types/route-data.js';
import { Status } from '#utils/http-status-codes.js';

@injectable()
export class InterceptorWithGuards implements HttpInterceptor {
  constructor(
    @skipSelf() protected routeMeta: RouteMeta,
    private injector: Injector,
  ) {}

  async intercept(next: HttpHandler, ctx: RequestContext) {
    for (const item of this.routeMeta.resolvedGuards!) {
      const canActivate = await this.injector.instantiateResolved(item.guard).canActivate(ctx, item.params);
      if (canActivate !== true) {
        const status = typeof canActivate == 'number' ? canActivate : undefined;
        this.prohibitActivation(ctx, status);
        return;
      }
    }

    return next.handle();
  }

  protected prohibitActivation(ctx: RequestContext, status?: Status) {
    const systemLogMediator = this.injector.get(SystemLogMediator) as SystemLogMediator;
    systemLogMediator.youCannotActivateRoute(this, ctx.nodeReq.method!, ctx.nodeReq.url!);
    ctx.send(undefined, status || Status.UNAUTHORIZED);
  }
}
