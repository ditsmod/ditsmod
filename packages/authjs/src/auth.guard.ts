import { CanActivate, guard, inject, Injector, SingletonRequestContext } from '@ditsmod/core';
import { AuthConfig } from '@auth/core';

import { getSession } from '#mod/get-session.js';
import { AUTHJS_CONFIG, AUTHJS_SESSION } from '#mod/constants.js';

@guard()
export class AuthjsGuard implements CanActivate {
  constructor(
    @inject(AUTHJS_CONFIG) protected authConfig: AuthConfig,
    protected injector: Injector,
  ) {}

  async canActivate(ctx: SingletonRequestContext, params?: any[]): Promise<boolean | number> {
    const session = await getSession(ctx, this.authConfig);
    if (!session) {
      return false;
    }
    if (this.injector.hasToken(AUTHJS_SESSION)) {
      this.injector.setByToken(AUTHJS_SESSION, session); // For controllers per request.
    } else {
      ctx.auth = session; // For controllers per module.
    }
    return true;
  }
}
