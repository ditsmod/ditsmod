import { injectable, Injector } from '#di';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { ModuleManager } from '#services/module-manager.js';
import { HttpInterceptor, HttpHandler, RequestContext } from '#types/http-interceptor.js';
import { CanActivate, GuardPerMod1 } from '#types/mix.js';
import { RouteMeta } from '#types/route-data.js';
import { Status } from '#utils/http-status-codes.js';

@injectable()
export class SingletonInterceptorWithGuards implements ISingletonInterceptorWithGuards {
  instantiatedGuards: InstantiatedGuard[] = [];

  constructor(
    protected injector: Injector,
    protected routeMeta: RouteMeta,
  ) {
    this.initGuards();
  }

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
    for (const item of this.instantiatedGuards) {
      const canActivate = await item.guard.canActivate(ctx, item.params);
      if (canActivate !== true) {
        const status = typeof canActivate == 'number' ? canActivate : undefined;
        this.prohibitActivation(ctx, status);
        return;
      }
    }

    return next.handle();
  }

  protected getInjectorPerReq(moduleManager: ModuleManager, guardPerMod1: GuardPerMod1) {
    const injectorPerMod = moduleManager.getInjectorPerMod(guardPerMod1.meta.module);
    const injectorPerRou = injectorPerMod.resolveAndCreateChild(guardPerMod1.meta.providersPerRou);
    const injectorPerReq = injectorPerRou.resolveAndCreateChild(guardPerMod1.meta.providersPerReq);
    return injectorPerReq;
  }

  protected initGuards() {
    this.routeMeta.resolvedGuards!.forEach((item) => {
      const guard = this.injector.instantiateResolved(item.guard) as CanActivate;
      this.instantiatedGuards.push({ guard, params: item.params });
    });
  }

  protected prohibitActivation(ctx: RequestContext, status?: Status) {
    const systemLogMediator = this.injector.get(SystemLogMediator) as SystemLogMediator;
    systemLogMediator.youCannotActivateRoute(this, ctx.nodeReq.method!, ctx.nodeReq.url!);
    ctx.send(undefined, status || Status.UNAUTHORIZED);
  }
}

export interface ISingletonInterceptorWithGuards extends HttpInterceptor {
  instantiatedGuards: InstantiatedGuard[];
}

export interface InstantiatedGuard {
  guard: CanActivate;
  params?: any[];
}
