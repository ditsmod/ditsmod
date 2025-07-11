import { Injector } from '@ditsmod/core';
import { CanActivate, guard, RequestContext } from '@ditsmod/rest';

import { SESSION } from './types.js';
import { AuthService } from './auth.service.js';

/***
 * This guard works only per request.
 */
@guard()
export class BearerGuard implements CanActivate {
  constructor(protected injector: Injector, protected authService: AuthService) {}

  async canActivate(ctx: RequestContext, params?: any[]) {
    const authValue = ctx.rawReq.headers.authorization?.split(' ');
    if (authValue?.[0] != 'Bearer') {
      return false;
    }

    /**
     * Here you need implement more logic.
     */
    const token = authValue[1];
    const session = await this.authService.getSession(token);
    this.injector.setByToken(SESSION, session);
    return Boolean(token);
  }
}

/***
 * This guard works only per route.
 */
@guard()
export class BearerCtxGuard implements CanActivate {
  constructor(protected injector: Injector, protected authService: AuthService) {}

  async canActivate(ctx: RequestContext, params?: any[]) {
    const authValue = ctx.rawReq.headers.authorization?.split(' ');
    if (authValue?.[0] != 'Bearer') {
      return false;
    }

    /**
     * Here you need implement more logic.
     */
    const token = authValue[1];
    const session = await this.authService.getSession(token);
    ctx.auth = session;
    return Boolean(token);
  }
}
