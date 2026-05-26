import { ctx } from '@ditsmod/core';

import { CanActivate } from '#interceptors/guard.js';
import { QUERY_PARAMS } from '#types/constants.js';
import { RequestContext } from '#services/request-context.js';

export class Guard implements CanActivate {
  constructor(@ctx(QUERY_PARAMS) protected queryParams: any) {}

  canActivate(reqCtx: RequestContext) {
    return Boolean(this.queryParams?.allow == 1 || this.queryParams?.allow == 3);
  }
}

export class GuardPerRou implements CanActivate {
  canActivate(reqCtx: RequestContext) {
    return Boolean(reqCtx.queryParams?.allow == 1 || reqCtx.queryParams?.allow == 3);
  }
}

export class OtherGuard implements CanActivate {
  constructor(@ctx(QUERY_PARAMS) protected queryParams: any) {}

  canActivate(reqCtx: RequestContext) {
    return Boolean(this.queryParams?.allow == 2 || this.queryParams?.allow == 3);
  }
}

export class OtherGuardPerRou implements CanActivate {
  canActivate(reqCtx: RequestContext) {
    return Boolean(reqCtx.queryParams?.allow == 2 || reqCtx.queryParams?.allow == 3);
  }
}
