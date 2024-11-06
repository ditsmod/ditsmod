import { A_PATH_PARAMS, NODE_REQ, NODE_RES, QUERY_STRING } from '#constans';
import { injectable, skipSelf, Injector } from '#di';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { ModuleManager } from '#services/module-manager.js';
import { HttpInterceptor, HttpHandler, RequestContext } from '#types/http-interceptor.js';
import { GuardPerMod1 } from '#types/mix.js';
import { RouteMeta } from '#types/route-data.js';
import { Status } from '#utils/http-status-codes.js';

@injectable()
export class InterceptorWithGuards implements HttpInterceptor {
  constructor(
    @skipSelf() protected routeMeta: RouteMeta,
    private injector: Injector,
  ) {}

  async intercept(next: HttpHandler, ctx: RequestContext) {
    // @todo Refactor logic for guardsPerMod with resolved providers.
    if (this.routeMeta.guardsPerMod1) {
      const moduleManager = this.injector.get(ModuleManager) as ModuleManager;
      for (const item of this.routeMeta.guardsPerMod1) {
        const injectorPerReq = this.getInjectorPerReq(moduleManager, item);
        const canActivate = await injectorPerReq.get(item.guard).canActivate(ctx, item.params);
        if (canActivate !== true) {
          const status = typeof canActivate == 'number' ? canActivate : undefined;
          this.prohibitActivation(ctx, status);
          return;
        }
      }
    }
    if (this.routeMeta.resolvedGuards) {
      for (const item of this.routeMeta.resolvedGuards) {
        const canActivate = await this.injector.instantiateResolved(item.guard).canActivate(ctx, item.params);
        if (canActivate !== true) {
          const status = typeof canActivate == 'number' ? canActivate : undefined;
          this.prohibitActivation(ctx, status);
          return;
        }
      }
    }

    return next.handle();
  }

  protected getInjectorPerReq(moduleManager: ModuleManager, guardPerMod1: GuardPerMod1) {
    const injectorPerMod = moduleManager.getInjectorPerMod(guardPerMod1.meta.module);
    const injectorPerRou = injectorPerMod.resolveAndCreateChild(guardPerMod1.meta.providersPerRou);
    const injectorPerReq = injectorPerRou.resolveAndCreateChild(guardPerMod1.meta.providersPerReq);
    injectorPerReq.setByToken(NODE_REQ, this.injector.get(NODE_REQ));
    injectorPerReq.setByToken(NODE_RES, this.injector.get(NODE_RES));
    injectorPerReq.setByToken(A_PATH_PARAMS, this.injector.get(A_PATH_PARAMS));
    injectorPerReq.setByToken(QUERY_STRING, this.injector.get(QUERY_STRING));
    return injectorPerReq;
  }

  protected prohibitActivation(ctx: RequestContext, status?: Status) {
    const systemLogMediator = this.injector.get(SystemLogMediator) as SystemLogMediator;
    systemLogMediator.youCannotActivateRoute(this, ctx.nodeReq.method!, ctx.nodeReq.url!);
    ctx.send(undefined, status || Status.UNAUTHORIZED);
  }
}
