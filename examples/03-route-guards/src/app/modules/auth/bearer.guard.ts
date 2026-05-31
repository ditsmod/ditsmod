import { Injector, Context } from '@ditsmod/core';
import { CanActivate, guard, RequestContext } from '@ditsmod/rest';

import { SESSION } from './types.js';
import { AuthService } from './auth.service.js';

/***
 * This guard works only per request.
 */
@guard()
export class RequestScopedBearerGuard implements CanActivate {
  constructor(protected reqCtx: Context, protected authService: AuthService) {}

  async canActivate(reqCtx: RequestContext, params?: any[]) {
    const authValue = reqCtx.rawReq.headers.authorization?.split(' ');
    if (authValue?.[0] != 'Bearer') {
      return false;
    }

    /**
     * Here you need implement more logic.
     */
    const token = authValue[1];
    const session = await this.authService.getSession(token);
    this.reqCtx.set(SESSION, session);
    return Boolean(token);
  }
}

/***
 * This guard works only per route.
 */
@guard()
export class RouteScopedBearerGuard implements CanActivate {
  constructor(protected injector: Injector, protected authService: AuthService) {}

  async canActivate(reqCtx: RequestContext, params?: any[]) {
    const authValue = reqCtx.rawReq.headers.authorization?.split(' ');
    if (authValue?.[0] != 'Bearer') {
      return false;
    }

    /**
     * Here you need implement more logic.
     */
    const token = authValue[1];
    const session = await this.authService.getSession(token);
    reqCtx.auth = session;
    return Boolean(token);
  }
}
