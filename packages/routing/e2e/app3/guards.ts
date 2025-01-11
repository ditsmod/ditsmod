import { inject } from '@ditsmod/core';

import { CanActivate } from '#mod/interceptors/guard.js';
import { QUERY_PARAMS } from '#mod/constants.js';
import { RequestContext } from '#mod/request-context.js';

export class Guard implements CanActivate {
  constructor(@inject(QUERY_PARAMS) protected queryParams: any) {}

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
  constructor(@inject(QUERY_PARAMS) protected queryParams: any) {}

  canActivate(ctx: RequestContext) {
    return Boolean(this.queryParams?.allow == 2 || this.queryParams?.allow == 3);
  }
}

export class OtherGuardPerRou implements CanActivate {
  canActivate(ctx: RequestContext) {
    return Boolean(ctx.queryParams?.allow == 2 || ctx.queryParams?.allow == 3);
  }
}
