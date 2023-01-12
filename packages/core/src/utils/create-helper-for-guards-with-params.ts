import { Class } from '../di';
import { CanActivate } from '../types/mix';


/**
 * This factory creates a helper that makes it easier to work with guards that have parameters.
 * 
 * ### An example of creating a helper
 * 
```ts
import { createHelperForGuardWithParams } from '@ditsmod/core';

import { Permission } from './types';

export const requirePermissions = createHelperForGuardWithParams<Permission>(PermissionsGuard);
```
 * 
 * ### Usage
 * 
```ts
import { controller, Res, route } from '@ditsmod/core';

import { requirePermissions } from '../auth/guards-utils';
import { Permission } from '../auth/types';

@controller()
export class SomeController {
  @route('GET', 'administration', [requirePermissions(Permission.canActivateAdministration)])
  helloAdmin(res: Res) {
    res.send('some secret');
  }
}
```
 */
export function createHelperForGuardWithParams<T>(Guard: Class<CanActivate>) {
  return function requireArgs(...args: [T, ...T[]]): [Class<CanActivate>, T, ...T[]] {
    return [Guard, ...args];
  };
}
