import { Injector } from '@ditsmod/core';
import { CanActivate, guard, RequestContext } from '@ditsmod/rest';

import { getSession } from '#mod/get-session.js';
import { AuthjsConfig } from './authjs.config.js';

@guard()
export class AuthjsPerRouGuard implements CanActivate {
  constructor(
    protected config: AuthjsConfig,
    protected injector: Injector,
  ) {}

  async canActivate(reqCtx: RequestContext, params?: any[]): Promise<boolean | Response> {
    const session = await getSession(reqCtx, this.config);
    if (!session) {
      return false;
    }
    reqCtx.auth = session;
    return true;
  }
}
