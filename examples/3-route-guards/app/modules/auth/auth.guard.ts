import { Injectable } from '@ts-stack/di';
import { CanActivate } from '@ditsmod/core';

@Injectable()
export class AuthGuard implements CanActivate {
  /**
   * Here you need implement more logic.
   */
  async canActivate(params: any[]) {
    return false;
  }
}
