import { CanActivate, guard, Injector, RequestContext } from '@ditsmod/core';

import { getSession } from '#mod/get-session.js';
import { AuthjsConfig } from './authjs.config.js';

@guard()
export class AuthjsPerRouGuard implements CanActivate {
  constructor(
    protected config: AuthjsConfig,
    protected injector: Injector,
  ) {}

  async canActivate(ctx: RequestContext, params?: any[]): Promise<boolean | Response> {
    const session = await getSession(ctx, this.config);
    if (!session) {
      return false;
    }
    ctx.auth = session;
    return true;
  }
}
