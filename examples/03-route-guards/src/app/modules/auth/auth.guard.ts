import { CanActivate, injectable, RequestContext } from '@ditsmod/core';

@injectable()
export class AuthGuard implements CanActivate {
  async canActivate(ctx: RequestContext, params?: any[]) {
    const authValue = ctx.nodeReq.headers.authorization?.split(' ');
    if (authValue?.[0] != 'Token') {
      return false;
    }

    /**
     * Here you need implement more logic.
     */
    const token = authValue[1];
    return Boolean(token);
  }
}
