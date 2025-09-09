import { Class } from '@ditsmod/core';
import { CanActivate } from '../interceptors/guard.js';

/**
 * This factory creates a helper that makes it easier to work with guards that have parameters.
 * 
 * ### An example of creating a helper
 * 
```ts
import { createHelperForGuardWithParams } from '@ditsmod/core';

import { Permission } from './types.js';

export const requirePermissions = createHelperForGuardWithParams<Permission>(PermissionsGuard);
```
 * 
 * ### Usage
 * 
```ts
import { controller, Res, route } from '@ditsmod/core';

import { requirePermissions } from '../auth/guards-utils.js';
import { Permission } from '../auth/types.js';

@controller()
export class SomeController {
  @route('GET', 'administration', [requirePermissions(Permission.canActivateAdministration)])
  helloAdmin(res: Res) {
    res.send('some secret');
  }
}
```
 */
export function createHelperForGuardWithParams<T>(Guard: Class<CanActivate>): HelperForGuardWithParams<T> {
  return function requireArgs(...args: [T, ...T[]]): [Class<CanActivate>, T, ...T[]] {
    return [Guard, ...args];
  };
}

export interface HelperForGuardWithParams<T> {
  (...args: [T, ...T[]]): [Class<CanActivate>, T, ...T[]];
}
