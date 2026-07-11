import type { Class } from '@ditsmod/core';
import type { CanActivate } from '../interceptors/guard.js';

/**
 * This factory creates a helper that makes it easier to work with guards that have parameters.
 * 
 * ### An example of creating a helper
 * 
```ts
import { createGuardHelper } from '@ditsmod/core';

import { Permission } from './types.js';

export const requirePermissions = createGuardHelper<Permission>(PermissionsGuard);
```
 * 
 * ### Usage
 * 
```ts
import { controller, RequestContext, route } from '@ditsmod/core';

import { requirePermissions } from '../auth/guards-utils.js';
import { Permission } from '../auth/types.js';

@controller()
export class SomeController {
  @route('GET', 'administration', [requirePermissions(Permission.canActivateAdministration)])
  helloAdmin(ctx: RequestContext) {
    ctx.send('some secret');
  }
}
```
 */
export function createGuardHelper<T>(Guard: Class<CanActivate>): GuardHelper<T> {
  return function requireArgs(...args: [T, ...T[]]): [Class<CanActivate>, T, ...T[]] {
    return [Guard, ...args];
  };
}

export interface GuardHelper<T> {
  (...args: [T, ...T[]]): [Class<CanActivate>, T, ...T[]];
}
