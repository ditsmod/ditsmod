import { CanActivate, injectable, Req } from '@ditsmod/core';

@injectable()
export class AuthGuard implements CanActivate {
  constructor(private req: Req) {}
  /**
   * Here you need implement more logic.
   */
  async canActivate(params: any[]) {
    return false;
  }
}
