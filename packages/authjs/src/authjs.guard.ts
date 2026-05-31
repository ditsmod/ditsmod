import { Context } from '@ditsmod/core';
import { CanActivate, guard, RequestContext } from '@ditsmod/rest';

import { getSession } from '#mod/get-session.js';
import { AUTHJS_SESSION } from '#mod/constants.js';
import { AuthjsConfig } from './authjs.config.js';

@guard()
export class AuthjsGuard implements CanActivate {
  constructor(
    protected config: AuthjsConfig,
    protected ctx: Context,
  ) {}

  async canActivate(reqCtx: RequestContext, params?: any[]): Promise<boolean | Response> {
    const session = await getSession(reqCtx, this.config);
    if (!session) {
      return false;
    }
    reqCtx.auth = session;
    this.ctx.set(AUTHJS_SESSION, session);
    return true;
  }
}
