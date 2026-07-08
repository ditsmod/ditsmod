import { ctx } from '@ditsmod/core';

import { CanActivate } from '#interceptors/guard.js';
import { QUERY_PARAMS } from '../../src/top/constants.js';
import { RequestContext } from '#services/request-context.js';

export class Guard implements CanActivate {
  constructor(@ctx(QUERY_PARAMS) protected queryParams: any) {}

  canActivate(ctx: RequestContext) {
    return Boolean(this.queryParams?.allow == 1 || this.queryParams?.allow == 3);
  }
}

export class GuardPerRou implements CanActivate {
  canActivate(ctx: RequestContext) {
    return Boolean(ctx.queryParams?.allow == 1 || ctx.queryParams?.allow == 3);
  }
}

export class OtherGuard implements CanActivate {
  constructor(@ctx(QUERY_PARAMS) protected queryParams: any) {}

  canActivate(ctx: RequestContext) {
    return Boolean(this.queryParams?.allow == 2 || this.queryParams?.allow == 3);
  }
}

export class OtherGuardPerRou implements CanActivate {
  canActivate(ctx: RequestContext) {
    return Boolean(ctx.queryParams?.allow == 2 || ctx.queryParams?.allow == 3);
  }
}
