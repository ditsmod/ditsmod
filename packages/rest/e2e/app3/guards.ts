import { ctx, type Context } from '@ditsmod/core';

import { CanActivate } from '#interceptors/guard.js';
import { QUERY_PARAMS } from '#types/constants.js';

export class Guard implements CanActivate {
  constructor(@ctx(QUERY_PARAMS) protected queryParams: any) {}

  canActivate(ctx: Context) {
    return Boolean(this.queryParams?.allow == 1 || this.queryParams?.allow == 3);
  }
}

export class GuardPerRou implements CanActivate {
  canActivate(ctx: Context) {
    const queryParams = ctx.get(QUERY_PARAMS)!;
    return Boolean(queryParams?.allow == 1 || queryParams?.allow == 3);
  }
}

export class OtherGuard implements CanActivate {
  constructor(@ctx(QUERY_PARAMS) protected queryParams: any) {}

  canActivate(ctx: Context) {
    return Boolean(this.queryParams?.allow == 2 || this.queryParams?.allow == 3);
  }
}

export class OtherGuardPerRou implements CanActivate {
  canActivate(ctx: Context) {
    const queryParams = ctx.get(QUERY_PARAMS)!;
    return Boolean(queryParams?.allow == 2 || queryParams?.allow == 3);
  }
}
