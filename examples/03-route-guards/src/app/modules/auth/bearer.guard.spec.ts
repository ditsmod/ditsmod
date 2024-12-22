import { RequestContext } from '@ditsmod/core';
import { describe, expect, it } from 'vitest';

import { BearerGuard } from './bearer.guard.js';

describe('AuthGuard#canActivate()', () => {
  const authGuard = new BearerGuard();
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
