import { CanActivate, inject, QUERY_PARAMS, RequestContext, SingletonRequestContext } from '@ditsmod/core';

export class Guard implements CanActivate {
  constructor(@inject(QUERY_PARAMS) protected queryParams: any) {}

  canActivate(ctx: RequestContext) {
    return Boolean(this.queryParams?.allow == 1 || this.queryParams?.allow == 2);
  }
}

export class GuardPerRou implements CanActivate {
  canActivate(ctx: SingletonRequestContext) {
    return Boolean(ctx.queryParams?.allow == 1 || ctx.queryParams?.allow == 2);
  }
}

export class OtherGuard implements CanActivate {
  constructor(@inject(QUERY_PARAMS) protected queryParams: any) {}

  canActivate(ctx: RequestContext) {
    return Boolean(this.queryParams?.allow == 2);
  }
}

export class OtherGuardPerRou implements CanActivate {
  canActivate(ctx: SingletonRequestContext) {
    return Boolean(ctx.queryParams?.allow == 2);
  }
}
