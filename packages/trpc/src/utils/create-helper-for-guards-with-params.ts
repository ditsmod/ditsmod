import type { Class } from '@ditsmod/core';
import type { TrpcCanActivate } from '#interceptors/trpc-guard.js';

/**
 * This factory creates a helper that makes it easier to work with guards that have parameters.
 * 
 * ### An example of creating a helper
 * 
```ts
import { createGuardHelper } from '@ditsmod/trpc';

import { Permission } from './types.js';

export const requirePermissions = createGuardHelper<Permission>(PermissionsGuard);
```
 * 
 * ### Usage
 * 
```ts
import { trpcController, trpcRoute } from '@ditsmod/trpc';

import { requirePermissions } from '../auth/guards-utils.js';
import { Permission } from '../auth/types.js';

@trpcController()
export class SomeController {
  @trpcRoute([requirePermissions(Permission.canActivateAdministration)])
  helloAdmin(ctx: RequestContext) {
    ctx.send('some secret');
  }
}
```
 */
export function createGuardHelper<T>(Guard: Class<TrpcCanActivate>): GuardHelper<T> {
  return function requireArgs(...args: [T, ...T[]]): [Class<TrpcCanActivate>, T, ...T[]] {
    return [Guard, ...args];
  };
}

export interface GuardHelper<T> {
  (...args: [T, ...T[]]): [Class<TrpcCanActivate>, T, ...T[]];
}
