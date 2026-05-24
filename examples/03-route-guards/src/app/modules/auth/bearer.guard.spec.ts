import { Injector } from '@ditsmod/core';
import type { RequestContext } from '@ditsmod/rest';

import { BearerGuard } from './bearer.guard.js';
import { AuthService } from './auth.service.js';

describe('AuthGuard#canActivate()', () => {
  const authService = new AuthService();
  const authGuard = new BearerGuard(Injector.resolveAndCreate([]), authService);
  function getCtx(authorization: string) {
    return { rawReq: { headers: { authorization } } } as RequestContext;
  }

  it('should return false', async () => {
    const ctx = getCtx('');
    await expect(authGuard.canActivate(ctx)).resolves.not.toThrow();
    await expect(authGuard.canActivate(ctx)).resolves.toBe(false);
  });

  it('should return true', async () => {
    const ctx = getCtx('Bearer fake-toke-here');
    await expect(authGuard.canActivate(ctx)).resolves.not.toThrow();
    await expect(authGuard.canActivate(ctx)).resolves.toBe(true);
  });
});
