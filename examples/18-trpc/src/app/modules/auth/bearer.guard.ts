import { AnyObj } from '@ditsmod/core';
import { CanActivate, trpcGuard, TrpcOpts } from '@ditsmod/trpc';

import { AuthService } from '#auth/auth.service.js';

/***
 * This guard works only per route.
 */
@trpcGuard()
export class BearerGuard implements CanActivate {
  constructor(protected authService: AuthService) {}

  async canActivate(opts: TrpcOpts<{ auth: AnyObj }>, params?: any[]) {
    const authValue = opts.ctx.req.headers.authorization?.split(' ');
    if (authValue?.[0] != 'Bearer') {
      return false;
    }

    /**
     * Here you need implement more logic.
     */
    const token = authValue[1];
    const session = await this.authService.getSession(token);
    if (session) {
      opts.ctx.auth = session;
      return true;
    } else {
      return false;
    }
  }
}
