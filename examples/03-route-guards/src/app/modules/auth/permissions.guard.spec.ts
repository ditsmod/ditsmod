import { Injector, RequestContext, Status } from '@ditsmod/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PermissionsGuard } from './permissions.guard.js';
import { AuthService } from './auth.service.js';

describe('PermissionsGuard#canActivate()', () => {
  const hasPermissions = vi.fn();
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
    await expect(permissionsGuard.canActivate(ctx)).resolves.toBe(Status.FORBIDDEN);
  });

  it('should return true', async () => {
    hasPermissions.mockReturnValue(true);
    await expect(permissionsGuard.canActivate(ctx)).resolves.not.toThrow();
    await expect(permissionsGuard.canActivate(ctx)).resolves.toBe(true);
  });
});
