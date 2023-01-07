import { CanActivate, injectable, RequestContext } from '@ditsmod/core';

@injectable()
export class AuthGuard implements CanActivate {
  constructor(private ctx: RequestContext) {}
  /**
   * Here you need implement more logic.
   */
  async canActivate(params: any[]) {
    return false;
  }
}
