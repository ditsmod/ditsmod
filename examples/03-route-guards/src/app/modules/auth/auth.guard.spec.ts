import { Injector, NODE_REQ, NodeRequest } from '@ditsmod/core';

import { AuthGuard } from './auth.guard';

describe('AuthGuard#canActivate()', () => {
  function getGuard(authorization: string) {
    const nodeRequest: Partial<NodeRequest> = { headers: { authorization } };
    const injector = Injector.resolveAndCreate([AuthGuard, { token: NODE_REQ, useValue: nodeRequest }]);
    return injector.get(AuthGuard) as AuthGuard;
  }

  it('should return false', async () => {
    const authGuard = getGuard('');
    await expect(authGuard.canActivate()).resolves.not.toThrow();
    await expect(authGuard.canActivate()).resolves.toBe(false);
  });

  it('should return true', async () => {
    const authGuard = getGuard('Token fake-toke-here');
    await expect(authGuard.canActivate()).resolves.not.toThrow();
    await expect(authGuard.canActivate()).resolves.toBe(true);
  });
});
