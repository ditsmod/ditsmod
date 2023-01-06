import { CanActivate, injectable, RequestContext } from '@ditsmod/core';

@injectable()
export class AuthGuard implements CanActivate {
  /**
   * Here you need implement more logic.
   */
  async canActivate(ctx: RequestContext, params: any[]) {
    return false;
  }
}
