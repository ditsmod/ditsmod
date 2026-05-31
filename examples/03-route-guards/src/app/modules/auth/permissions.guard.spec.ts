import { Injector, Status } from '@ditsmod/core';
import type { RequestContext } from '@ditsmod/rest';
import { jest } from '@jest/globals';

import { RequestScopedPermissionsGuard } from './permissions.guard.js';
import { AuthService } from './auth.service.js';

describe('PermissionsGuard#canActivate()', () => {
  const hasPermissions = jest.fn();
  let permissionsGuard: RequestScopedPermissionsGuard;
  const reqCtx = {} as RequestContext;

  beforeEach(() => {
    const injector = Injector.resolveAndCreate([
      RequestScopedPermissionsGuard,
      { token: AuthService, useValue: { hasPermissions } },
    ]);
    permissionsGuard = injector.get(RequestScopedPermissionsGuard) as RequestScopedPermissionsGuard;
  });

  it('should return forbidden', async () => {
    hasPermissions.mockReturnValue(false);
    await expect(permissionsGuard.canActivate(reqCtx)).resolves.not.toThrow();
    await expect(permissionsGuard.canActivate(reqCtx)).resolves.toMatchObject({ status: Status.FORBIDDEN });
  });

  it('should return true', async () => {
    hasPermissions.mockReturnValue(true);
    await expect(permissionsGuard.canActivate(reqCtx)).resolves.not.toThrow();
    await expect(permissionsGuard.canActivate(reqCtx)).resolves.toBe(true);
  });
});
