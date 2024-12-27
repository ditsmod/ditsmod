import { CanActivate, inject, Injector, QUERY_PARAMS, RequestContext, SingletonRequestContext } from '@ditsmod/core';

export class Guard implements CanActivate {
  constructor(@inject(QUERY_PARAMS) protected queryParams: any) {}

  canActivate(ctx: RequestContext) {
    return Boolean(this.queryParams?.allow);
  }
}

export class GuardPerRou implements CanActivate {
  canActivate(ctx: SingletonRequestContext) {
    return Boolean(ctx.queryParams?.allow);
  }
}
