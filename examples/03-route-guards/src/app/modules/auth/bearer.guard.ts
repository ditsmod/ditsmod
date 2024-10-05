import { CanActivate, guard, RequestContext } from '@ditsmod/core';

@guard()
export class BearerGuard implements CanActivate {
  async canActivate(ctx: RequestContext, params?: any[]) {
    console.log('BearerGuard');
    const authValue = ctx.nodeReq.headers.authorization?.split(' ');
    if (authValue?.[0] != 'Bearer') {
      return false;
    }

    /**
     * Here you need implement more logic.
     */
    const token = authValue[1];
    return Boolean(token);
  }
}

@guard()
export class OverriddenBearerGuard implements CanActivate {
  async canActivate(ctx: RequestContext, params?: any[]) {
    console.log('OverriddenBearerGuard');
    const authValue = ctx.nodeReq.headers.authorization?.split(' ');
    if (authValue?.[0] != 'Bearer') {
      return false;
    }

    /**
     * Here you need implement more logic.
     */
    const token = authValue[1];
    return Boolean(token);
  }
}
