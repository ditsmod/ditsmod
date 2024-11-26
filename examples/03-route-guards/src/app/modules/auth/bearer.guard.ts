import { CanActivate, guard, RequestContext } from '@ditsmod/core';

@guard()
export class BearerGuard implements CanActivate {
  async canActivate(ctx: RequestContext, params?: any[]) {
    const authValue = ctx.rawReq.headers.authorization?.split(' ');
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
