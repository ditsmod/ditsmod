import { Injector, Status } from '@ditsmod/core';
import { RequestContext } from '@ditsmod/routing';

import { PermissionsGuard } from './permissions.guard.js';
import { AuthService } from './auth.service.js';

describe('PermissionsGuard#canActivate()', () => {
  const hasPermissions = jest.fn();
  let permissionsGuard: PermissionsGuard;
  const ctx = {} as RequestContext;

  beforeEach(() => {
    const injector = Injector.resolveAndCreate([
      PermissionsGuard,
      { token: AuthService, useValue: { hasPermissions } },
    ]);
    permissionsGuard = injector.get(PermissionsGuard) as PermissionsGuard;
  });

  it('should return forbidden', async () => {
    hasPermissions.mockReturnValue(false);
    await expect(permissionsGuard.canActivate(ctx)).resolves.not.toThrow();
    await expect(permissionsGuard.canActivate(ctx)).resolves.toMatchObject({ status: Status.FORBIDDEN });
  });

  it('should return true', async () => {
    hasPermissions.mockReturnValue(true);
    await expect(permissionsGuard.canActivate(ctx)).resolves.not.toThrow();
    await expect(permissionsGuard.canActivate(ctx)).resolves.toBe(true);
  });
});
