import { injectable } from '@ts-stack/di';
import { CanActivate } from '@ditsmod/core';

@injectable()
export class AuthGuard implements CanActivate {
  /**
   * Here you need implement more logic.
   */
  async canActivate(params: any[]) {
    return false;
  }
}
