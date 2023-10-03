import { Injector, NODE_REQ, RequestContext } from '@ditsmod/core';

import { AuthGuard } from './auth.guard.js';

/**
 * @todo Refactor this.
 */
describe('AuthGuard#canActivate()', () => {
  function getCtx(authorization: string) {
    return { nodeReq: { headers: { authorization } } } as RequestContext;
  }

  function getGuard(authorization: string) {
    const nodeRequest = getCtx(authorization).nodeReq;
    const injector = Injector.resolveAndCreate([AuthGuard, { token: NODE_REQ, useValue: nodeRequest }]);
    return injector.get(AuthGuard) as AuthGuard;
  }

  it('should return false', async () => {
    const ctx = getCtx('');
    const authGuard = getGuard('');
    await expect(authGuard.canActivate(ctx)).resolves.not.toThrow();
    await expect(authGuard.canActivate(ctx)).resolves.toBe(false);
  });

  it('should return true', async () => {
    const auth = 'Token fake-toke-here';
    const ctx = getCtx(auth);
    const authGuard = getGuard(auth);
    await expect(authGuard.canActivate(ctx)).resolves.not.toThrow();
    await expect(authGuard.canActivate(ctx)).resolves.toBe(true);
  });
});
